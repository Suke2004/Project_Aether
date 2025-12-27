import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
  TextStyle,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { WalletCard } from '../components/WalletCard';
import { AppLauncher } from '../components/AppLauncher';
import { RealTimeClock } from '../components/RealTimeClock';
import { AppConfig } from '../lib/types';

// Import the RootStackParamList type
type RootStackParamList = {
  Home: undefined;
  Quest: undefined;
  Settings: undefined;
  Lock: undefined;
  ParentDashboard: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

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
  onAppLaunch?: (app: AppConfig) => void;
  onInsufficientBalance?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onAppLaunch,
  onInsufficientBalance,
}) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, profile, hasRole } = useAuth();
  const { balance, isLoading } = useWallet();

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
    navigation.navigate('Quest');
  };

  const handleNavigateToQuests = () => {
    navigation.navigate('Quest');
  };

  const handleNavigateToSettings = () => {
    navigation.navigate('Settings');
  };

  const handleNavigateToParentDashboard = () => {
    navigation.navigate('ParentDashboard');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {profile?.id ? `User ${profile.id.slice(0, 8)}` : 'Attention Wallet'}
              </Text>
            </View>
            
            <RealTimeClock
              timeStyle={styles.timeText}
              dateStyle={styles.dateText}
              showDate={true}
              showSeconds={false}
              format24Hour={false}
            />
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNavigateToQuests}
              activeOpacity={0.7}
            >
              <Text style={styles.navButtonIcon}>🎯</Text>
              <Text style={styles.navButtonText}>Quests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNavigateToSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.navButtonIcon}>⚙️</Text>
              <Text style={styles.navButtonText}>Settings</Text>
            </TouchableOpacity>

            {/* Parent Dashboard Button - Only show for parent role */}
            {hasRole('parent') && (
              <TouchableOpacity
                style={[styles.navButton, styles.parentButton]}
                onPress={handleNavigateToParentDashboard}
                activeOpacity={0.7}
              >
                <Text style={styles.navButtonIcon}>👨‍👩‍👧‍👦</Text>
                <Text style={styles.navButtonText}>Dashboard</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cyberpunk border effects */}
          <View style={styles.headerBorderTop} />
          <View style={styles.headerBorderBottom} />
        </View>

        {/* Main Content - Web-Compatible Scrollable */}
        {Platform.OS === 'web' ? (
          <div style={{
            position: 'absolute',
            top: '180px', // Fixed position below header
            left: '0',
            right: '0',
            bottom: '60px', // Fixed position above footer
            overflowY: 'scroll',
            backgroundColor: '#0a0a0a',
            padding: '16px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'auto',
            scrollbarColor: '#00ffff #333',
          }}>
            {/* Wallet Card Section */}
            <div style={{ marginTop: '8px' }}>
              <WalletCard
                showDetails={true}
                lowBalanceThreshold={25}
                style={styles.walletCard}
              />
            </div>

            {/* App Launcher Section */}
            <div style={{ marginTop: '16px' }}>
              <AppLauncher
                minTokensRequired={5}
                tokensPerMinute={5}
                onAppLaunch={handleAppLaunch}
                onInsufficientBalance={handleInsufficientBalance}
                style={styles.appLauncher}
              />
            </div>

            {/* Extra bottom spacing for scrolling */}
            <div style={{ height: '50px' }}></div>
          </div>
        ) : (
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
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

            {/* Extra bottom spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        )}

        {/* Footer with cyberpunk styling */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>ATTENTION WALLET v1.0</Text>
          <View style={styles.footerLine} />
        </View>
      </View>
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

  parentButton: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.secondary,
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

  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,

  scrollContent: {
    paddingHorizontal: 16,
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

  bottomSpacing: {
    height: 50,
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