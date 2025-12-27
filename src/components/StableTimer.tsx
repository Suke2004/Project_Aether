/**
 * Stable Timer Component
 * Precise synchronization: 5 tokens per minute = 1 token every 12 seconds
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface StableTimerProps {
  appName: string;
  startTime: number;
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
  balance,
  tokensPerMinute,
  onStop,
  onFocus,
  windowOpened = false,
  onTokenCharge,
}: StableTimerProps) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [localTokensSpent, setLocalTokensSpent] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastChargeTimeRef = useRef(startTime);
  const totalTokensChargedRef = useRef(0);

  useEffect(() => {
    console.log('🟦 StableTimer: Starting synchronized timer for', appName);
    console.log('🟦 Rate:', tokensPerMinute, 'tokens/minute = 1 token every', 60/tokensPerMinute, 'seconds');
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Calculate charge interval: for 5 tokens/minute = 1 token every 12 seconds
    const secondsPerToken = 60 / tokensPerMinute;
    const chargeIntervalMs = secondsPerToken * 1000;
    
    console.log('🟦 Charge interval:', chargeIntervalMs, 'ms (', secondsPerToken, 'seconds per token)');
    
    // Update display every second
    const displayInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    // Charge tokens at precise intervals
    const chargeInterval = setInterval(() => {
      const now = Date.now();
      const elapsedSinceStart = now - startTime;
      const expectedTokens = Math.floor(elapsedSinceStart / chargeIntervalMs);
      const tokensToCharge = expectedTokens - totalTokensChargedRef.current;
      
      console.log('🟦 Timer check:', {
        appName,
        elapsedMs: elapsedSinceStart,
        elapsedSeconds: Math.floor(elapsedSinceStart / 1000),
        expectedTokens,
        alreadyCharged: totalTokensChargedRef.current,
        tokensToCharge,
        balance
      });
      
      if (tokensToCharge > 0) {
        if (balance >= tokensToCharge) {
          console.log('🟦 Charging', tokensToCharge, 'tokens for', appName);
          onTokenCharge(tokensToCharge, `${appName} usage (${Math.floor(elapsedSinceStart / 1000)}s)`);
          totalTokensChargedRef.current += tokensToCharge;
          setLocalTokensSpent(totalTokensChargedRef.current);
        } else {
          console.log('🟦 Insufficient balance, stopping timer');
          onStop();
          return;
        }
      }
    }, 1000); // Check every second for precise timing

    intervalRef.current = chargeInterval;

    // Cleanup function
    return () => {
      console.log('🟦 StableTimer: Cleaning up for', appName);
      if (displayInterval) clearInterval(displayInterval);
      if (chargeInterval) clearInterval(chargeInterval);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty dependency array for stability

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
  const secondsElapsed = Math.floor(elapsed / 1000);
  const expectedTokensSpent = Math.floor(secondsElapsed / (60 / tokensPerMinute));

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
          Expected: {expectedTokensSpent} tokens
        </Text>
        <Text style={styles.statText}>
          Balance: {balance} tokens (~{Math.floor(balance / tokensPerMinute * 60)}s)
        </Text>
      </View>
      
      {/* Synchronization indicator */}
      <View style={styles.syncIndicator}>
        <Text style={[
          styles.syncText,
          localTokensSpent === expectedTokensSpent ? styles.syncGood : styles.syncBad
        ]}>
          {localTokensSpent === expectedTokensSpent ? '✅ SYNCHRONIZED' : '⚠️ SYNCING...'}
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

  syncIndicator: {
    marginTop: 8,
    alignItems: 'center',
  } as ViewStyle,

  syncText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  } as TextStyle,

  syncGood: {
    color: '#00ff88',
  } as TextStyle,

  syncBad: {
    color: '#ffaa00',
  } as TextStyle,
});

export default StableTimer;