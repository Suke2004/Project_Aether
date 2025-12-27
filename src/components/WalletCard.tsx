import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
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

  // Determine if balance is low
  const isLowBalance = balance <= lowBalanceThreshold;

  // Calculate minutes remaining
  const minutesRemaining = Math.floor(balance / 5);

  return (
    <View
      style={[
        styles.container,
        style,
        isLowBalance && styles.lowBalanceContainer,
      ]}
    >
      {/* Main balance display */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>TOKENS</Text>
        <Text style={[styles.balanceValue, isLowBalance && styles.lowBalanceText]}>
          {balance}
        </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  } as ViewStyle,

  lowBalanceContainer: {
    borderColor: colors.lowBalance,
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
    marginBottom: 4,
  } as TextStyle,

  lowBalanceText: {
    color: colors.lowBalance,
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
});

export default WalletCard;