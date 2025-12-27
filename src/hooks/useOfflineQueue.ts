/**
 * useOfflineQueue Hook for the Attention Wallet system
 * Provides React interface for offline queue management and synchronization
 * Requirements: 4.4, 8.1
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { offlineQueueManager, networkHelpers } from '../lib/offlineQueue';
import { useAuth } from '../context/AuthContext';

interface OfflineQueueStatus {
  queueLength: number;
  unsyncedCount: number;
  lastSync: string | null;
  isOnline: boolean;
  isSyncing: boolean;
}

interface UseOfflineQueueReturn {
  status: OfflineQueueStatus;
  queueTransaction: (
    type: 'earn' | 'spend',
    amount: number,
    description: string,
    options?: {
      proofImageUrl?: string;
      appName?: string;
    }
  ) => Promise<string>;
  syncNow: () => Promise<{ success: number; failed: number }>;
  refreshStatus: () => Promise<void>;
  isInitialized: boolean;
}

/**
 * Custom hook for offline queue management
 */
const useOfflineQueue = (): UseOfflineQueueReturn => {
  const { profile } = useAuth();
  const [status, setStatus] = useState<OfflineQueueStatus>({
    queueLength: 0,
    unsyncedCount: 0,
    lastSync: null,
    isOnline: true,
    isSyncing: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for managing intervals and preventing memory leaks
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const networkCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Update queue status
   */
  const refreshStatus = useCallback(async () => {
    try {
      const queueStatus = await offlineQueueManager.getStatus();
      
      if (isMountedRef.current) {
        setStatus(prev => ({
          ...prev,
          queueLength: queueStatus.queueLength,
          unsyncedCount: queueStatus.unsyncedCount,
          lastSync: queueStatus.lastSync,
          isOnline: queueStatus.isOnline,
        }));
      }
    } catch (error) {
      console.error('Failed to refresh offline queue status:', error);
    }
  }, []);

  /**
   * Check network connectivity and update status
   */
  const checkNetworkStatus = useCallback(async () => {
    try {
      const isOnline = await networkHelpers.isOnline();
      await networkHelpers.setNetworkStatus(isOnline);
      
      if (isMountedRef.current) {
        setStatus(prev => ({
          ...prev,
          isOnline,
        }));
      }

      // If we just came back online and have unsynced transactions, trigger sync
      if (isOnline && status.unsyncedCount > 0 && profile?.id) {
        console.log('Network restored, triggering sync for unsynced transactions');
        syncNow();
      }
    } catch (error) {
      console.error('Failed to check network status:', error);
    }
  }, [status.unsyncedCount, profile?.id]);

  /**
   * Queue a transaction for offline sync
   */
  const queueTransaction = useCallback(async (
    type: 'earn' | 'spend',
    amount: number,
    description: string,
    options?: {
      proofImageUrl?: string;
      appName?: string;
    }
  ): Promise<string> => {
    try {
      const transactionId = await offlineQueueManager.queueTransaction(
        type,
        amount,
        description,
        options
      );

      // Refresh status to show updated queue
      await refreshStatus();

      // If online, attempt immediate sync
      if (status.isOnline && profile?.id) {
        // Don't await this to avoid blocking the UI
        syncNow().catch(error => {
          console.error('Background sync failed:', error);
        });
      }

      return transactionId;
    } catch (error) {
      console.error('Failed to queue transaction:', error);
      throw error;
    }
  }, [status.isOnline, profile?.id, refreshStatus]);

  /**
   * Manually trigger synchronization
   */
  const syncNow = useCallback(async (): Promise<{ success: number; failed: number }> => {
    if (!profile?.id) {
      throw new Error('User must be authenticated to sync transactions');
    }

    if (status.isSyncing) {
      console.log('Sync already in progress, skipping');
      return { success: 0, failed: 0 };
    }

    try {
      if (isMountedRef.current) {
        setStatus(prev => ({ ...prev, isSyncing: true }));
      }

      const results = await offlineQueueManager.sync(profile.id);
      
      // Refresh status after sync
      await refreshStatus();
      
      console.log(`Sync completed: ${results.success} success, ${results.failed} failed`);
      return results;
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    } finally {
      if (isMountedRef.current) {
        setStatus(prev => ({ ...prev, isSyncing: false }));
      }
    }
  }, [profile?.id, status.isSyncing, refreshStatus]);

  /**
   * Handle app state changes for background sync
   */
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && profile?.id) {
      // App became active, check network and sync if needed
      console.log('App became active, checking for sync opportunities');
      checkNetworkStatus();
      
      // Refresh status when app becomes active
      refreshStatus();
    }
  }, [profile?.id, checkNetworkStatus, refreshStatus]);

  /**
   * Set up periodic sync attempts
   */
  const setupPeriodicSync = useCallback(() => {
    // Clear existing intervals
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    if (networkCheckIntervalRef.current) {
      clearInterval(networkCheckIntervalRef.current);
    }

    // Set up periodic network checks (every 30 seconds)
    networkCheckIntervalRef.current = setInterval(() => {
      checkNetworkStatus();
    }, 30000);

    // Set up periodic sync attempts (every 60 seconds)
    syncIntervalRef.current = setInterval(async () => {
      if (profile?.id && status.unsyncedCount > 0 && status.isOnline && !status.isSyncing) {
        try {
          await syncNow();
        } catch (error) {
          console.error('Periodic sync failed:', error);
        }
      }
    }, 60000);
  }, [profile?.id, status.unsyncedCount, status.isOnline, status.isSyncing, checkNetworkStatus, syncNow]);

  /**
   * Initialize offline queue system
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        await offlineQueueManager.initialize();
        await refreshStatus();
        setIsInitialized(true);
        
        console.log('Offline queue hook initialized');
      } catch (error) {
        console.error('Failed to initialize offline queue hook:', error);
      }
    };

    initialize();
  }, [refreshStatus]);

  /**
   * Set up app state listener and periodic sync
   */
  useEffect(() => {
    if (!isInitialized) return;

    // Add app state change listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up periodic sync
    setupPeriodicSync();

    return () => {
      subscription?.remove();
      
      // Clear intervals
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (networkCheckIntervalRef.current) {
        clearInterval(networkCheckIntervalRef.current);
      }
    };
  }, [isInitialized, handleAppStateChange, setupPeriodicSync]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Clear intervals
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (networkCheckIntervalRef.current) {
        clearInterval(networkCheckIntervalRef.current);
      }
    };
  }, []);

  return {
    status,
    queueTransaction,
    syncNow,
    refreshStatus,
    isInitialized,
  };
};

export default useOfflineQueue;