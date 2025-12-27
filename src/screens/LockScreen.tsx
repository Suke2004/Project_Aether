/**
 * LockScreen Component
 * Blocking interface when tokens are depleted with encouraging messages
 * Requirements: 2.3, 5.4
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
  TextStyle,
  Animated,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { QuestType } from '../lib/types';
import { dbHelpers } from '../lib/supabase';

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
  lockRed: '#ff1744',      // Lock screen red
};

// Encouraging messages for different scenarios
const ENCOURAGING_MESSAGES = [
  {
    title: "Time to Recharge! ⚡",
    message: "Your screen time tokens are empty, but your potential is full! Complete some quests to unlock more entertainment time.",
  },
  {
    title: "Quest Time! 🎯",
    message: "The best adventures happen offline! Complete a quest and earn tokens to continue your digital journey.",
  },
  {
    title: "Balance Restored! 🌟",
    message: "Every quest completed makes you stronger and smarter. Ready to earn some tokens?",
  },
  {
    title: "Power Up Mode! 🚀",
    message: "Your attention wallet needs a refill! Complete tasks in the real world to unlock digital rewards.",
  },
  {
    title: "Achievement Unlocked! 🏆",
    message: "You've used your screen time wisely! Now it's time to earn more through productive activities.",
  },
];

interface LockScreenProps {
  onNavigateToQuests?: () => void;
  onEmergencyExit?: () => void;
  minTokensRequired?: number;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  onNavigateToQuests,
  onEmergencyExit,
  minTokensRequired = 5,
}) => {
  const { hasRole, profile } = useAuth();
  const { balance, refreshBalance } = useWallet();
  
  // Component state
  const [currentMessage, setCurrentMessage] = useState(ENCOURAGING_MESSAGES[0]);
  const [suggestedQuests, setSuggestedQuests] = useState<QuestType[]>([]);
  const [timeSpentLocked, setTimeSpentLocked] = useState(0);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lockIconAnim = useRef(new Animated.Value(0)).current;
  const messageAnim = useRef(new Animated.Value(0)).current;

  // Load suggested quests and set up animations
  useEffect(() => {
    loadSuggestedQuests();
    startAnimations();
    
    // Rotate encouraging messages every 10 seconds
    const messageInterval = setInterval(() => {
      const randomMessage = ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];
      setCurrentMessage(randomMessage);
      
      // Animate message change
      Animated.sequence([
        Animated.timing(messageAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(messageAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 10000);

    // Track time spent on lock screen
    const timeInterval = setInterval(() => {
      setTimeSpentLocked(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(timeInterval);
    };
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent going back when locked (unless emergency exit is available)
      if (onEmergencyExit) {
        onEmergencyExit();
        return true;
      }
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [onEmergencyExit]);

  // Check if balance has been restored
  useEffect(() => {
    const balanceCheckInterval = setInterval(async () => {
      try {
        await refreshBalance();
        if (balance >= minTokensRequired) {
          // Balance restored, user can exit lock screen
          console.log('Balance restored, exiting lock screen');
          // This would typically be handled by the parent component
        }
      } catch (error) {
        console.error('Failed to refresh balance:', error);
      }
    }, 5000);

    return () => clearInterval(balanceCheckInterval);
  }, [balance, minTokensRequired, refreshBalance]);

  const loadSuggestedQuests = async () => {
    try {
      const allQuests = await dbHelpers.getActiveQuestTypes();
      // Suggest 3 random quests, prioritizing easier ones
      const easyQuests = allQuests.filter(q => q.token_reward <= 15);
      const mediumQuests = allQuests.filter(q => q.token_reward > 15 && q.token_reward <= 25);
      
      const suggested = [
        ...easyQuests.slice(0, 2),
        ...mediumQuests.slice(0, 1),
      ].slice(0, 3);
      
      setSuggestedQuests(suggested);
    } catch (error) {
      console.error('Failed to load suggested quests:', error);
    }
  };

  const startAnimations = () => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Lock icon rotation animation
    const lockRotation = Animated.loop(
      Animated.sequence([
        Animated.timing(lockIconAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(lockIconAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    lockRotation.start();

    // Pulse animation for action buttons
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Initial message animation
    Animated.timing(messageAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  // Ensure only child users see this screen
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Lock icon rotation interpolation
  const lockRotation = lockIconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
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
          },
        ]}
      >
        {/* Lock Icon and Status */}
        <View style={styles.lockSection}>
          <Animated.View
            style={[
              styles.lockIconContainer,
              {
                transform: [{ rotate: lockRotation }],
              },
            ]}
          >
            <Text style={styles.lockIcon}>🔒</Text>
          </Animated.View>
          
          <Text style={styles.lockTitle}>Screen Time Locked</Text>
          <Text style={styles.lockSubtitle}>
            Balance: {balance} tokens (Need {minTokensRequired} to continue)
          </Text>
          
          {timeSpentLocked > 0 && (
            <Text style={styles.timeSpent}>
              Time on lock screen: {formatTime(timeSpentLocked)}
            </Text>
          )}
        </View>

        {/* Encouraging Message */}
        <Animated.View
          style={[
            styles.messageSection,
            {
              opacity: messageAnim,
            },
          ]}
        >
          <Text style={styles.messageTitle}>{currentMessage.title}</Text>
          <Text style={styles.messageText}>{currentMessage.message}</Text>
        </Animated.View>

        {/* Suggested Quests */}
        {suggestedQuests.length > 0 && (
          <View style={styles.questsSection}>
            <Text style={styles.questsTitle}>Quick Quests to Get Started:</Text>
            {suggestedQuests.map((quest, index) => (
              <View key={quest.id} style={styles.questSuggestion}>
                <View style={styles.questInfo}>
                  <Text style={styles.questName}>{quest.name}</Text>
                  <Text style={styles.questReward}>+{quest.token_reward} tokens</Text>
                </View>
                <Text style={styles.questDescription}>{quest.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onNavigateToQuests}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>🎯 Start Quests</Text>
            </TouchableOpacity>
          </Animated.View>

          {onEmergencyExit && (
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={onEmergencyExit}
              activeOpacity={0.8}
            >
              <Text style={styles.emergencyButtonText}>Emergency Exit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Motivational Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Your Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.total_earned || 0}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.total_spent || 0}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>ATTENTION WALLET - LOCKED</Text>
          <View style={styles.footerLine} />
        </View>

        {/* Cyberpunk border effects */}
        <View style={styles.borderTop} />
        <View style={styles.borderBottom} />
        <View style={styles.borderLeft} />
        <View style={styles.borderRight} />
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
    padding: 20,
    justifyContent: 'space-between',
  } as ViewStyle,

  lockSection: {
    alignItems: 'center',
    marginTop: 40,
  } as ViewStyle,

  lockIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.lockRed,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.lockRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  } as ViewStyle,

  lockIcon: {
    fontSize: 60,
    color: colors.text,
  } as TextStyle,

  lockTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.lockRed,
    marginBottom: 8,
    textAlign: 'center',
  } as TextStyle,

  lockSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  } as TextStyle,

  timeSpent: {
    fontSize: 14,
    color: colors.accent,
    textAlign: 'center',
    fontWeight: '600',
  } as TextStyle,

  messageSection: {
    backgroundColor: colors.cardBg,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    marginVertical: 20,
  } as ViewStyle,

  messageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  } as TextStyle,

  messageText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  } as TextStyle,

  questsSection: {
    backgroundColor: colors.cardBg,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
    marginBottom: 20,
  } as ViewStyle,

  questsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 12,
    textAlign: 'center',
  } as TextStyle,

  questSuggestion: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  } as ViewStyle,

  questInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  } as ViewStyle,

  questName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  } as TextStyle,

  questReward: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.success,
  } as TextStyle,

  questDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  } as TextStyle,

  actionsSection: {
    alignItems: 'center',
    marginVertical: 20,
  } as ViewStyle,

  primaryButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  } as ViewStyle,

  primaryButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.background,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,

  emergencyButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 6,
  } as ViewStyle,

  emergencyButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,

  statsSection: {
    backgroundColor: colors.cardBg,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  } as ViewStyle,

  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  } as TextStyle,

  statsRow: {
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

  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 4,
  } as TextStyle,

  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  } as ViewStyle,

  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.lockRed,
    opacity: 0.5,
  } as ViewStyle,

  footerText: {
    color: colors.lockRed,
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

  // Cyberpunk border effects
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: colors.lockRed,
    opacity: 0.6,
  } as ViewStyle,

  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: colors.lockRed,
    opacity: 0.6,
  } as ViewStyle,

  borderLeft: {
    position: 'absolute',
    left: 0,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: colors.lockRed,
    opacity: 0.6,
  } as ViewStyle,

  borderRight: {
    position: 'absolute',
    right: 0,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: colors.lockRed,
    opacity: 0.6,
  } as ViewStyle,
});

export default LockScreen;