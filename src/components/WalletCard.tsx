import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
  Animated,
  Platform,
} from 'react-native';
import { useWallet } from '../context/WalletContext';

const { width: screenWidth } = Dimensions.get('window');

// Simple color scheme
const colors = {
  primary: '#00ffff',      // Cyan
  secondary: '#ff00ff',    // Magenta
  accent: '#ffff00',       // Yellow
  background: '#0a0a0a',   // Dark background
  cardBg: '#1a1a2e',       // Card background
  lowBalance: '#ff0040',   // Red for low balance
  success: '#00ff80',      // Green for positive values
  error: '#ff0040',        // Red for errors
  text: '#ffffff',         // White text
  textSecondary: '#b0b0b0', // Gray text
};

interface WalletCardProps {
  style?: ViewStyle;
  showDetails?: boolean;
  lowBalanceThreshold?: number;
}

export const WalletCard = ({
  style,
  showDetails = true,
  lowBalanceThreshold = 25,
}: WalletCardProps) => {
  const { balance, totalEarned, totalSpent, isLoading, offlineStatus } = useWallet();

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const balanceChangeAnim = useRef(new Animated.Value(0)).current;
  const prevBalance = useRef(balance);

  // Determine if balance is low
  const isLowBalance = balance <= lowBalanceThreshold;

  // Calculate minutes remaining
  const minutesRemaining = Math.floor(balance / 5);

  // Pulse animation for low balance
  useEffect(() => {
    if (isLowBalance) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLowBalance, pulseAnim]);

  // Glow animation for status indicators
  useEffect(() => {
    const glow = () => {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]).start(() => glow());
    };
    glow();
  }, [glowAnim]);

  // Balance change animation
  useEffect(() => {
    if (prevBalance.current !== balance) {
      Animated.sequence([
        Animated.timing(balanceChangeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(balanceChangeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      prevBalance.current = balance;
    }
  }, [balance, balanceChangeAnim]);

  const balanceChangeScale = balanceChangeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        isLowBalance && styles.lowBalanceContainer,
        {
          transform: [{ scale: pulseAnim }],
          shadowOpacity: isLowBalance ? glowOpacity : 0.3,
        },
      ]}
    >
      {/* Main balance display */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>TOKENS</Text>
        <Animated.Text 
          style={[
            styles.balanceValue, 
            isLowBalance && styles.lowBalanceText,
            {
              transform: [{ scale: balanceChangeScale }],
            },
          ]}
        >
          {balance}
        </Animated.Text>
        <Text style={[styles.minutesText, isLowBalance && styles.lowBalanceText]}>
          {minutesRemaining} {minutesRemaining === 1 ? 'minute' : 'minutes'} remaining
        </Text>
        
        {/* Balance status indicator */}
        <View style={styles.balanceIndicator}>
          <View style={[
            styles.balanceBar,
            { width: `${Math.min((balance / 100) * 100, 100)}%` },
            isLowBalance && styles.lowBalanceBar,
          ]} />
        </View>
      </View>

      {/* Details section with enhanced styling */}
      {showDetails && (
        <View style={styles.detailsSection}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>EARNED</Text>
              <Animated.Text style={[styles.statValue, styles.earnedText]}>
                +{totalEarned.toLocaleString()}
              </Animated.Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>SPENT</Text>
              <Animated.Text style={[styles.statValue, styles.spentText]}>
                -{totalSpent.toLocaleString()}
              </Animated.Text>
            </View>
          </View>
          
          {/* Net balance indicator */}
          <View style={styles.netBalanceSection}>
            <Text style={styles.netBalanceLabel}>NET BALANCE</Text>
            <Text style={[
              styles.netBalanceValue,
              (totalEarned - totalSpent) >= 0 ? styles.positiveBalance : styles.negativeBalance
            ]}>
              {totalEarned - totalSpent >= 0 ? '+' : ''}{(totalEarned - totalSpent).toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Enhanced status indicators */}
      <View style={styles.statusSection}>
        {isLoading && (
          <Animated.View style={[styles.statusIndicator, styles.loadingIndicator, {
            opacity: glowOpacity,
          }]}>
            <Text style={styles.statusText}>⚡ SYNCING...</Text>
          </Animated.View>
        )}
        {!offlineStatus.isOnline && (
          <View style={[styles.statusIndicator, styles.offlineIndicator]}>
            <Text style={styles.statusText}>📡 OFFLINE</Text>
          </View>
        )}
        {offlineStatus.unsyncedCount > 0 && (
          <Animated.View style={[styles.statusIndicator, styles.queueIndicator, {
            opacity: glowOpacity,
          }]}>
            <Text style={styles.statusText}>
              📤 {offlineStatus.unsyncedCount} PENDING
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Enhanced low balance warning */}
      {isLowBalance && (
        <Animated.View style={[styles.warningSection, {
          opacity: glowOpacity,
        }]}>
          <Text style={styles.warningText}>
            ⚠️ LOW BALANCE ALERT
          </Text>
          <Text style={styles.warningSubtext}>
            Complete quests to earn more tokens and continue using apps!
          </Text>
        </Animated.View>
      )}

      {/* Demo enhancement: Usage efficiency indicator */}
      {showDetails && (
        <View style={styles.efficiencySection}>
          <Text style={styles.efficiencyLabel}>USAGE EFFICIENCY</Text>
          <View style={styles.efficiencyBar}>
            <View style={[
              styles.efficiencyFill,
              { 
                width: `${Math.min((balance / (totalSpent || 1)) * 100, 100)}%`,
                backgroundColor: balance > totalSpent ? colors.success : colors.accent,
              }
            ]} />
          </View>
          <Text style={styles.efficiencyText}>
            {totalSpent > 0 ? `${Math.round((balance / totalSpent) * 100)}% efficiency` : 'Perfect efficiency'}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    ...(Platform.OS === 'web' ? {
      boxShadow: `0 4px 20px ${colors.primary}30`,
    } : {}),
  } as ViewStyle,

  lowBalanceContainer: {
    borderColor: colors.lowBalance,
    backgroundColor: '#2a0a0a',
    shadowColor: colors.lowBalance,
    ...(Platform.OS === 'web' ? {
      boxShadow: `0 4px 20px ${colors.lowBalance}50`,
    } : {}),
  } as ViewStyle,

  balanceSection: {
    alignItems: 'center',
    marginBottom: 24,
  } as ViewStyle,

  balanceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 3,
    marginBottom: 12,
  } as TextStyle,

  balanceValue: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 8,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  } as TextStyle,

  lowBalanceText: {
    color: colors.lowBalance,
    textShadowColor: colors.lowBalance,
  } as TextStyle,

  minutesText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 16,
  } as TextStyle,

  balanceIndicator: {
    width: '100%',
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  } as ViewStyle,

  balanceBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  } as ViewStyle,

  lowBalanceBar: {
    backgroundColor: colors.lowBalance,
    shadowColor: colors.lowBalance,
  } as ViewStyle,

  detailsSection: {
    marginBottom: 20,
  } as ViewStyle,

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  } as ViewStyle,

  statItem: {
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,

  statDivider: {
    width: 2,
    height: 40,
    backgroundColor: colors.primary,
    opacity: 0.5,
    borderRadius: 1,
  } as ViewStyle,

  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 6,
  } as TextStyle,

  statValue: {
    fontSize: 20,
    fontWeight: '800',
  } as TextStyle,

  earnedText: {
    color: colors.success,
    textShadowColor: colors.success,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  } as TextStyle,

  spentText: {
    color: colors.secondary,
    textShadowColor: colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  } as TextStyle,

  netBalanceSection: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary,
    opacity: 0.3,
  } as ViewStyle,

  netBalanceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 4,
  } as TextStyle,

  netBalanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  } as TextStyle,

  positiveBalance: {
    color: colors.success,
  } as TextStyle,

  negativeBalance: {
    color: colors.lowBalance,
  } as TextStyle,

  statusSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  } as ViewStyle,

  statusIndicator: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,

  loadingIndicator: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
  } as ViewStyle,

  offlineIndicator: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
  } as ViewStyle,

  queueIndicator: {
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
  } as ViewStyle,

  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  } as TextStyle,

  warningSection: {
    backgroundColor: colors.lowBalance,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    shadowColor: colors.lowBalance,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  } as ViewStyle,

  warningText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  } as TextStyle,

  warningSubtext: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    opacity: 0.9,
  } as TextStyle,

  efficiencySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary,
    opacity: 0.3,
  } as ViewStyle,

  efficiencyLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  } as TextStyle,

  efficiencyBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.background,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  } as ViewStyle,

  efficiencyFill: {
    height: '100%',
    borderRadius: 2,
  } as ViewStyle,

  efficiencyText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  } as TextStyle,
});

export default WalletCard;