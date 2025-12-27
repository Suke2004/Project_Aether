/**
 * Wallet Context for the Attention Wallet system
 * Handles token operations, balance tracking, and transaction history management
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient, dbHelpers, realtimeHelpers } from '../lib/supabase';
import { Transaction, WalletContextType, Profile } from '../lib/types';
import { useAuth } from './AuthContext';

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
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
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
   * Initialize wallet state from profile and load transactions
   */
  const initializeWallet = async () => {
    if (!profile) return;

    try {
      setIsLoading(true);

      // Set balance and totals from profile
      setBalance(profile.balance);
      setTotalEarned(profile.total_earned);
      setTotalSpent(profile.total_spent);

      // Load recent transactions (limit to 100 for performance)
      const userTransactions = await dbHelpers.getTransactions(profile.id, 100);
      setTransactions(userTransactions);

      console.log('Wallet initialized for user:', profile.id, 'Balance:', profile.balance);
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set up real-time subscriptions for profile and transaction updates
   */
  const setupRealtimeSubscriptions = () => {
    if (!profile?.id) return;

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
   * Requirements: 1.3, 1.5
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

      // Create transaction record
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

      console.log(`Earned ${amount} tokens for user ${profile.id}. New balance: ${updatedProfile.balance}`);
    } catch (error) {
      console.error('Failed to earn tokens:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Spend tokens and update balance
   * Requirements: 2.1, 3.2
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

    if (profile.balance < amount) {
      throw new Error(`Insufficient balance. Current balance: ${profile.balance}, Required: ${amount}`);
    }

    try {
      setIsLoading(true);

      // Create transaction record
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

      console.log(`Spent ${amount} tokens for user ${profile.id}. New balance: ${updatedProfile.balance}`);
    } catch (error) {
      console.error('Failed to spend tokens:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh balance and transaction history from database
   */
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

  // Context value with all wallet functions and state
  const value: WalletContextType = {
    balance,
    totalEarned,
    totalSpent,
    transactions,
    isLoading,
    earnTokens,
    spendTokens,
    refreshBalance,
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