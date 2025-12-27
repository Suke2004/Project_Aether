/**
 * QuestScreen Component
 * Quest selection and completion interface with AI verification
 * Requirements: 1.1, 1.2, 1.3
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  ViewStyle,
  TextStyle,
  Animated,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { QuestCam } from '../components/QuestCam';
import { QuestType } from '../lib/types';
import { dbHelpers } from '../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

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

interface QuestScreenProps {
  onBack?: () => void;
  onQuestComplete?: (tokensEarned: number) => void;
}

export const QuestScreen: React.FC<QuestScreenProps> = ({
  onBack,
  onQuestComplete,
}) => {
  const { hasRole } = useAuth();
  const { balance } = useWallet();
  
  // Component state
  const [questTypes, setQuestTypes] = useState<QuestType[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<QuestType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerGlowAnim = useRef(new Animated.Value(0)).current;

  // Load quest types on mount
  useEffect(() => {
    loadQuestTypes();
  }, []);

  // Animate component entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Start header glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(headerGlowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(headerGlowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );
    glowLoop.start();

    return () => glowLoop.stop();
  }, []);

  const loadQuestTypes = async () => {
    try {
      setIsLoading(true);
      const activeQuests = await dbHelpers.getActiveQuestTypes();
      setQuestTypes(activeQuests);
      console.log('Loaded quest types:', activeQuests.length);
    } catch (error) {
      console.error('Failed to load quest types:', error);
      Alert.alert(
        'Error',
        'Failed to load available quests. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure only child users can access this screen
  if (!hasRole('child')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>
            This screen is only available for child accounts.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleQuestSelect = (quest: QuestType) => {
    setSelectedQuest(quest);
    setShowCamera(true);
  };

  const handleQuestComplete = (success: boolean, tokensEarned?: number) => {
    setShowCamera(false);
    setSelectedQuest(null);

    if (success && tokensEarned) {
      // Show success feedback
      Alert.alert(
        '🎉 Quest Complete!',
        `Congratulations! You earned ${tokensEarned} tokens for completing "${selectedQuest?.name}".`,
        [
          {
            text: 'Continue',
            onPress: () => {
              onQuestComplete?.(tokensEarned);
            },
          },
        ]
      );
    } else {
      // Show failure feedback with encouragement
      Alert.alert(
        'Quest Not Complete',
        'The AI couldn\'t verify your quest completion. Don\'t worry - try again or choose a different quest!',
        [
          { text: 'Try Again', onPress: () => handleQuestSelect(selectedQuest!) },
          { text: 'Choose Different Quest', style: 'cancel' },
        ]
      );
    }
  };

  const handleCameraCancel = () => {
    setShowCamera(false);
    setSelectedQuest(null);
  };

  const renderQuestItem = ({ item: quest }: { item: QuestType }) => {
    return (
      <TouchableOpacity
        style={styles.questItem}
        onPress={() => handleQuestSelect(quest)}
        activeOpacity={0.7}
      >
        <View style={styles.questHeader}>
          <Text style={styles.questName}>{quest.name}</Text>
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardText}>{quest.token_reward}</Text>
            <Text style={styles.rewardLabel}>tokens</Text>
          </View>
        </View>
        
        <Text style={styles.questDescription}>{quest.description}</Text>
        
        <View style={styles.questFooter}>
          <Text style={styles.questDifficulty}>
            Difficulty: {quest.token_reward <= 10 ? 'Easy' : quest.token_reward <= 25 ? 'Medium' : 'Hard'}
          </Text>
          <Text style={styles.questTime}>
            ~{Math.ceil(quest.token_reward / 5)} min reward
          </Text>
        </View>

        {/* Cyberpunk border effects */}
        <View style={styles.questBorderTop} />
        <View style={styles.questBorderBottom} />
      </TouchableOpacity>
    );
  };

  // Animated glow intensity
  const glowIntensity = headerGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [5, 15],
    extrapolate: 'clamp',
  });

  // If camera is active, show QuestCam component
  if (showCamera && selectedQuest) {
    return (
      <QuestCam
        quest={selectedQuest}
        onQuestComplete={handleQuestComplete}
        onCancel={handleCameraCancel}
      />
    );
  }

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
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonIcon}>←</Text>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            
            <View style={styles.titleSection}>
              <Text style={styles.title}>Available Quests</Text>
              <Text style={styles.subtitle}>Complete tasks to earn tokens</Text>
            </View>
            
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceValue}>{balance}</Text>
            </View>
          </View>

          {/* Cyberpunk border effects */}
          <View style={styles.headerBorderTop} />
          <View style={styles.headerBorderBottom} />
        </Animated.View>

        {/* Quest List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading quests...</Text>
          </View>
        ) : questTypes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Quests Available</Text>
            <Text style={styles.emptyText}>
              Check back later for new quests to complete!
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadQuestTypes}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={questTypes}
            renderItem={renderQuestItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.questList}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.questSeparator} />}
          />
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How it works:</Text>
          <Text style={styles.instructionsText}>
            1. Choose a quest from the list above{'\n'}
            2. Complete the task in real life{'\n'}
            3. Take a photo to prove completion{'\n'}
            4. AI will verify and award tokens!
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>QUEST SYSTEM v1.0</Text>
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
    alignItems: 'center',
  } as ViewStyle,

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.secondary,
    borderRadius: 6,
  } as ViewStyle,

  backButtonIcon: {
    fontSize: 18,
    color: colors.text,
    marginRight: 4,
  } as TextStyle,

  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,

  titleSection: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  } as ViewStyle,

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  } as TextStyle,

  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  } as TextStyle,

  balanceSection: {
    alignItems: 'center',
  } as ViewStyle,

  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  } as TextStyle,

  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
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

  questList: {
    padding: 16,
  } as ViewStyle,

  questItem: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  } as ViewStyle,

  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  } as ViewStyle,

  questName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  } as TextStyle,

  rewardBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 60,
  } as ViewStyle,

  rewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  } as TextStyle,

  rewardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.background,
    textTransform: 'uppercase',
  } as TextStyle,

  questDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  } as TextStyle,

  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  questDifficulty: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  } as TextStyle,

  questTime: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  } as TextStyle,

  questBorderTop: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: colors.secondary,
    opacity: 0.4,
  } as ViewStyle,

  questBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: colors.secondary,
    opacity: 0.4,
  } as ViewStyle,

  questSeparator: {
    height: 16,
  } as ViewStyle,

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  } as ViewStyle,

  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  } as TextStyle,

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  } as ViewStyle,

  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  } as TextStyle,

  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  } as TextStyle,

  refreshButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  } as ViewStyle,

  refreshButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,

  instructionsContainer: {
    backgroundColor: colors.cardBg,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  } as ViewStyle,

  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  } as TextStyle,

  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
    marginBottom: 24,
  } as TextStyle,
});

export default QuestScreen;