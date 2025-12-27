/**
 * WalletCard Component
 * Cyberpunk-styled balance display with animations and visual feedback
 * Requirements: 5.1, 5.4
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useWallet } from '../context/WalletContext';

const { width: screenWidth } = Dimensions.get('window');

// Color scheme for cyberpunk theme
const colors = {
  primary: '#00ffff',      // Cyan
  secondary: '#ff00ff',    // Magenta
  accent: '#ffff00',       // Yellow
  background: '#0a0a0a',   // Dark background
  cardBg: '#1a1a2e',       // Card background
  lowBalance: '#ff0040',   // Red for low balance
  success: '#00ff80',      // Green for positive values
  text: '#ffffff',         // White text
  textSecondary: '#b0b0b0', // Gray text
};

interface WalletCardProps {
  style?: ViewStyle;
  showDetails?: boolean;
  lowBalanceThreshold?: number;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  style,
  showDetails = true,
  lowBalanceThreshold = 25, // 5 minutes worth of tokens
}) => {
  const { balance, totalEarned, totalSpent, isLoading, offlineStatus } = useWallet();
  
  // Animation values
  const balanceAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const previousBalance = useRef(balance);

  // Determine if balance is low
  const isLowBalance = balance <= lowBalanceThreshold;

  // Animate balance changes
  useEffect(() => {
    if (previousBalance.current !== balance) {
      // Animate the balance number change
      Animated.spring(balanceAnimation, {
        toValue: balance,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();

      // Trigger glow effect on balance change
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 700,
          useNativeDriver: false,
        }),
      ]).start();

      previousBalance.current = balance;
    }
  }, [balance, balanceAnimation, glowAnimation]);

  // Low balance pulse animation
  useEffect(() => {
    if (isLowBalance) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isLowBalance, pulseAnimation]);

  // Calculate minutes remaining
  const minutesRemaining = Math.floor(balance / 5);

  // Animated balance value for smooth number transitions
  const animatedBalance = balanceAnimation.interpolate({
    inputRange: [0, Math.max(balance, 1)],
    outputRange: [0, balance],
    extrapolate: 'clamp',
  });

  // Glow intensity based on animation
  const glowIntensity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ scale: pulseAnimation }],
          shadowRadius: glowIntensity,
        },
        isLowBalance && styles.lowBalanceContainer,
      ]}
    >
      {/* Background gradient effect */}
      <View style={[styles.backgroundGradient, isLowBalance && styles.lowBalanceGradient]} />
      
      {/* Main balance display */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>TOKENS</Text>
        <Animated.Text style={[styles.balanceValue, isLowBalance && styles.lowBalanceText]}>
          {animatedBalance.__getValue ? Math.round(animatedBalance.__getValue()) : balance}
        </Animated.Text>
        <Text style={[styles.minutesText, isLowBalance && styles.lowBalanceText]}>
          {minutesRemaining} {minutesRemaining === 1 ? 'minute' : 'minutes'} remaining
        </Text>
      </View>

      {/* Details section */}
      {showDetails && (
        <View style={styles.detailsSection}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>EARNED</Text>
              <Text style={[styles.statValue, styles.earnedText]}>
                {totalEarned.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>SPENT</Text>
              <Text style={[styles.statValue, styles.spentText]}>
                {totalSpent.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Status indicators */}
      <View style={styles.statusSection}>
        {isLoading && (
          <View style={styles.statusIndicator}>
            <Text style={styles.statusText}>SYNCING...</Text>
          </View>
        )}
        {!offlineStatus.isOnline && (
          <View style={[styles.statusIndicator, styles.offlineIndicator]}>
            <Text style={styles.statusText}>OFFLINE</Text>
          </View>
        )}
        {offlineStatus.unsyncedCount > 0 && (
          <View style={[styles.statusIndicator, styles.queueIndicator]}>
            <Text style={styles.statusText}>
              {offlineStatus.unsyncedCount} PENDING
            </Text>
          </View>
        )}
      </View>

      {/* Low balance warning */}
      {isLowBalance && (
        <View style={styles.warningSection}>
          <Text style={styles.warningText}>
            ⚠️ LOW BALANCE - Complete quests to earn more tokens!
          </Text>
        </View>
      )}

      {/* Cyberpunk border effects */}
      <View style={styles.borderTop} />
      <View style={styles.borderBottom} />
      <View style={styles.borderLeft} />
      <View style={styles.borderRight} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  } as ViewStyle,

  lowBalanceContainer: {
    shadowColor: colors.lowBalance,
    borderColor: colors.lowBalance,
    borderWidth: 1,
  } as ViewStyle,

  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.cardBg,
    opacity: 0.8,
  } as ViewStyle,

  lowBalanceGradient: {
    backgroundColor: '#2a0a0a',
  } as ViewStyle,

  balanceSection: {
    alignItems: 'center',
    marginBottom: 20,
  } as ViewStyle,

  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
  } as TextStyle,

  balanceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 4,
  } as TextStyle,

  lowBalanceText: {
    color: colors.lowBalance,
    textShadowColor: colors.lowBalance,
  } as TextStyle,

  minutesText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  } as TextStyle,

  detailsSection: {
    marginBottom: 16,
  } as ViewStyle,

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  } as ViewStyle,

  statItem: {
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.textSecondary,
    opacity: 0.3,
  } as ViewStyle,

  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  } as TextStyle,

  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  } as TextStyle,

  earnedText: {
    color: colors.success,
  } as TextStyle,

  spentText: {
    color: colors.secondary,
  } as TextStyle,

  statusSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  } as ViewStyle,

  statusIndicator: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginHorizontal: 4,
    marginVertical: 2,
  } as ViewStyle,

  offlineIndicator: {
    backgroundColor: colors.accent,
  } as ViewStyle,

  queueIndicator: {
    backgroundColor: colors.secondary,
  } as ViewStyle,

  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.background,
    letterSpacing: 1,
  } as TextStyle,

  warningSection: {
    backgroundColor: colors.lowBalance,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  } as ViewStyle,

  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  } as TextStyle,

  // Cyberpunk border effects
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.6,
  } as ViewStyle,

  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.6,
  } as ViewStyle,

  borderLeft: {
    position: 'absolute',
    left: 0,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: colors.secondary,
    opacity: 0.6,
  } as ViewStyle,

  borderRight: {
    position: 'absolute',
    right: 0,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: colors.secondary,
    opacity: 0.6,
  } as ViewStyle,
});

export default WalletCard;