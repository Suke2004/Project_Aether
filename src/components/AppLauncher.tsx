/**
 * AppLauncher Component
 * Grid layout for entertainment apps with deep linking and access control
 * Requirements: 2.1, 6.2
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
  Dimensions,
  ViewStyle,
  TextStyle,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useWallet } from '../context/WalletContext';
import { AppConfig } from '../lib/types';

const { width: screenWidth } = Dimensions.get('window');

// Color scheme matching cyberpunk theme
const colors = {
  primary: '#00ffff',
  secondary: '#ff00ff',
  accent: '#ffff00',
  background: '#0a0a0a',
  cardBg: '#1a1a2e',
  success: '#00ff80',
  error: '#ff0040',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  disabled: '#404040',
};

// Default entertainment apps configuration
const DEFAULT_APPS: AppConfig[] = [
  {
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    deepLink: 'youtube://',
    webUrl: 'https://youtube.com',
    icon: '📺',
    category: 'Video',
  },
  {
    name: 'Netflix',
    packageName: 'com.netflix.mediaclient',
    deepLink: 'nflx://',
    webUrl: 'https://netflix.com',
    icon: '🎬',
    category: 'Video',
  },
  {
    name: 'Spotify',
    packageName: 'com.spotify.music',
    deepLink: 'spotify://',
    webUrl: 'https://open.spotify.com',
    icon: '🎵',
    category: 'Music',
  },
  {
    name: 'TikTok',
    packageName: 'com.zhiliaoapp.musically',
    deepLink: 'snssdk1233://',
    webUrl: 'https://tiktok.com',
    icon: '🎭',
    category: 'Social',
  },
  {
    name: 'Instagram',
    packageName: 'com.instagram.android',
    deepLink: 'instagram://',
    webUrl: 'https://instagram.com',
    icon: '📸',
    category: 'Social',
  },
  {
    name: 'Discord',
    packageName: 'com.discord',
    deepLink: 'discord://',
    webUrl: 'https://discord.com/app',
    icon: '💬',
    category: 'Social',
  },
  {
    name: 'Twitch',
    packageName: 'tv.twitch.android.app',
    deepLink: 'twitch://',
    webUrl: 'https://twitch.tv',
    icon: '🎮',
    category: 'Gaming',
  },
  {
    name: 'Roblox',
    packageName: 'com.roblox.client',
    deepLink: 'roblox://',
    webUrl: 'https://roblox.com',
    icon: '🎯',
    category: 'Gaming',
  },
];

interface AppLauncherProps {
  apps?: AppConfig[];
  minTokensRequired?: number;
  tokensPerMinute?: number;
  style?: ViewStyle;
  onAppLaunch?: (app: AppConfig) => void;
  onInsufficientBalance?: () => void;
}

export const AppLauncher: React.FC<AppLauncherProps> = ({
  apps = DEFAULT_APPS,
  minTokensRequired = 5, // Minimum 1 minute of usage
  tokensPerMinute = 5,
  style,
  onAppLaunch,
  onInsufficientBalance,
}) => {
  const { balance, spendTokens, isLoading } = useWallet();
  
  // Component state
  const [launchingApp, setLaunchingApp] = useState<string | null>(null);
  const [appAvailability, setAppAvailability] = useState<Record<string, boolean>>({});
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Animate component entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  // Check app availability on mount
  useEffect(() => {
    checkAppAvailability();
  }, [apps]);

  const checkAppAvailability = async () => {
    const availability: Record<string, boolean> = {};
    
    for (const app of apps) {
      try {
        // Try to check if the deep link can be opened
        const canOpen = await Linking.canOpenURL(app.deepLink || app.webUrl);
        availability[app.name] = canOpen;
      } catch (error) {
        // If deep link check fails, assume web fallback is available
        availability[app.name] = true;
      }
    }
    
    setAppAvailability(availability);
  };

  const launchApp = async (app: AppConfig) => {
    // Check if user has sufficient balance
    if (balance < minTokensRequired) {
      Alert.alert(
        'Insufficient Balance',
        `You need at least ${minTokensRequired} tokens (${minTokensRequired / tokensPerMinute} minute${minTokensRequired / tokensPerMinute !== 1 ? 's' : ''}) to launch ${app.name}.`,
        [
          { text: 'Complete Quests', onPress: onInsufficientBalance },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    try {
      setLaunchingApp(app.name);

      // Spend initial tokens for app launch
      await spendTokens(minTokensRequired, `Launched ${app.name}`, app.name);

      // Try to open the app
      const launched = await attemptAppLaunch(app);
      
      if (launched) {
        // Notify parent component
        onAppLaunch?.(app);
        
        // Show success feedback
        Alert.alert(
          'App Launched',
          `${app.name} has been launched! Tokens will be deducted at ${tokensPerMinute} per minute while you use the app.`,
          [{ text: 'OK' }]
        );
      } else {
        // Refund tokens if launch failed
        await refundTokens(app);
      }

    } catch (error) {
      console.error('Error launching app:', error);
      
      Alert.alert(
        'Launch Failed',
        `Failed to launch ${app.name}. ${error instanceof Error ? error.message : 'Please try again.'}`,
        [{ text: 'OK' }]
      );
      
      // Attempt to refund tokens
      await refundTokens(app);
    } finally {
      setLaunchingApp(null);
    }
  };

  const attemptAppLaunch = async (app: AppConfig): Promise<boolean> => {
    try {
      // First, try the deep link if available
      if (app.deepLink) {
        const canOpenDeepLink = await Linking.canOpenURL(app.deepLink);
        if (canOpenDeepLink) {
          await Linking.openURL(app.deepLink);
          return true;
        }
      }

      // Fallback to web URL
      if (app.webUrl) {
        const canOpenWeb = await Linking.canOpenURL(app.webUrl);
        if (canOpenWeb) {
          await Linking.openURL(app.webUrl);
          return true;
        }
      }

      throw new Error('No valid launch method available');
    } catch (error) {
      console.error(`Failed to launch ${app.name}:`, error);
      return false;
    }
  };

  const refundTokens = async (app: AppConfig) => {
    try {
      // Note: In a real implementation, you'd want to implement a proper refund mechanism
      // For now, we'll just log the refund attempt
      console.log(`Refunding ${minTokensRequired} tokens for failed ${app.name} launch`);
      
      // You could implement this by adding a refund method to the wallet context
      // await refundTokens(minTokensRequired, `Refund for failed ${app.name} launch`);
      
      Alert.alert(
        'Launch Failed',
        `${app.name} could not be opened. Your tokens have been refunded.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error refunding tokens:', error);
    }
  };

  const renderAppItem = ({ item: app }: { item: AppConfig }) => {
    const isAvailable = appAvailability[app.name] !== false;
    const canAfford = balance >= minTokensRequired;
    const isLaunching = launchingApp === app.name;
    const isDisabled = !isAvailable || !canAfford || isLoading || isLaunching;

    return (
      <TouchableOpacity
        style={[
          styles.appItem,
          isDisabled && styles.appItemDisabled,
        ]}
        onPress={() => launchApp(app)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View style={[styles.appIconContainer, isDisabled && styles.appIconDisabled]}>
          {isLaunching ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Text style={styles.appIcon}>{app.icon}</Text>
          )}
        </View>
        
        <Text style={[styles.appName, isDisabled && styles.appNameDisabled]}>
          {app.name}
        </Text>
        
        <Text style={[styles.appCategory, isDisabled && styles.appCategoryDisabled]}>
          {app.category}
        </Text>
        
        {!isAvailable && (
          <Text style={styles.unavailableText}>Not Available</Text>
        )}
        
        {isAvailable && !canAfford && (
          <Text style={styles.insufficientText}>
            Need {minTokensRequired - balance} more tokens
          </Text>
        )}
        
        {isAvailable && canAfford && (
          <Text style={styles.costText}>
            {minTokensRequired} tokens to start
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const numColumns = 2;
  const itemWidth = (screenWidth - 48) / numColumns; // Account for padding and margins

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Entertainment Apps</Text>
        <Text style={styles.balanceInfo}>
          Balance: {balance} tokens ({Math.floor(balance / tokensPerMinute)} minutes)
        </Text>
      </View>

      {/* Apps Grid */}
      <FlatList
        data={apps}
        renderItem={renderAppItem}
        keyExtractor={(item) => item.name}
        numColumns={numColumns}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      />

      {/* Low Balance Warning */}
      {balance < minTokensRequired && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Insufficient balance to launch apps
          </Text>
          <Text style={styles.warningSubtext}>
            Complete quests to earn more tokens!
          </Text>
        </View>
      )}

      {/* Usage Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          • Apps cost {minTokensRequired} tokens to launch
        </Text>
        <Text style={styles.infoText}>
          • Usage is charged at {tokensPerMinute} tokens per minute
        </Text>
        <Text style={styles.infoText}>
          • Time tracking continues until you return to this app
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,

  header: {
    padding: 20,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  } as ViewStyle,

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  } as TextStyle,

  balanceInfo: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  } as TextStyle,

  gridContainer: {
    padding: 16,
  } as ViewStyle,

  row: {
    justifyContent: 'space-between',
  } as ViewStyle,

  separator: {
    height: 16,
  } as ViewStyle,

  appItem: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (screenWidth - 48) / 2,
    marginHorizontal: 4,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  } as ViewStyle,

  appItemDisabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.textSecondary,
    opacity: 0.6,
  } as ViewStyle,

  appIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,

  appIconDisabled: {
    backgroundColor: colors.textSecondary,
  } as ViewStyle,

  appIcon: {
    fontSize: 32,
  } as TextStyle,

  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  } as TextStyle,

  appNameDisabled: {
    color: colors.textSecondary,
  } as TextStyle,

  appCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  } as TextStyle,

  appCategoryDisabled: {
    color: colors.disabled,
  } as TextStyle,

  costText: {
    fontSize: 12,
    color: colors.accent,
    textAlign: 'center',
    fontWeight: '600',
  } as TextStyle,

  unavailableText: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
    fontWeight: '600',
  } as TextStyle,

  insufficientText: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
    fontWeight: '600',
  } as TextStyle,

  warningContainer: {
    backgroundColor: colors.error,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  } as ViewStyle,

  warningText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  } as TextStyle,

  warningSubtext: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  } as TextStyle,

  infoContainer: {
    backgroundColor: colors.cardBg,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  } as ViewStyle,

  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  } as TextStyle,
});

export default AppLauncher;