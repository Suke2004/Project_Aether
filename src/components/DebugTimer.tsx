import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface DebugTimerProps {
  appName: string;
  startTime: number;
  tokensSpent: number;
  balance: number;
  tokensPerMinute: number;
  onStop: () => void;
  onFocus?: () => void;
  windowOpened?: boolean;
}

export const DebugTimer = ({
  appName,
  startTime,
  tokensSpent,
  balance,
  tokensPerMinute,
  onStop,
  onFocus,
  windowOpened = false,
}: DebugTimerProps) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      
      // Add debug info
      const elapsed = Math.floor((now - startTime) / 1000);
      const newDebugInfo = [
        `Timer active: ${appName}`,
        `Elapsed: ${elapsed}s`,
        `Start time: ${new Date(startTime).toLocaleTimeString()}`,
        `Current time: ${new Date(now).toLocaleTimeString()}`,
        `Tokens spent: ${tokensSpent}`,
        `Balance: ${balance}`,
        `Window opened: ${windowOpened}`,
        `Component rendered: ${new Date().toLocaleTimeString()}`,
      ];
      setDebugInfo(newDebugInfo);
    }, 1000);

    return () => clearInterval(interval);
  }, [appName, startTime, tokensSpent, balance, windowOpened]);

  const formatTime = (elapsed: number) => {
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const elapsed = currentTime - startTime;

  return (
    <View style={styles.container}>
      {/* Main Timer Display */}
      <View style={styles.timerHeader}>
        <Text style={styles.appName}>🐛 DEBUG: {appName}</Text>
        <View style={styles.buttonContainer}>
          {windowOpened && onFocus && (
            <TouchableOpacity style={styles.focusButton} onPress={onFocus}>
              <Text style={styles.buttonText}>🔍</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.stopButton} onPress={onStop}>
            <Text style={styles.buttonText}>⏹️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Timer Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.timeDisplay}>{formatTime(elapsed)}</Text>
        <Text style={styles.statText}>Spent: {tokensSpent} tokens</Text>
        <Text style={styles.statText}>
          Balance: {balance} (~{Math.floor(balance / tokensPerMinute * 60)}s)
        </Text>
      </View>

      {/* Debug Information */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        {debugInfo.map((info, index) => (
          <Text key={index} style={styles.debugText}>
            {info}
          </Text>
        ))}
      </View>

      {/* Render Counter */}
      <View style={styles.renderCounter}>
        <Text style={styles.renderText}>
          Renders: {Math.floor(Math.random() * 1000)} (changes = re-render)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    borderWidth: 2,
    borderColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 15, // Very high elevation to ensure visibility
    zIndex: 999, // Very high z-index
  } as ViewStyle,

  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  } as ViewStyle,

  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
    flex: 1,
  } as TextStyle,

  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  } as ViewStyle,

  focusButton: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  } as ViewStyle,

  stopButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  } as ViewStyle,

  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  } as TextStyle,

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
    backgroundColor: '#2d2d44',
    borderRadius: 4,
    paddingHorizontal: 8,
  } as ViewStyle,

  timeDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ecdc4',
    fontFamily: 'monospace',
  } as TextStyle,

  statText: {
    fontSize: 10,
    color: '#b0b0b0',
  } as TextStyle,

  debugContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  } as ViewStyle,

  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffeb3b',
    marginBottom: 4,
  } as TextStyle,

  debugText: {
    fontSize: 10,
    color: '#b0b0b0',
    fontFamily: 'monospace',
    lineHeight: 12,
  } as TextStyle,

  renderCounter: {
    backgroundColor: '#ff9800',
    borderRadius: 4,
    padding: 4,
    alignItems: 'center',
  } as ViewStyle,

  renderText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: 'bold',
  } as TextStyle,
});

export default DebugTimer;