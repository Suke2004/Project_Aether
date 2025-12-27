/**
 * Timer Test Component
 * Demonstrates synchronized token consumption: 5 tokens/minute = 1 token every 12 seconds
 */

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const TimerTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [tokensCharged, setTokensCharged] = useState(0);
  const [balance, setBalance] = useState(50);

  const tokensPerMinute = 5;
  const secondsPerToken = 60 / tokensPerMinute; // 12 seconds per token

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        const now = Date.now();
        setCurrentTime(now);
        
        const elapsedMs = now - startTime;
        const expectedTokens = Math.floor(elapsedMs / (secondsPerToken * 1000));
        
        if (expectedTokens > tokensCharged && balance > 0) {
          const tokensToCharge = expectedTokens - tokensCharged;
          setTokensCharged(expectedTokens);
          setBalance(prev => Math.max(0, prev - tokensToCharge));
          console.log(`🟦 TEST: Charged ${tokensToCharge} tokens at ${Math.floor(elapsedMs/1000)}s`);
        }
        
        if (balance <= 0) {
          setIsRunning(false);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime, tokensCharged, balance, secondsPerToken]);

  const handleStart = () => {
    setStartTime(Date.now());
    setCurrentTime(Date.now());
    setTokensCharged(0);
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartTime(0);
    setCurrentTime(0);
    setTokensCharged(0);
    setBalance(50);
  };

  const elapsed = currentTime - startTime;
  const elapsedSeconds = Math.floor(elapsed / 1000);
  const expectedTokens = Math.floor(elapsed / (secondsPerToken * 1000));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 TIMER SYNCHRONIZATION TEST</Text>
      
      <View style={styles.stats}>
        <Text style={styles.statText}>Time: {elapsedSeconds}s</Text>
        <Text style={styles.statText}>Tokens Charged: {tokensCharged}</Text>
        <Text style={styles.statText}>Expected: {expectedTokens}</Text>
        <Text style={styles.statText}>Balance: {balance}</Text>
        <Text style={[
          styles.syncStatus,
          tokensCharged === expectedTokens ? styles.syncGood : styles.syncBad
        ]}>
          {tokensCharged === expectedTokens ? '✅ SYNCHRONIZED' : '⚠️ SYNCING...'}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>Rate: {tokensPerMinute} tokens/minute</Text>
        <Text style={styles.infoText}>Interval: 1 token every {secondsPerToken} seconds</Text>
        <Text style={styles.infoText}>Expected charges at: 12s, 24s, 36s, 48s, 60s...</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity 
          style={[styles.button, styles.startButton]} 
          onPress={handleStart}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>START</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.stopButton]} 
          onPress={handleStop}
          disabled={!isRunning}
        >
          <Text style={styles.buttonText}>STOP</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]} 
          onPress={handleReset}
        >
          <Text style={styles.buttonText}>RESET</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  stats: {
    marginBottom: 16,
  },
  statText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  syncStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  syncGood: {
    color: '#00ff88',
  },
  syncBad: {
    color: '#ffaa00',
  },
  info: {
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#b0b0b0',
    marginBottom: 2,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#00ff88',
  },
  stopButton: {
    backgroundColor: '#ff4444',
  },
  resetButton: {
    backgroundColor: '#ffaa00',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
});

export default TimerTest;