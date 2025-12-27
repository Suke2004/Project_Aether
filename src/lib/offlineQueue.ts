/**
 * Offline Queue Management for the Attention Wallet system
 * Handles local transaction queuing, network connectivity detection, and synchronization
 * Requirements: 4.4, 8.1
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { QueuedTransaction, Transaction, Profile } from './types';
import { generateOfflineId, safeJsonParse } from './utils';
import { dbHelpers } from './supabase';

// Storage keys for AsyncStorage
const STORAGE_KEYS = {
  QUEUE: '@attention_wallet:offline_queue',
  LAST_SYNC: '@attention_wallet:last_sync',
  NETWORK_STATUS: '@attention_wallet:network_status',
} as const;

// Network connectivity check configuration
const CONNECTIVITY_CONFIG = {
  CHECK_URL: 'https://www.google.com/generate_204', // Google's connectivity check endpoint (mobile only)
  TIMEOUT: 5000, // 5 seconds timeout
  RETRY_INTERVAL: 30000, // 30 seconds between sync attempts
  MAX_RETRIES: 3, // Maximum retry attempts with exponential backoff
} as const;

/**
 * Network connectivity detection
 */
export const networkHelpers = {
  /**
   * Check if device has network connectivity
   * Uses platform-specific methods to avoid CORS issues on web
   */
  isOnline: async (): Promise<boolean> => {
    try {
      // Web-specific network detection
      if (Platform.OS === 'web') {
        // Use the Navigator.onLine API for web
        if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
          return navigator.onLine;
        }
        
        // Fallback: assume online if we can't detect (better UX)
        console.log('🌐 Web network detection: assuming online (no navigator.onLine)');
        return true;
      }

      // Mobile network detection using connectivity check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONNECTIVITY_CONFIG.TIMEOUT);

      const response = await fetch(CONNECTIVITY_CONFIG.CHECK_URL, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      // For web, if we get CORS errors, assume we're online
      if (Platform.OS === 'web') {
        console.log('🌐 Web network check failed (likely CORS), assuming online');
        return true;
      }
      
      console.log('Network connectivity check failed:', error);
      return false;
    }
  },

  /**
   * Store network status in AsyncStorage
   */
  setNetworkStatus: async (isOnline: boolean): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NETWORK_STATUS, JSON.stringify(isOnline));
    } catch (error) {
      console.error('Failed to store network status:', error);
    }
  },

  /**
   * Get stored network status from AsyncStorage
   */
  getNetworkStatus: async (): Promise<boolean> => {
    try {
      const status = await AsyncStorage.getItem(STORAGE_KEYS.NETWORK_STATUS);
      return safeJsonParse(status || 'true', true);
    } catch (error) {
      console.error('Failed to get network status:', error);
      return true; // Default to online
    }
  },
};

/**
 * Offline queue management
 */
export const queueHelpers = {
  /**
   * Add transaction to offline queue
   */
  enqueue: async (transaction: Omit<QueuedTransaction, 'id' | 'synced'>): Promise<string> => {
    try {
      const queuedTransaction: QueuedTransaction = {
        ...transaction,
        id: generateOfflineId(),
        synced: false,
      };

      const existingQueue = await queueHelpers.getQueue();
      const updatedQueue = [...existingQueue, queuedTransaction];

      await AsyncStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(updatedQueue));
      
      console.log('Transaction queued for offline sync:', queuedTransaction.id);
      return queuedTransaction.id;
    } catch (error) {
      console.error('Failed to enqueue transaction:', error);
      throw new Error('Failed to queue transaction for offline sync');
    }
  },

  /**
   * Get all queued transactions
   */
  getQueue: async (): Promise<QueuedTransaction[]> => {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.QUEUE);
      return safeJsonParse(queueData || '[]', []);
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  },

  /**
   * Get unsynced transactions from queue
   */
  getUnsyncedTransactions: async (): Promise<QueuedTransaction[]> => {
    try {
      const queue = await queueHelpers.getQueue();
      return queue.filter(transaction => !transaction.synced);
    } catch (error) {
      console.error('Failed to get unsynced transactions:', error);
      return [];
    }
  },

  /**
   * Mark transaction as synced
   */
  markAsSynced: async (transactionId: string): Promise<void> => {
    try {
      const queue = await queueHelpers.getQueue();
      const updatedQueue = queue.map(transaction =>
        transaction.id === transactionId
          ? { ...transaction, synced: true }
          : transaction
      );

      await AsyncStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(updatedQueue));
      console.log('Transaction marked as synced:', transactionId);
    } catch (error) {
      console.error('Failed to mark transaction as synced:', error);
      throw error;
    }
  },

  /**
   * Remove synced transactions from queue (cleanup)
   */
  cleanupSyncedTransactions: async (): Promise<void> => {
    try {
      const queue = await queueHelpers.getQueue();
      const unsyncedQueue = queue.filter(transaction => !transaction.synced);

      await AsyncStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(unsyncedQueue));
      console.log('Cleaned up synced transactions from queue');
    } catch (error) {
      console.error('Failed to cleanup synced transactions:', error);
    }
  },

  /**
   * Clear entire offline queue (use with caution)
   */
  clearQueue: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.QUEUE);
      console.log('Offline queue cleared');
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
    }
  },
};

/**
 * Synchronization helpers
 */
export const syncHelpers = {
  /**
   * Sync all unsynced transactions to the server
   */
  syncTransactions: async (userId: string): Promise<{ success: number; failed: number }> => {
    const results = { success: 0, failed: 0 };

    try {
      // Check network connectivity first
      const isOnline = await networkHelpers.isOnline();
      if (!isOnline) {
        console.log('Device is offline, skipping sync');
        return results;
      }

      const unsyncedTransactions = await queueHelpers.getUnsyncedTransactions();
      console.log(`Syncing ${unsyncedTransactions.length} unsynced transactions`);

      // Process transactions sequentially to avoid conflicts
      for (const queuedTransaction of unsyncedTransactions) {
        try {
          await syncHelpers.syncSingleTransaction(queuedTransaction, userId);
          await queueHelpers.markAsSynced(queuedTransaction.id);
          results.success++;
        } catch (error) {
          console.error(`Failed to sync transaction ${queuedTransaction.id}:`, error);
          results.failed++;
        }
      }

      // Cleanup synced transactions
      if (results.success > 0) {
        await queueHelpers.cleanupSyncedTransactions();
      }

      // Update last sync timestamp
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      console.log(`Sync completed: ${results.success} success, ${results.failed} failed`);
      return results;
    } catch (error) {
      console.error('Sync process failed:', error);
      return results;
    }
  },

  /**
   * Sync a single queued transaction to the server
   */
  syncSingleTransaction: async (queuedTransaction: QueuedTransaction, userId: string): Promise<Transaction> => {
    try {
      // Convert queued transaction to database transaction format
      const dbTransaction: Omit<Transaction, 'id'> = {
        user_id: userId,
        amount: queuedTransaction.amount,
        type: queuedTransaction.type,
        description: queuedTransaction.description,
        timestamp: queuedTransaction.timestamp,
        proof_image_url: queuedTransaction.proofImageUrl,
        app_name: queuedTransaction.appName,
      };

      // Create transaction in database
      const createdTransaction = await dbHelpers.createTransaction(dbTransaction);

      // Handle profile balance updates based on transaction type
      await syncHelpers.updateProfileBalance(userId, queuedTransaction);

      console.log(`Successfully synced transaction: ${queuedTransaction.id} -> ${createdTransaction.id}`);
      return createdTransaction;
    } catch (error) {
      console.error('Failed to sync single transaction:', error);
      throw error;
    }
  },

  /**
   * Update profile balance after syncing transaction
   * Implements server-side precedence for conflict resolution
   */
  updateProfileBalance: async (userId: string, transaction: QueuedTransaction): Promise<void> => {
    try {
      // Get current profile from server (server-side precedence)
      const currentProfile = await dbHelpers.getProfile(userId);
      if (!currentProfile) {
        throw new Error('Profile not found');
      }

      // Calculate new balance and totals
      let newBalance = currentProfile.balance;
      let newTotalEarned = currentProfile.total_earned;
      let newTotalSpent = currentProfile.total_spent;

      if (transaction.type === 'earn') {
        newBalance += transaction.amount;
        newTotalEarned += transaction.amount;
      } else if (transaction.type === 'spend') {
        newBalance -= transaction.amount;
        newTotalSpent += transaction.amount;
      }

      // Update profile with new values
      await dbHelpers.updateProfile(userId, {
        balance: newBalance,
        total_earned: newTotalEarned,
        total_spent: newTotalSpent,
      });

      console.log(`Profile balance updated for user ${userId}: ${currentProfile.balance} -> ${newBalance}`);
    } catch (error) {
      console.error('Failed to update profile balance:', error);
      throw error;
    }
  },

  /**
   * Sync with exponential backoff retry logic
   */
  syncWithRetry: async (userId: string, maxRetries: number = CONNECTIVITY_CONFIG.MAX_RETRIES): Promise<{ success: number; failed: number }> => {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        const results = await syncHelpers.syncTransactions(userId);
        
        // If we had some success or no transactions to sync, consider it successful
        if (results.success > 0 || (results.success === 0 && results.failed === 0)) {
          return results;
        }

        // If all transactions failed, retry with backoff
        if (results.failed > 0) {
          throw new Error(`All ${results.failed} transactions failed to sync`);
        }

        return results;
      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const backoffDelay = Math.pow(2, attempt) * 1000;
          console.log(`Sync attempt ${attempt} failed, retrying in ${backoffDelay}ms:`, error);
          
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    console.error(`Sync failed after ${maxRetries} attempts:`, lastError);
    throw lastError || new Error('Sync failed after maximum retries');
  },

  /**
   * Get last sync timestamp
   */
  getLastSyncTime: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  },
};

/**
 * Main offline queue manager
 */
export const offlineQueueManager = {
  /**
   * Initialize offline queue system
   */
  initialize: async (): Promise<void> => {
    try {
      // Check initial network status
      const isOnline = await networkHelpers.isOnline();
      await networkHelpers.setNetworkStatus(isOnline);
      
      console.log('Offline queue manager initialized, network status:', isOnline);
    } catch (error) {
      console.error('Failed to initialize offline queue manager:', error);
    }
  },

  /**
   * Queue a transaction for offline sync
   */
  queueTransaction: async (
    type: 'earn' | 'spend',
    amount: number,
    description: string,
    options?: {
      proofImageUrl?: string;
      appName?: string;
    }
  ): Promise<string> => {
    const transaction = {
      type,
      amount,
      description,
      timestamp: new Date().toISOString(),
      proofImageUrl: options?.proofImageUrl,
      appName: options?.appName,
    };

    return await queueHelpers.enqueue(transaction);
  },

  /**
   * Attempt to sync all queued transactions
   */
  sync: async (userId: string): Promise<{ success: number; failed: number }> => {
    return await syncHelpers.syncWithRetry(userId);
  },

  /**
   * Get queue status information
   */
  getStatus: async (): Promise<{
    queueLength: number;
    unsyncedCount: number;
    lastSync: string | null;
    isOnline: boolean;
  }> => {
    try {
      const [queue, unsynced, lastSync, isOnline] = await Promise.all([
        queueHelpers.getQueue(),
        queueHelpers.getUnsyncedTransactions(),
        syncHelpers.getLastSyncTime(),
        networkHelpers.isOnline(),
      ]);

      return {
        queueLength: queue.length,
        unsyncedCount: unsynced.length,
        lastSync,
        isOnline,
      };
    } catch (error) {
      console.error('Failed to get queue status:', error);
      return {
        queueLength: 0,
        unsyncedCount: 0,
        lastSync: null,
        isOnline: false,
      };
    }
  },

  /**
   * Clear all offline data (use for testing or reset)
   */
  reset: async (): Promise<void> => {
    try {
      await Promise.all([
        queueHelpers.clearQueue(),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
        AsyncStorage.removeItem(STORAGE_KEYS.NETWORK_STATUS),
      ]);
      
      console.log('Offline queue manager reset completed');
    } catch (error) {
      console.error('Failed to reset offline queue manager:', error);
    }
  },
};

export default offlineQueueManager;