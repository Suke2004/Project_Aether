import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { useWallet } from '../context/WalletContext';
import { AppConfig } from '../lib/types';
import { AppLaunchErrorHandler, AppLaunchError } from '../lib/errorHandling';
import { windowManager } from '../lib/windowManager';
import { StableTimer } from './StableTimer';

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
    deepLink: 'vnd.youtube://',
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
    deepLink: 'roblox-player://',
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

interface TimerState {
  appName: string;
  startTime: number;
  tokensSpent: number;
  windowOpened: boolean;
  lastChargeTime: number; // Track when we last charged tokens
}

export const AppLauncher = ({
  apps = DEFAULT_APPS,
  minTokensRequired = 1, // Minimum 1 token to start (proportional charging)
  tokensPerMinute = 5,
  style,
  onAppLaunch,
  onInsufficientBalance,
}: AppLauncherProps) => {
  const { balance, spendTokens, refundTokens, isLoading } = useWallet();
  
  // Component state - restored with proper timer state
  const [launchingApp, setLaunchingApp] = useState<string | null>(null);
  const [appAvailability, setAppAvailability] = useState<Record<string, boolean>>({});
  const [activeTimer, setActiveTimer] = useState<TimerState | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Check app availability on mount
  useEffect(() => {
    checkAppAvailability();
    
    // Cleanup on unmount
    return () => {
      // No window manager cleanup needed for new tabs
    };
  }, []);

  // Simple timer functions
  const startTimer = (appName: string, windowOpened: boolean = false) => {
    console.log('� SEtarting simple timer for', appName);
    setActiveTimer({
      appName,
      startTime: Date.now(),
      tokensSpent: 0,
      windowOpened,
      lastChargeTime: Date.now(),
    });
  };

  const stopTimer = () => {
    console.log('🟦 Stopping timer');
    setActiveTimer(null);
  };

  const handleTokenCharge = (amount: number, description: string) => {
    console.log('🟦 Charging tokens:', amount, description);
    spendTokens(amount, description);
    
    // Update timer state
    setActiveTimer(prev => prev ? {
      ...prev,
      tokensSpent: prev.tokensSpent + amount,
      lastChargeTime: Date.now(),
    } : null);
  };

  const checkAppAvailability = async () => {
    const availability: Record<string, boolean> = {};
    
    for (const app of apps) {
      try {
        if (Platform.OS === 'web') {
          // On web, all apps are "available" via web URLs
          availability[app.name] = true;
        } else if (Platform.OS === 'android') {
          // On Android, we'll assume apps are available and handle failures during launch
          // This is because Android restricts package queries for security
          // We'll show them as available and handle the "not installed" case during launch
          availability[app.name] = true;
        } else {
          // On iOS, try to check if the deep link can be opened
          const canOpen = await Linking.canOpenURL(app.deepLink || app.webUrl || '');
          availability[app.name] = canOpen;
        }
      } catch (error) {
        console.warn(`Error checking availability for ${app.name}:`, error);
        // Default to available - we'll handle launch failures gracefully
        availability[app.name] = true;
      }
    }
    
    console.log('App availability check completed:', availability);
    setAppAvailability(availability);
  };

  const launchApp = async (app: AppConfig) => {
    // Check if timer is already running
    if (activeTimer) {
      Alert.alert(
        'Timer Already Running',
        `${activeTimer.appName} timer is active. Stop it first before launching another app.`,
        [
          { text: 'OK' },
          { text: 'Stop Timer', onPress: stopTimer }
        ]
      );
      return;
    }

    // Check if user has sufficient balance for at least a few seconds of usage
    const minimumTokensNeeded = 1; // At least 1 token to start
    if (balance < minimumTokensNeeded) {
      Alert.alert(
        'Insufficient Balance',
        `You need at least ${minimumTokensNeeded} token to launch ${app.name}. You currently have ${balance} tokens.\n\nComplete quests to earn more tokens!`,
        [
          { text: 'OK' },
          { text: 'Go to Quests', onPress: () => onInsufficientBalance?.() }
        ]
      );
      return;
    }

    try {
      setLaunchingApp(app.name);
      console.log(`Launching ${app.name} with timer system`);

      // Try to open the app
      const launched = await attemptAppLaunch(app);
      
      if (launched) {
        // Start the timer - no window management needed for new tabs
        startTimer(app.name, false); // windowOpened = false since we're using new tabs
        onAppLaunch?.(app);
      } else {
        Alert.alert(
          'App Launch Failed',
          `Unable to open ${app.name}. No tokens were charged.`,
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Error launching app:', error);
      Alert.alert(
        'Launch Error',
        `There was an error launching ${app.name}. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLaunchingApp(null);
    }
  };

  const attemptAppLaunch = async (app: AppConfig): Promise<boolean> => {
    try {
      console.log(`Attempting to launch ${app.name} on ${Platform.OS}`);
      
      // On web platform, open in new tab
      if (Platform.OS === 'web' && app.webUrl) {
        console.log(`🟦 Opening ${app.name} in new tab: ${app.webUrl}`);
        
        // Open URL in new tab
        window.open(app.webUrl, '_blank', 'noopener,noreferrer');
        console.log(`🟦 Successfully opened ${app.name} in new tab`);
        return true;
      }

      // On mobile, try deep link first
      if (app.deepLink) {
        console.log(`Trying deep link: ${app.deepLink}`);
        try {
          // On Android, we can't reliably check canOpenURL for all apps
          // So we'll try to open directly and catch the error
          if (Platform.OS === 'android') {
            await Linking.openURL(app.deepLink);
            console.log(`Successfully opened ${app.name} via deep link`);
            return true;
          } else {
            // On iOS, check first then open
            const canOpenDeepLink = await Linking.canOpenURL(app.deepLink);
            if (canOpenDeepLink) {
              await Linking.openURL(app.deepLink);
              console.log(`Successfully opened ${app.name} via deep link`);
              return true;
            }
          }
        } catch (deepLinkError) {
          console.log(`Deep link failed for ${app.name}:`, deepLinkError);
          // Continue to web fallback
        }
      }

      // Fallback to web URL (also opens in new tab on web)
      if (app.webUrl) {
        console.log(`🟦 Trying web fallback: ${app.webUrl}`);
        try {
          if (Platform.OS === 'web') {
            // Open in new tab on web
            window.open(app.webUrl, '_blank', 'noopener,noreferrer');
            console.log(`🟦 Successfully opened ${app.name} via web URL in new tab`);
          } else {
            // Use Linking on mobile
            await Linking.openURL(app.webUrl);
            console.log(`🟦 Successfully opened ${app.name} via web URL`);
          }
          return true;
        } catch (webError) {
          console.log(`Web fallback failed for ${app.name}:`, webError);
          
          // Show user-friendly message for app not installed
          Alert.alert(
            `${app.name} Not Available`,
            `${app.name} is not installed on your device. Would you like to install it from the app store?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Install', 
                onPress: () => {
                  // Try to open app store
                  const storeUrl = Platform.OS === 'android' 
                    ? `market://details?id=${app.packageName}`
                    : `https://apps.apple.com/search?term=${encodeURIComponent(app.name)}`;
                  Linking.openURL(storeUrl).catch(() => {
                    // Fallback to web store
                    const webStoreUrl = Platform.OS === 'android'
                      ? `https://play.google.com/store/apps/details?id=${app.packageName}`
                      : `https://apps.apple.com/search?term=${encodeURIComponent(app.name)}`;
                    if (Platform.OS === 'web') {
                      window.open(webStoreUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      Linking.openURL(webStoreUrl);
                    }
                  });
                }
              }
            ]
          );
          return false;
        }
      }

      throw new Error('No valid launch method available');
    } catch (error) {
      console.error(`Failed to launch ${app.name}:`, error);
      
      // Show user-friendly error message
      Alert.alert(
        'App Launch Failed',
        `Unable to open ${app.name}. This might be because:\n\n• The app is not installed\n• The app doesn't support this launch method\n• There's a temporary issue\n\nYour tokens have been refunded.`,
        [{ text: 'OK' }]
      );
      
      return false;
    }
  };

  const renderAppItem = ({ item: app }: { item: AppConfig }) => {
    const isAvailable = appAvailability[app.name] !== false;
    const canAfford = balance >= minTokensRequired; // Only need minimum tokens to start
    const isLaunching = launchingApp === app.name;
    const isTimerRunning = activeTimer?.appName === app.name;
    const isDisabled = !canAfford || isLoading || isLaunching || (activeTimer && !isTimerRunning);

    return (
      <TouchableOpacity
        style={[
          styles.appItem,
          isDisabled && styles.appItemDisabled,
        ]}
        onPress={() => launchApp(app)}
        disabled={isDisabled || false}
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
        
        {isTimerRunning ? (
          <Text style={styles.runningText}>
            ⏱️ Timer Active
          </Text>
        ) : !canAfford ? (
          <Text style={styles.insufficientText}>
            Need more tokens
          </Text>
        ) : activeTimer ? (
          <Text style={styles.blockedText}>
            Stop current timer first
          </Text>
        ) : (
          <Text style={styles.costText}>
            ~{tokensPerMinute} tokens/min
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
        },
      ]}
    >
      {/* Stable Timer Display */}
      {activeTimer && (
        <StableTimer
          key={`timer-${activeTimer.appName}`}
          appName={activeTimer.appName}
          startTime={activeTimer.startTime}
          tokensSpent={activeTimer.tokensSpent}
          balance={balance}
          tokensPerMinute={tokensPerMinute}
          onStop={stopTimer}
          windowOpened={false} // No window management for new tabs
          onTokenCharge={handleTokenCharge}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Entertainment Apps</Text>
        <Text style={styles.balanceInfo}>
          Balance: {balance} tokens (~{Math.floor(balance / tokensPerMinute * 60)} seconds available)
        </Text>
      </View>

      {/* Apps Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.appsGrid}>
          {apps.map((item, index) => (
            <View key={item.name} style={styles.appItemWrapper}>
              {renderAppItem({ item })}
            </View>
          ))}
        </View>
      </View>

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
          • Apps charge proportionally: ~{tokensPerMinute} tokens per minute
        </Text>
        <Text style={styles.infoText}>
          • Tokens charged every second based on actual usage
        </Text>
        <Text style={styles.infoText}>
          • Apps close automatically when balance runs out
        </Text>
        <Text style={styles.infoText}>
          • Timer stops automatically when you close the app
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
    // Use boxShadow for web compatibility
    ...(Platform.OS === 'web' ? {
      boxShadow: `0 0 5px ${colors.primary}30`,
    } : {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
    }),
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

  runningText: {
    fontSize: 12,
    color: colors.success,
    textAlign: 'center',
    fontWeight: 'bold',
  } as TextStyle,

  blockedText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  } as TextStyle,

  // Timer Display Styles
  timerDisplay: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 2,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 100, // Increased elevation to ensure it's always visible
    zIndex: 100, // Added z-index for web compatibility
  } as ViewStyle,

  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,

  timerAppName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  } as TextStyle,

  timerButtons: {
    flexDirection: 'row',
    gap: 8,
  } as ViewStyle,

  focusWindowButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  } as ViewStyle,

  focusWindowText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  } as TextStyle,

  stopTimerButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  } as ViewStyle,

  stopTimerText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  } as TextStyle,

  timerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  timerTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: 'monospace',
  } as TextStyle,

  timerSpent: {
    fontSize: 12,
    color: colors.textSecondary,
  } as TextStyle,

  timerRemaining: {
    fontSize: 12,
    color: colors.accent,
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

  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  } as ViewStyle,

  appItemWrapper: {
    width: `${100 / 2 - 2}%`, // 2 columns with spacing
    marginBottom: 16,
  } as ViewStyle,

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