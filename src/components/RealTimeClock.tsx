/**
 * Real-Time Clock Component
 * Displays current time and date with automatic updates
 */

import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface RealTimeClockProps {
  showDate?: boolean;
  showSeconds?: boolean;
  format24Hour?: boolean;
  timeStyle?: TextStyle;
  dateStyle?: TextStyle;
  containerStyle?: ViewStyle;
  updateInterval?: number; // in milliseconds, default 1000
}

export const RealTimeClock: React.FC<RealTimeClockProps> = ({
  showDate = true,
  showSeconds = false,
  format24Hour = false,
  timeStyle,
  dateStyle,
  containerStyle,
  updateInterval = 1000,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    return () => clearInterval(timeInterval);
  }, [updateInterval]);

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !format24Hour,
    };

    if (showSeconds) {
      options.second = '2-digit';
    }

    return date.toLocaleTimeString([], options);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.timeText, timeStyle]}>
        {formatTime(currentTime)}
      </Text>
      {showDate && (
        <Text style={[styles.dateText, dateStyle]}>
          {formatDate(currentTime)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  } as ViewStyle,

  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  } as TextStyle,

  dateText: {
    fontSize: 14,
    color: '#b0b0b0',
    marginTop: 2,
  } as TextStyle,
});

export default RealTimeClock;