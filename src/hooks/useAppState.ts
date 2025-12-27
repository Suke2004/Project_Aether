/**
 * useAppState Hook for Time Tracking and Token Deduction
 * 
 * This hook monitors React Native AppState changes to track when the user
 * leaves the Attention Wallet app to use entertainment apps, and automatically
 * deducts tokens at a rate of 5 tokens per minute.
 * 
 * Requirements: 2.2, 2.5, 6.1
 */

import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from '../context/WalletContext';
import { AppUsageSession } from '../lib/types';

// Constants for token deduction
const TOKENS_PER_MINUTE = 5;
const STORAGE_KEY = 'app_usage_session';

interface UseAppStateReturn {
  currentAppState: AppStateStatus;
  isTrackingUsage: boolean;
  currentSession: AppUsageSession | null;
  startAppUsage: (appName: string) => Promise<void>;
  stopAppUsage: () => Promise<void>;
  getElapsedTime: () => number;
}

/**
 * Custom hook for tracking app state and managing token deduction
 */
export const useAppState = (): UseAppStateReturn => {
  const { balance, spendTokens } = useWallet();
  const [currentAppState, setCurrentAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isTrackingUsage, setIsTrackingUsage] = useState(false);
  const [currentSession, setCurrentSession] = useState<AppUsageSession | null>(null);
  
  // Refs to maintain values across re-renders
  const appStateRef = useRef(AppState.currentState);
  const sessionRef = useRef<AppUsageSession | null>(null);
  const deductionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize the hook by checking for any existing session
   */
  useEffect(() => {
    initializeSession();
    
    // Set up AppState listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      clearDeductionInterval();
    };
  }, []);

  /**
   * Update refs when state changes
   */
  useEffect(() => {
    appStateRef.current = currentAppState;
  }, [currentAppState]);

  useEffect(() => {
    sessionRef.current = currentSession;
  }, [currentSession]);

  /**
   * Initialize session from storage if app was closed during usage
   */
  const initializeSession = async () => {
    try {
      const storedSession = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedSession) {
        const session: AppUsageSession = JSON.parse(storedSession);
        
        // If there was an active session, calculate elapsed time and deduct tokens
        if (session.isActive) {
          const elapsedTime = Date.now() - session.startTime;
          const elapsedMinutes = Math.floor(elapsedTime / (1000 * 60));
          const tokensToDeduct = elapsedMinutes * TOKENS_PER_MINUTE;
          
          if (tokensToDeduct > 0) {
            try {
              await spendTokens(
                tokensToDeduct,
                `App usage: ${session.appName} (${elapsedMinutes} minutes)`,
                session.appName
              );
              console.log(`Deducted ${tokensToDeduct} tokens for ${session.appName} usage on app restart`);
            } catch (error) {
              console.error('Failed to deduct tokens for previous session:', error);
            }
          }
          
          // Clear the stored session
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to initialize session from storage:', error);
    }
  };

  /**
   * Handle AppState changes between background and active
   * Requirements: 2.2, 2.5, 6.1
   */
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const previousAppState = appStateRef.current;
    
    console.log(`AppState changed from ${previousAppState} to ${nextAppState}`);
    
    // When app becomes active (user returns to Attention Wallet)
    if (previousAppState !== 'active' && nextAppState === 'active') {
      await handleAppBecameActive();
    }
    
    // When app goes to background (user leaves Attention Wallet)
    if (previousAppState === 'active' && nextAppState !== 'active') {
      await handleAppWentToBackground();
    }
    
    setCurrentAppState(nextAppState);
  };

  /**
   * Handle when app becomes active (user returns)
   */
  const handleAppBecameActive = async () => {
    const session = sessionRef.current;
    
    if (session && session.isActive) {
      // Calculate elapsed time
      const elapsedTime = Date.now() - session.startTime;
      const elapsedMinutes = Math.floor(elapsedTime / (1000 * 60));
      const tokensToDeduct = elapsedMinutes * TOKENS_PER_MINUTE;
      
      console.log(`User returned after ${elapsedMinutes} minutes. Deducting ${tokensToDeduct} tokens.`);
      
      // Deduct tokens if any time has passed
      if (tokensToDeduct > 0) {
        try {
          await spendTokens(
            tokensToDeduct,
            `App usage: ${session.appName} (${elapsedMinutes} minutes)`,
            session.appName
          );
          
          // Update session with tokens spent
          const updatedSession = {
            ...session,
            tokensSpent: session.tokensSpent + tokensToDeduct,
            isActive: false
          };
          
          setCurrentSession(updatedSession);
          console.log(`Successfully deducted ${tokensToDeduct} tokens for ${session.appName}`);
        } catch (error) {
          console.error('Failed to deduct tokens:', error);
          // If deduction fails (e.g., insufficient balance), stop tracking
          await stopAppUsage();
        }
      }
      
      // Stop tracking usage when user returns
      await stopAppUsage();
    }
    
    // Clear any stored session since user is back
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear stored session:', error);
    }
  };

  /**
   * Handle when app goes to background
   */
  const handleAppWentToBackground = async () => {
    const session = sessionRef.current;
    
    if (session && session.isActive) {
      // Store session to handle app termination
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        console.log(`Stored session for ${session.appName} in case app is terminated`);
      } catch (error) {
        console.error('Failed to store session:', error);
      }
    }
  };

  /**
   * Start tracking app usage for a specific app
   * Requirements: 2.1, 2.2
   */
  const startAppUsage = async (appName: string): Promise<void> => {
    if (!appName.trim()) {
      throw new Error('App name is required to start usage tracking');
    }

    // Check if user has sufficient balance (at least 5 tokens for 1 minute)
    if (balance < TOKENS_PER_MINUTE) {
      throw new Error('Insufficient balance to start app usage');
    }

    // Stop any existing session
    if (currentSession?.isActive) {
      await stopAppUsage();
    }

    const newSession: AppUsageSession = {
      appName: appName.trim(),
      startTime: Date.now(),
      isActive: true,
      tokensSpent: 0
    };

    setCurrentSession(newSession);
    setIsTrackingUsage(true);

    // Store session immediately in case app is terminated
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } catch (error) {
      console.error('Failed to store session:', error);
    }

    // Start periodic token deduction (every minute)
    startDeductionInterval();

    console.log(`Started tracking usage for ${appName}`);
  };

  /**
   * Stop tracking app usage
   */
  const stopAppUsage = async (): Promise<void> => {
    if (currentSession) {
      const finalSession = {
        ...currentSession,
        isActive: false
      };
      
      setCurrentSession(finalSession);
      console.log(`Stopped tracking usage for ${currentSession.appName}`);
    }

    setIsTrackingUsage(false);
    clearDeductionInterval();

    // Clear stored session
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear stored session:', error);
    }
  };

  /**
   * Start interval for periodic token deduction
   */
  const startDeductionInterval = () => {
    clearDeductionInterval();
    
    deductionIntervalRef.current = setInterval(async () => {
      const session = sessionRef.current;
      
      if (!session || !session.isActive) {
        clearDeductionInterval();
        return;
      }

      // Check if user still has balance
      if (balance < TOKENS_PER_MINUTE) {
        console.log('Insufficient balance, stopping app usage tracking');
        await stopAppUsage();
        return;
      }

      try {
        await spendTokens(
          TOKENS_PER_MINUTE,
          `App usage: ${session.appName} (1 minute)`,
          session.appName
        );

        // Update session with tokens spent
        const updatedSession = {
          ...session,
          tokensSpent: session.tokensSpent + TOKENS_PER_MINUTE
        };
        
        setCurrentSession(updatedSession);
        
        // Update stored session
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
        
        console.log(`Deducted ${TOKENS_PER_MINUTE} tokens for ${session.appName} (periodic)`);
      } catch (error) {
        console.error('Failed to deduct tokens during periodic deduction:', error);
        // Stop tracking if deduction fails
        await stopAppUsage();
      }
    }, 60000); // 60 seconds = 1 minute
  };

  /**
   * Clear the deduction interval
   */
  const clearDeductionInterval = () => {
    if (deductionIntervalRef.current) {
      clearInterval(deductionIntervalRef.current);
      deductionIntervalRef.current = null;
    }
  };

  /**
   * Get elapsed time for current session in milliseconds
   */
  const getElapsedTime = (): number => {
    if (!currentSession || !currentSession.isActive) {
      return 0;
    }
    
    return Date.now() - currentSession.startTime;
  };

  return {
    currentAppState,
    isTrackingUsage,
    currentSession,
    startAppUsage,
    stopAppUsage,
    getElapsedTime
  };
};

export default useAppState;