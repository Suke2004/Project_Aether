/**
 * Stable Timer Component
 * Combines good visuals with stable functionality and token integration
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface StableTimerProps {
  appName: string;
  startTime: number;
  tokensSpent: number;
  balance: number;
  tokensPerMinute: number;
  onStop: () => void;
  onFocus?: () => void;
  windowOpened?: boolean;
  onTokenCharge: (amount: number, description: string) => void;
}

export const StableTimer = ({
  appName,
  startTime,
  tokensSpent,
  balance,
  tokensPerMinute,
  onStop,
  onFocus,
  windowOpened = false,
  onTokenCharge,
}: StableTimerProps) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [localTokensSpent, setLocalTokensSpent] = useState(tokensSpent);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastChargeTimeRef = useRef(startTime);

  useEffect(() => {
    console.log('🟦 StableTimer: Starting for', appName);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Start new interval
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      
      // Calculate elapsed time since last charge
      const elapsedSinceLastCharge = now - lastChargeTimeRef.current;
      const secondsElapsed = Math.floor(elapsedSinceLastCharge / 1000);
      
      console.log('🟦 StableTimer: Tick', { 
        appName, 
        elapsed: Math.floor((now - startTime) / 1000),
        secondsElapsed,
        balance 
      });
      
      // Charge tokens every second
      if (secondsElapsed > 0) {
        const tokensPerSecond = tokensPerMinute / 60;
        const tokensToCharge = Math.ceil(secondsElapsed * tokensPerSecond);
        
        if (tokensToCharge > 0 && balance >= tokensToCharge) {
          console.log('🟦 StableTimer: Charging', tokensToCharge, 'tokens');
          onTokenCharge(tokensToCharge, `${appName} usage (${secondsElapsed}s)`);
          setLocalTokensSpent(prev => prev + tokensToCharge);
          lastChargeTimeRef.current = now;
        } else if (balance < tokensToCharge) {
          console.log('🟦 StableTimer: Insufficient balance, stopping');
          onStop();
          return;
        }
      }
    }, 1000);

    // Cleanup function
    return () => {
      console.log('🟦 StableTimer: Cleaning up for', appName);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty dependency array for stability

  // Update local tokens spent when prop changes
  useEffect(() => {
    setLocalTokensSpent(tokensSpent);
  }, [tokensSpent]);

  const formatTime = (elapsed: number) => {
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    console.log('🟦 StableTimer: Stop button pressed for', appName);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    onStop();
  };

  const elapsed = currentTime - startTime;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>⏱️ {appName}</Text>
        <View style={styles.buttons}>
          {windowOpened && onFocus && (
            <TouchableOpacity style={styles.focusButton} onPress={onFocus}>
              <Text style={styles.buttonText}>🔍 Focus</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.buttonText}>⏹️ Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.stats}>
        <Text style={styles.timeDisplay}>{formatTime(elapsed)}</Text>
        <Text style={styles.statText}>Spent: {localTokensSpent} tokens</Text>
        <Text style={styles.statText}>
          Balance: {balance} tokens (~{Math.floor(balance / tokensPerMinute * 60)}s)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 2,
    borderColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 10,
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,

  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
    flex: 1,
  } as TextStyle,

  buttons: {
    flexDirection: 'row',
    gap: 8,
  } as ViewStyle,

  focusButton: {
    backgroundColor: '#00ffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  } as ViewStyle,

  stopButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  } as ViewStyle,

  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  } as TextStyle,

  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  timeDisplay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff88',
    fontFamily: 'monospace',
  } as TextStyle,

  statText: {
    fontSize: 12,
    color: '#b0b0b0',
  } as TextStyle,
});

export default StableTimer;