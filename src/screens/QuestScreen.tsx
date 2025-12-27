import React, { useEffect, useState } from 'react';
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
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  // Load quest types on mount
  useEffect(() => {
    loadQuestTypes();
  }, []);

  const loadQuestTypes = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from database first
      let activeQuests: QuestType[] = [];
      try {
        activeQuests = await dbHelpers.getActiveQuestTypes();
      } catch (dbError) {
        console.warn('Database quest loading failed, using fallback quests:', dbError);
        
        // Fallback quest data for testing/demo
        activeQuests = [
          {
            id: 'demo-1',
            name: 'Clean Your Room',
            description: 'Organize your bedroom, make your bed, and put away all clothes and toys.',
            token_reward: 15,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'demo-2',
            name: 'Read for 20 Minutes',
            description: 'Read a book, magazine, or educational article for at least 20 minutes.',
            token_reward: 10,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'demo-3',
            name: 'Help with Dishes',
            description: 'Help wash, dry, or put away dishes after a meal.',
            token_reward: 8,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'demo-4',
            name: 'Exercise for 15 Minutes',
            description: 'Do jumping jacks, push-ups, go for a walk, or any physical activity.',
            token_reward: 12,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'demo-5',
            name: 'Practice Math Problems',
            description: 'Complete 10 math problems or practice math skills for 15 minutes.',
            token_reward: 20,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }
      
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
      
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            
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
        </View>

        {/* Quest List - Platform-specific scrolling */}
        {Platform.OS === 'web' ? (
          <div style={{
            position: 'absolute',
            top: '120px', // Below header
            left: '0',
            right: '0',
            bottom: '0', // Full height to bottom
            overflowY: 'scroll',
            overflowX: 'hidden',
            backgroundColor: '#0a0a0a',
            padding: '16px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'auto',
            scrollbarColor: '#00ffff #333',
          }}>
            {isLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
              }}>
                <Text style={styles.loadingText}>Loading quests...</Text>
              </div>
            ) : questTypes.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
              }}>
                <Text style={styles.emptyTitle}>No Quests Available</Text>
                <Text style={styles.emptyText}>
                  Check back later for new quests to complete!
                </Text>
                <TouchableOpacity style={styles.refreshButton} onPress={loadQuestTypes}>
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </div>
            ) : (
              <div>
                {questTypes.map((quest, index) => (
                  <div key={quest.id} style={{ marginBottom: index < questTypes.length - 1 ? '16px' : '0' }}>
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
                  </div>
                ))}
              </div>
            )}

            {/* Instructions - Inside scrollable area for web */}
            <div style={{
              backgroundColor: '#1a1a2e',
              margin: '16px 0',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #b0b0b0',
            }}>
              <Text style={styles.instructionsTitle}>How it works:</Text>
              <Text style={styles.instructionsText}>
                1. Choose a quest from the list above{'\n'}
                2. Complete the task in real life{'\n'}
                3. Take a photo to prove completion{'\n'}
                4. AI will verify and award tokens!
              </Text>
            </div>

            {/* Footer - Inside scrollable area for web */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 0',
              backgroundColor: '#1a1a2e',
              borderTop: '1px solid #00ffff',
              marginTop: '16px',
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#00ffff', opacity: 0.3 }}></div>
              <Text style={styles.footerText}>QUEST SYSTEM v1.0</Text>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#00ffff', opacity: 0.3 }}></div>
            </div>

            {/* Extra bottom spacing */}
            <div style={{ height: '20px' }}></div>
          </div>
        ) : (
          <>
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
                style={styles.questFlatList}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              />
            )}

            {/* Instructions - Outside scrollable area for mobile */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>How it works:</Text>
              <Text style={styles.instructionsText}>
                1. Choose a quest from the list above{'\n'}
                2. Complete the task in real life{'\n'}
                3. Take a photo to prove completion{'\n'}
                4. AI will verify and award tokens!
              </Text>
            </View>

            {/* Footer - Outside scrollable area for mobile */}
            <View style={styles.footer}>
              <View style={styles.footerLine} />
              <Text style={styles.footerText}>QUEST SYSTEM v1.0</Text>
              <View style={styles.footerLine} />
            </View>
          </>
        )}
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
    flexGrow: 1,
  } as ViewStyle,

  questFlatList: {
    flex: 1,
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