/**
 * Simple Timer Component
 * A minimal, stable timer that avoids complex useEffect dependencies
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface SimpleTimerProps {
  appName: string;
  onStop: () => void;
  onFocus?: () => void;
  windowOpened?: boolean;
}

export const SimpleTimer = ({ appName, onStop, onFocus, windowOpened = false }: SimpleTimerProps) => {
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🟢 SimpleTimer: Starting timer for', appName);
    
    // Reset start time
    startTimeRef.current = Date.now();
    setSeconds(0);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Start new interval
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setSeconds(elapsed);
      console.log('🟢 SimpleTimer: Tick', { appName, elapsed });
    }, 1000);

    // Cleanup function
    return () => {
      console.log('🟢 SimpleTimer: Cleaning up timer for', appName);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Format time display
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    console.log('🟢 SimpleTimer: Stop button pressed for', appName);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    onStop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>⏱️ {appName}</Text>
        <View style={styles.buttons}>
          {windowOpened && onFocus && (
            <TouchableOpacity style={styles.focusButton} onPress={onFocus}>
              <Text style={styles.buttonText}>🔍</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.buttonText}>⏹️</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(seconds)}</Text>
        <Text style={styles.statusText}>Running...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    borderWidth: 2,
    borderColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 20,
    zIndex: 1000,
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
    fontSize: 14,
    fontWeight: 'bold',
  } as TextStyle,

  timeContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  } as ViewStyle,

  timeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff88',
    fontFamily: 'monospace',
  } as TextStyle,

  statusText: {
    fontSize: 14,
    color: '#b0b0b0',
    marginTop: 4,
  } as TextStyle,
});

export default SimpleTimer;