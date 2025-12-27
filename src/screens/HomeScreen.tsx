/**
 * HomeScreen Component
 * Main child interface integrating WalletCard and AppLauncher components
 * Requirements: 2.1, 5.1, 5.2
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
  TextStyle,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { WalletCard } from '../components/WalletCard';
import { AppLauncher } from '../components/AppLauncher';
import { AppConfig } from '../lib/types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Cyberpunk color scheme
const colors = {
  primary: '#00ffff',      // Cyan
  secondary: '#ff00ff',    // Magenta
  accent: '#ffff00',       // Yellow
  background: '#0a0a0a',   // Dark background
  cardBg: '#1a1a2e',       // Card background
  success: '#00ff80',      // Green
  error: '#ff0040',        // Red
  text: '#ffffff',         // White text
  textSecondary: '#b0b0b0', // Gray text
};

interface HomeScreenProps {
  onNavigateToQuests?: () => void;
  onNavigateToSettings?: () => void;
  onAppLaunch?: (app: AppConfig) => void;
  onInsufficientBalance?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToQuests,
  onNavigateToSettings,
  onAppLaunch,
  onInsufficientBalance,
}) => {
  const { user, profile, hasRole } = useAuth();
  const { balance, isLoading } = useWallet();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerGlowAnim = useRef(new Animated.Value(0)).current;
  
  // Component state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  // Animate component entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Start header glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(headerGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(headerGlowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowLoop.start();

    return () => glowLoop.stop();
  }, []);

  // Ensure only child users can access this screen
  if (!hasRole('child')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>
            This screen is only available for child accounts.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAppLaunch = (app: AppConfig) => {
    console.log('App launched from HomeScreen:', app.name);
    onAppLaunch?.(app);
  };

  const handleInsufficientBalance = () => {
    console.log('Insufficient balance, navigating to quests');
    onInsufficientBalance?.();
    onNavigateToQuests?.();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Animated glow intensity
  const glowIntensity = headerGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [5, 15],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header Section */}
        <Animated.View
          style={[
            styles.header,
            {
              shadowRadius: glowIntensity,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {profile?.id ? `User ${profile.id.slice(0, 8)}` : 'Attention Wallet'}
              </Text>
            </View>
            
            <View style={styles.timeSection}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.dateText}>
                {currentTime.toLocaleDateString([], { 
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={onNavigateToQuests}
              activeOpacity={0.7}
            >
              <Text style={styles.navButtonIcon}>🎯</Text>
              <Text style={styles.navButtonText}>Quests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={onNavigateToSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.navButtonIcon}>⚙️</Text>
              <Text style={styles.navButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Cyberpunk border effects */}
          <View style={styles.headerBorderTop} />
          <View style={styles.headerBorderBottom} />
        </Animated.View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Wallet Card Section */}
          <View style={styles.walletSection}>
            <WalletCard
              showDetails={true}
              lowBalanceThreshold={25}
              style={styles.walletCard}
            />
          </View>

          {/* App Launcher Section */}
          <View style={styles.launcherSection}>
            <AppLauncher
              minTokensRequired={5}
              tokensPerMinute={5}
              onAppLaunch={handleAppLaunch}
              onInsufficientBalance={handleInsufficientBalance}
              style={styles.appLauncher}
            />
          </View>

          {/* Status Messages */}
          {balance === 0 && (
            <View style={styles.statusMessage}>
              <Text style={styles.statusTitle}>🚀 Ready to Earn?</Text>
              <Text style={styles.statusText}>
                Complete quests to earn tokens and unlock entertainment apps!
              </Text>
              <TouchableOpacity
                style={styles.statusButton}
                onPress={onNavigateToQuests}
              >
                <Text style={styles.statusButtonText}>Start Quests</Text>
              </TouchableOpacity>
            </View>
          )}

          {balance > 0 && balance < 25 && (
            <View style={[styles.statusMessage, styles.warningMessage]}>
              <Text style={styles.statusTitle}>⚠️ Low Balance</Text>
              <Text style={styles.statusText}>
                You're running low on tokens. Complete more quests to keep playing!
              </Text>
              <TouchableOpacity
                style={styles.statusButton}
                onPress={onNavigateToQuests}
              >
                <Text style={styles.statusButtonText}>Earn More</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingSection}>
              <Text style={styles.loadingText}>Syncing wallet data...</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer with cyberpunk styling */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>ATTENTION WALLET v1.0</Text>
          <View style={styles.footerLine} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,

  content: {
    flex: 1,
  } as ViewStyle,

  header: {
    backgroundColor: colors.cardBg,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    elevation: 8,
  } as ViewStyle,

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  } as ViewStyle,

  greetingSection: {
    flex: 1,
  } as ViewStyle,

  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  } as TextStyle,

  userName: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  } as TextStyle,

  timeSection: {
    alignItems: 'flex-end',
  } as ViewStyle,

  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 2,
  } as TextStyle,

  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
  } as TextStyle,

  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  } as ViewStyle,

  navButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 80,
  } as ViewStyle,

  navButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  } as TextStyle,

  navButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,

  headerBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.secondary,
    opacity: 0.6,
  } as ViewStyle,

  headerBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
  } as ViewStyle,

  scrollContent: {
    flex: 1,
  } as ViewStyle,

  scrollContainer: {
    paddingBottom: 20,
  } as ViewStyle,

  walletSection: {
    marginTop: 8,
  } as ViewStyle,

  walletCard: {
    marginHorizontal: 0,
  } as ViewStyle,

  launcherSection: {
    marginTop: 16,
  } as ViewStyle,

  appLauncher: {
    backgroundColor: 'transparent',
  } as ViewStyle,

  statusMessage: {
    backgroundColor: colors.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
  } as ViewStyle,

  warningMessage: {
    borderColor: colors.accent,
    backgroundColor: '#2a2a0a',
  } as ViewStyle,

  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  } as TextStyle,

  statusText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  } as TextStyle,

  statusButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  } as ViewStyle,

  statusButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,

  loadingSection: {
    padding: 20,
    alignItems: 'center',
  } as ViewStyle,

  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  } as TextStyle,

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
  } as ViewStyle,

  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.3,
  } as ViewStyle,

  footerText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    marginHorizontal: 16,
  } as TextStyle,

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  } as ViewStyle,

  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 8,
    textAlign: 'center',
  } as TextStyle,

  errorSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
});

export default HomeScreen;