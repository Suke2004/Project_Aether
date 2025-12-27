import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient, dbHelpers, realtimeHelpers } from '../lib/supabase';
import { Transaction, WalletContextType, Profile } from '../lib/types';
import { useAuth } from './AuthContext';
import useOfflineQueue from '../hooks/useOfflineQueue';
import { DataIntegrityService, useDataIntegrity } from '../lib/dataIntegrity';
import { Alert } from 'react-native';

// Create the wallet context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Props interface for the WalletProvider component
interface WalletProviderProps {
  children: ReactNode;
}

/**
 * Wallet Provider Component
 * Manages wallet state and provides token operations to child components
 */
export const WalletProvider = ({ children }: WalletProviderProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const offlineQueue = useOfflineQueue();
  const { performIntegrityCheck, createBackup, handleCorruption } = useDataIntegrity();
  const [balance, setBalance] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataIntegrityChecked, setDataIntegrityChecked] = useState(false);
  
  // Real-time subscription channels
  const [profileSubscription, setProfileSubscription] = useState<RealtimeChannel | null>(null);
  const [transactionSubscription, setTransactionSubscription] = useState<RealtimeChannel | null>(null);

  const supabase = getSupabaseClient();

  /**
   * Initialize wallet state when user profile is available
   */
  useEffect(() => {
    if (profile) {
      initializeWallet();
      setupRealtimeSubscriptions();
    } else {
      // Clear wallet state when no profile
      clearWalletState();
    }

    // Cleanup subscriptions on unmount or user change
    return () => {
      cleanupSubscriptions();
    };
  }, [profile?.id]);

  /**
   * Initialize wallet state from profile and load transactions with integrity check
   */
  const initializeWallet = async () => {
    if (!profile) return;

    try {
      setIsLoading(true);

      // Development mode: Use mock data
      const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;
      
      if (isDevelopment && profile.id === '00000000-0000-0000-0000-000000000123') {
        console.log('Running wallet in development mode');
        
        // Set balance and totals from profile
        setBalance(profile.balance);
        setTotalEarned(profile.total_earned);
        setTotalSpent(profile.total_spent);

        // Create mock transactions
        const mockTransactions: Transaction[] = [
          {
            id: 'tx-1',
            user_id: profile.id,
            amount: 10,
            type: 'earn',
            description: 'Completed homework',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'tx-2',
            user_id: profile.id,
            amount: 5,
            type: 'spend',
            description: 'Watched YouTube',
            timestamp: new Date().toISOString(),
          },
        ];
        
        setTransactions(mockTransactions);
        setDataIntegrityChecked(true);
        console.log('Development wallet initialized with mock data');
        return;
      }

      // Production mode: Load from database
      // Set balance and totals from profile
      setBalance(profile.balance);
      setTotalEarned(profile.total_earned);
      setTotalSpent(profile.total_spent);

      // Load recent transactions (limit to 100 for performance)
      const userTransactions = await dbHelpers.getTransactions(profile.id, 100);
      setTransactions(userTransactions);

      // Perform data integrity check if not already done
      if (!dataIntegrityChecked) {
        await performDataIntegrityCheck(profile, userTransactions);
        setDataIntegrityChecked(true);
      }

      console.log('Wallet initialized for user:', profile.id, 'Balance:', profile.balance);
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
      
      // Fallback to development mode if database fails
      console.log('Database failed, using development mode fallback');
      setBalance(profile.balance);
      setTotalEarned(profile.total_earned);
      setTotalSpent(profile.total_spent);
      setTransactions([]);
      setDataIntegrityChecked(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Perform data integrity check and handle any corruption
   */
  const performDataIntegrityCheck = async (currentProfile: Profile, currentTransactions: Transaction[]) => {
    try {
      console.log('Performing data integrity check...');
      
      const integrityResult = await performIntegrityCheck(currentProfile, currentTransactions);
      
      if (!integrityResult.isValid) {
        console.warn('Data integrity issues detected:', {
          errorCount: integrityResult.errors.length,
          warningCount: integrityResult.warnings.length,
          canRecover: integrityResult.canRecover,
          backupAvailable: integrityResult.backupAvailable,
        });

        // Create a backup before attempting recovery
        await createBackup(currentProfile, currentTransactions, 'Pre-recovery backup');

        // Handle data corruption
        const recoveryResult = await handleCorruption(
          integrityResult.errors,
          async (message: string) => {
            // Notify parent about data recovery
            console.log('Parent notification:', message);
            // In a real app, this would send a notification to the parent
            Alert.alert(
              'Data Recovery',
              'Some data issues were detected and automatically fixed. Your data has been restored from a backup.',
              [{ text: 'OK' }]
            );
          }
        );

        if (recoveryResult.backupRestored) {
          // Reload data from backup
          const restoredData = await DataIntegrityService.restoreFromBackup();
          if (restoredData) {
            if (restoredData.profile) {
              setBalance(restoredData.profile.balance);
              setTotalEarned(restoredData.profile.total_earned);
              setTotalSpent(restoredData.profile.total_spent);
            }
            setTransactions(restoredData.transactions);
            
            Alert.alert(
              'Data Restored',
              'Your data has been successfully restored from a backup due to corruption detection.',
              [{ text: 'OK' }]
            );
          }
        } else if (recoveryResult.recovered) {
          Alert.alert(
            'Data Fixed',
            'Some data issues were detected and automatically fixed.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Data Issues Detected',
            'Some data issues were detected but could not be automatically fixed. Please contact support if you experience any problems.',
            [{ text: 'OK' }]
          );
        }
      } else {
        console.log('Data integrity check passed');
        
        // Create a routine backup if none exists or if it's been a while
        const backupInfo = await DataIntegrityService.getBackupInfo();
        if (!backupInfo.hasBackup || 
            (backupInfo.lastBackupTime && 
             Date.now() - new Date(backupInfo.lastBackupTime).getTime() > 24 * 60 * 60 * 1000)) {
          await createBackup(currentProfile, currentTransactions, 'Routine backup');
        }
      }

      // Display warnings if any
      if (integrityResult.warnings.length > 0) {
        console.warn('Data integrity warnings:', integrityResult.warnings);
      }

    } catch (error) {
      console.error('Data integrity check failed:', error);
      // Don't block the app if integrity check fails
    }
  };
  const setupRealtimeSubscriptions = () => {
    if (!profile?.id) return;

    // Skip real-time subscriptions in development mode with mock data
    const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;
    if (isDevelopment && profile.id === '00000000-0000-0000-0000-000000000123') {
      console.log('🔧 Skipping real-time subscriptions in development mode');
      return;
    }

    // Clean up existing subscriptions
    cleanupSubscriptions();

    try {
      // Subscribe to profile changes for balance updates
      const profileSub = realtimeHelpers.subscribeToProfile(profile.id, (updatedProfile: Profile) => {
        console.log('Profile updated via realtime:', updatedProfile);
        setBalance(updatedProfile.balance);
        setTotalEarned(updatedProfile.total_earned);
        setTotalSpent(updatedProfile.total_spent);
      });

      // Subscribe to new transactions
      const transactionSub = realtimeHelpers.subscribeToTransactions(profile.id, (newTransaction: Transaction) => {
        console.log('New transaction via realtime:', newTransaction);
        setTransactions(prev => [newTransaction, ...prev]);
      });

      setProfileSubscription(profileSub);
      setTransactionSubscription(transactionSub);

      console.log('Real-time subscriptions set up for user:', profile.id);
    } catch (error) {
      console.error('Failed to set up real-time subscriptions:', error);
    }
  };

  /**
   * Clean up real-time subscriptions
   */
  const cleanupSubscriptions = () => {
    if (profileSubscription) {
      supabase.removeChannel(profileSubscription);
      setProfileSubscription(null);
    }
    if (transactionSubscription) {
      supabase.removeChannel(transactionSubscription);
      setTransactionSubscription(null);
    }
  };

  /**
   * Clear wallet state (used when user logs out)
   */
  const clearWalletState = () => {
    setBalance(0);
    setTotalEarned(0);
    setTotalSpent(0);
    setTransactions([]);
    setIsLoading(false);
    cleanupSubscriptions();
  };

  /**
   * Earn tokens and update balance
   * Requirements: 1.3, 1.5, 4.4, 8.1
   */
  const earnTokens = async (amount: number, description: string, proofUrl?: string): Promise<void> => {
    if (!user || !profile) {
      throw new Error('User must be authenticated to earn tokens');
    }

    if (amount <= 0) {
      throw new Error('Token amount must be positive');
    }

    if (!description.trim()) {
      throw new Error('Description is required for earning tokens');
    }

    try {
      setIsLoading(true);

      // Development mode: Handle transactions locally without database
      const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;
      
      if (isDevelopment && profile.id === '00000000-0000-0000-0000-000000000123') {
        console.log('Development mode: Processing earn transaction locally');
        
        // Update local state only
        const newBalance = balance + amount;
        const newTotalEarned = totalEarned + amount;
        
        setBalance(newBalance);
        setTotalEarned(newTotalEarned);

        // Create a mock transaction for local display
        const mockTransaction: Transaction = {
          id: `dev_earn_${Date.now()}`,
          user_id: profile.id,
          amount,
          type: 'earn',
          description: description.trim(),
          proof_image_url: proofUrl,
          timestamp: new Date().toISOString(),
        };
        
        setTransactions(prev => [mockTransaction, ...prev]);

        console.log(`Development mode: Earned ${amount} tokens. New balance: ${newBalance}`);
        return;
      }

      // Check if device is online
      if (offlineQueue.status.isOnline) {
        // Online: Process transaction immediately
        const transaction: Omit<Transaction, 'id'> = {
          user_id: profile.id,
          amount,
          type: 'earn',
          description: description.trim(),
          proof_image_url: proofUrl,
          timestamp: new Date().toISOString(),
        };

        // Insert transaction into database
        const createdTransaction = await dbHelpers.createTransaction(transaction);

        // Update profile balance and totals
        const newBalance = profile.balance + amount;
        const newTotalEarned = profile.total_earned + amount;

        const updatedProfile = await dbHelpers.updateProfile(profile.id, {
          balance: newBalance,
          total_earned: newTotalEarned,
        });

        // Update local state immediately (real-time subscription will also update)
        setBalance(updatedProfile.balance);
        setTotalEarned(updatedProfile.total_earned);
        setTransactions(prev => [createdTransaction, ...prev]);

        // Refresh the auth profile to keep it in sync
        await refreshProfile();

        // Create backup after significant transaction
        if (amount >= 50) { // Backup for large transactions
          await createBackup(updatedProfile, [createdTransaction, ...transactions], `Large earn transaction: ${amount} tokens`);
        }

        console.log(`Earned ${amount} tokens for user ${profile.id}. New balance: ${updatedProfile.balance}`);
      } else {
        // Offline: Queue transaction for later sync
        console.log('Device is offline, queuing earn transaction');
        
        await offlineQueue.queueTransaction('earn', amount, description.trim(), {
          proofImageUrl: proofUrl,
        });

        // Update local state optimistically
        const newBalance = balance + amount;
        const newTotalEarned = totalEarned + amount;
        
        setBalance(newBalance);
        setTotalEarned(newTotalEarned);

        // Create a temporary transaction for local display
        const tempTransaction: Transaction = {
          id: `temp_${Date.now()}`,
          user_id: profile.id,
          amount,
          type: 'earn',
          description: description.trim(),
          proof_image_url: proofUrl,
          timestamp: new Date().toISOString(),
        };
        
        setTransactions(prev => [tempTransaction, ...prev]);

        console.log(`Queued earn transaction for ${amount} tokens (offline mode)`);
      }
    } catch (error) {
      console.error('Failed to earn tokens:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Spend tokens and update balance
   * Requirements: 2.1, 3.2, 4.4, 8.1
   */
  const spendTokens = async (amount: number, description: string, appName?: string): Promise<void> => {
    if (!user || !profile) {
      throw new Error('User must be authenticated to spend tokens');
    }

    if (amount <= 0) {
      throw new Error('Token amount must be positive');
    }

    if (!description.trim()) {
      throw new Error('Description is required for spending tokens');
    }

    if (balance < amount) {
      throw new Error(`Insufficient balance. Current balance: ${balance}, Required: ${amount}`);
    }

    try {
      setIsLoading(true);

      // Development mode: Handle transactions locally without database
      const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;
      
      if (isDevelopment && profile.id === '00000000-0000-0000-0000-000000000123') {
        console.log('Development mode: Processing spend transaction locally');
        
        // Update local state only
        const newBalance = balance - amount;
        const newTotalSpent = totalSpent + amount;
        
        setBalance(newBalance);
        setTotalSpent(newTotalSpent);

        // Create a mock transaction for local display
        const mockTransaction: Transaction = {
          id: `dev_spend_${Date.now()}`,
          user_id: profile.id,
          amount,
          type: 'spend',
          description: description.trim(),
          app_name: appName,
          timestamp: new Date().toISOString(),
        };
        
        setTransactions(prev => [mockTransaction, ...prev]);

        console.log(`Development mode: Spent ${amount} tokens. New balance: ${newBalance}`);
        return;
      }

      // Check if device is online
      if (offlineQueue.status.isOnline) {
        // Online: Process transaction immediately
        const transaction: Omit<Transaction, 'id'> = {
          user_id: profile.id,
          amount,
          type: 'spend',
          description: description.trim(),
          app_name: appName,
          timestamp: new Date().toISOString(),
        };

        // Insert transaction into database
        const createdTransaction = await dbHelpers.createTransaction(transaction);

        // Update profile balance and totals
        const newBalance = profile.balance - amount;
        const newTotalSpent = profile.total_spent + amount;

        const updatedProfile = await dbHelpers.updateProfile(profile.id, {
          balance: newBalance,
          total_spent: newTotalSpent,
        });

        // Update local state immediately (real-time subscription will also update)
        setBalance(updatedProfile.balance);
        setTotalSpent(updatedProfile.total_spent);
        setTransactions(prev => [createdTransaction, ...prev]);

        // Refresh the auth profile to keep it in sync
        await refreshProfile();

        // Create backup after significant transaction
        if (amount >= 50) { // Backup for large transactions
          await createBackup(updatedProfile, [createdTransaction, ...transactions], `Large spend transaction: ${amount} tokens`);
        }

        console.log(`Spent ${amount} tokens for user ${profile.id}. New balance: ${updatedProfile.balance}`);
      } else {
        // Offline: Queue transaction for later sync
        console.log('Device is offline, queuing spend transaction');
        
        await offlineQueue.queueTransaction('spend', amount, description.trim(), {
          appName,
        });

        // Update local state optimistically
        const newBalance = balance - amount;
        const newTotalSpent = totalSpent + amount;
        
        setBalance(newBalance);
        setTotalSpent(newTotalSpent);

        // Create a temporary transaction for local display
        const tempTransaction: Transaction = {
          id: `temp_${Date.now()}`,
          user_id: profile.id,
          amount,
          type: 'spend',
          description: description.trim(),
          app_name: appName,
          timestamp: new Date().toISOString(),
        };
        
        setTransactions(prev => [tempTransaction, ...prev]);

        console.log(`Queued spend transaction for ${amount} tokens (offline mode)`);
      }
    } catch (error) {
      console.error('Failed to spend tokens:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refund tokens (essentially earning tokens back due to failed operations)
   * Requirements: 8.4
   */
  const refundTokens = async (amount: number, description: string): Promise<void> => {
    if (!user || !profile) {
      throw new Error('User must be authenticated to refund tokens');
    }

    if (amount <= 0) {
      throw new Error('Refund amount must be positive');
    }

    if (!description.trim()) {
      throw new Error('Description is required for token refund');
    }

    try {
      setIsLoading(true);

      // Refunds are processed as earning transactions with a special description
      const refundDescription = `REFUND: ${description.trim()}`;

      // Development mode: Handle transactions locally without database
      const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;
      
      if (isDevelopment && profile.id === '00000000-0000-0000-0000-000000000123') {
        console.log('Development mode: Processing refund transaction locally');
        
        // Update local state only
        const newBalance = balance + amount;
        const newTotalEarned = totalEarned + amount;
        
        setBalance(newBalance);
        setTotalEarned(newTotalEarned);

        // Create a mock transaction for local display
        const mockTransaction: Transaction = {
          id: `dev_refund_${Date.now()}`,
          user_id: profile.id,
          amount,
          type: 'earn', // Refunds are processed as earnings
          description: refundDescription,
          timestamp: new Date().toISOString(),
        };
        
        setTransactions(prev => [mockTransaction, ...prev]);

        console.log(`Development mode: Refunded ${amount} tokens. New balance: ${newBalance}`);
        return;
      }

      // Check if device is online
      if (offlineQueue.status.isOnline) {
        // Online: Process refund immediately
        const transaction: Omit<Transaction, 'id'> = {
          user_id: profile.id,
          amount,
          type: 'earn', // Refunds are processed as earnings
          description: refundDescription,
          timestamp: new Date().toISOString(),
        };

        // Insert transaction into database
        const createdTransaction = await dbHelpers.createTransaction(transaction);

        // Update profile balance (add back the refunded amount)
        // Note: We don't update total_earned for refunds as they're not "earned"
        const newBalance = profile.balance + amount;

        const updatedProfile = await dbHelpers.updateProfile(profile.id, {
          balance: newBalance,
        });

        // Update local state immediately
        setBalance(updatedProfile.balance);
        setTransactions(prev => [createdTransaction, ...prev]);

        // Refresh the auth profile to keep it in sync
        await refreshProfile();

        console.log(`Refunded ${amount} tokens for user ${profile.id}. New balance: ${updatedProfile.balance}`);
      } else {
        // Offline: Queue refund for later sync
        console.log('Device is offline, queuing refund transaction');
        
        await offlineQueue.queueTransaction('earn', amount, refundDescription, {});

        // Update local state optimistically
        const newBalance = balance + amount;
        setBalance(newBalance);

        // Create a temporary transaction for local display
        const tempTransaction: Transaction = {
          id: `temp_refund_${Date.now()}`,
          user_id: profile.id,
          amount,
          type: 'earn',
          description: refundDescription,
          timestamp: new Date().toISOString(),
        };
        
        setTransactions(prev => [tempTransaction, ...prev]);

        console.log(`Queued refund transaction for ${amount} tokens (offline mode)`);
      }
    } catch (error) {
      console.error('Failed to refund tokens:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  const refreshBalance = async (): Promise<void> => {
    if (!profile) {
      throw new Error('User must be authenticated to refresh balance');
    }

    try {
      setIsLoading(true);

      // Refresh profile data
      await refreshProfile();

      // Reload transactions
      const userTransactions = await dbHelpers.getTransactions(profile.id, 100);
      setTransactions(userTransactions);

      console.log('Balance refreshed for user:', profile.id);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sync effect: refresh wallet state when offline transactions are synced
   */
  useEffect(() => {
    if (offlineQueue.isInitialized && profile) {
      // Listen for sync completion and refresh wallet state
      const handleSyncCompletion = async () => {
        if (offlineQueue.status.unsyncedCount === 0 && offlineQueue.status.queueLength > 0) {
          console.log('Offline sync completed, refreshing wallet state');
          await refreshBalance();
        }
      };

      // Check sync status periodically
      const syncCheckInterval = setInterval(handleSyncCompletion, 5000);

      return () => {
        clearInterval(syncCheckInterval);
      };
    }
  }, [offlineQueue.isInitialized, offlineQueue.status.unsyncedCount, offlineQueue.status.queueLength, profile, refreshBalance]);

  /**
   * Cleanup effect: clean up old backups periodically
   */
  useEffect(() => {
    if (profile) {
      // Clean up old backups once per day
      const cleanupInterval = setInterval(async () => {
        try {
          await DataIntegrityService.cleanupOldBackups();
        } catch (error) {
          console.error('Failed to cleanup old backups:', error);
        }
      }, 24 * 60 * 60 * 1000); // 24 hours

      // Also run cleanup on mount
      DataIntegrityService.cleanupOldBackups().catch(error => {
        console.error('Failed to cleanup old backups on mount:', error);
      });

      return () => {
        clearInterval(cleanupInterval);
      };
    }
  }, [profile]);

  // Context value with all wallet functions and state
  const value: WalletContextType = {
    balance,
    totalEarned,
    totalSpent,
    transactions,
    isLoading,
    earnTokens,
    spendTokens,
    refundTokens,
    refreshBalance,
    offlineStatus: {
      queueLength: offlineQueue.status.queueLength,
      unsyncedCount: offlineQueue.status.unsyncedCount,
      isOnline: offlineQueue.status.isOnline,
      isSyncing: offlineQueue.status.isSyncing,
    },
    syncOfflineTransactions: offlineQueue.syncNow,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Custom hook to use the wallet context
 * Throws an error if used outside of WalletProvider
 */
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  
  return context;
};

/**
 * Higher-order component for wallet access control
 * Ensures user is authenticated before allowing wallet operations
 */
export const withWalletAccess = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => {
    const { user, profile, isLoading } = useAuth();
    
    if (isLoading) {
      // You might want to return a loading component here
      return null;
    }
    
    if (!user || !profile) {
      // You might want to return an authentication required component here
      console.warn('Wallet access denied. User must be authenticated.');
      return null;
    }
    
    return <Component {...props} />;
  };
};

export default WalletContext;