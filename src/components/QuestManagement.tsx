/**
 * Quest Management Component
 * Allows parents to create, edit, and delete quest types
 * Implements custom verification prompts for AI analysis and reward scaling
 * Requirements: 7.1, 7.3, 7.4
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { QuestType } from '../lib/types';
import { dbHelpers } from '../lib/supabase';
import { useAuth } from '../context';

interface QuestFormData {
  name: string;
  description: string;
  token_reward: number;
  verification_prompt: string;
  is_active: boolean;
}

interface QuestManagementProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Quest Management Component
 * Provides comprehensive quest type management for parents
 */
const QuestManagement: React.FC<QuestManagementProps> = ({ visible, onClose }) => {
  const { user, hasRole } = useAuth();
  
  // State for quest types and form management
  const [questTypes, setQuestTypes] = useState<QuestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal and form state
  const [showForm, setShowForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<QuestType | null>(null);
  const [formData, setFormData] = useState<QuestFormData>({
    name: '',
    description: '',
    token_reward: 10,
    verification_prompt: '',
    is_active: true,
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState<Partial<QuestFormData>>({});

  // Load quest types when component becomes visible
  useEffect(() => {
    if (visible) {
      loadQuestTypes();
    }
  }, [visible]);

  /**
   * Load all quest types from database
   */
  const loadQuestTypes = async () => {
    try {
      setIsLoading(true);
      const types = await dbHelpers.getAllQuestTypes();
      setQuestTypes(types);
    } catch (error) {
      console.error('Failed to load quest types:', error);
      Alert.alert('Error', 'Failed to load quest types. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      token_reward: 10,
      verification_prompt: '',
      is_active: true,
    });
    setFormErrors({});
    setEditingQuest(null);
  };

  /**
   * Open form for creating new quest
   */
  const handleCreateQuest = () => {
    resetForm();
    setShowForm(true);
  };

  /**
   * Open form for editing existing quest
   */
  const handleEditQuest = (quest: QuestType) => {
    setFormData({
      name: quest.name,
      description: quest.description,
      token_reward: quest.token_reward,
      verification_prompt: quest.verification_prompt,
      is_active: quest.is_active,
    });
    setEditingQuest(quest);
    setFormErrors({});
    setShowForm(true);
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Partial<QuestFormData> = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Quest name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Quest name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Quest name must be less than 50 characters';
    }
    
    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 200) {
      errors.description = 'Description must be less than 200 characters';
    }
    
    // Token reward validation
    if (!formData.token_reward || formData.token_reward < 1) {
      errors.token_reward = 'Token reward must be at least 1';
    } else if (formData.token_reward > 100) {
      errors.token_reward = 'Token reward must be less than 100';
    }
    
    // Verification prompt validation
    if (!formData.verification_prompt.trim()) {
      errors.verification_prompt = 'Verification prompt is required';
    } else if (formData.verification_prompt.trim().length < 20) {
      errors.verification_prompt = 'Verification prompt must be at least 20 characters';
    } else if (formData.verification_prompt.trim().length > 500) {
      errors.verification_prompt = 'Verification prompt must be less than 500 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to manage quests.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const questData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        token_reward: formData.token_reward,
        verification_prompt: formData.verification_prompt.trim(),
        is_active: formData.is_active,
      };
      
      if (editingQuest) {
        // Update existing quest
        const updatedQuest = await dbHelpers.updateQuestType(editingQuest.id, questData);
        setQuestTypes(prev => prev.map(q => q.id === editingQuest.id ? updatedQuest : q));
        Alert.alert('Success', 'Quest type updated successfully!');
      } else {
        // Create new quest
        const newQuest = await dbHelpers.createQuestType(questData, user.id);
        setQuestTypes(prev => [...prev, newQuest]);
        Alert.alert('Success', 'Quest type created successfully!');
      }
      
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save quest type:', error);
      Alert.alert('Error', 'Failed to save quest type. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle quest deletion
   */
  const handleDeleteQuest = (quest: QuestType) => {
    Alert.alert(
      'Delete Quest Type',
      `Are you sure you want to delete "${quest.name}"? This will deactivate the quest type but preserve historical data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dbHelpers.deleteQuestType(quest.id);
              setQuestTypes(prev => prev.map(q => 
                q.id === quest.id ? { ...q, is_active: false } : q
              ));
              Alert.alert('Success', 'Quest type deleted successfully!');
            } catch (error) {
              console.error('Failed to delete quest type:', error);
              Alert.alert('Error', 'Failed to delete quest type. Please try again.');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle quest activation/deactivation toggle
   */
  const handleToggleActive = async (quest: QuestType) => {
    try {
      const updatedQuest = await dbHelpers.updateQuestType(quest.id, {
        is_active: !quest.is_active,
      });
      setQuestTypes(prev => prev.map(q => q.id === quest.id ? updatedQuest : q));
    } catch (error) {
      console.error('Failed to toggle quest status:', error);
      Alert.alert('Error', 'Failed to update quest status. Please try again.');
    }
  };

  /**
   * Calculate difficulty level based on token reward
   */
  const getDifficultyLevel = (tokenReward: number): string => {
    if (tokenReward <= 15) return 'Easy';
    if (tokenReward <= 30) return 'Medium';
    if (tokenReward <= 50) return 'Hard';
    return 'Expert';
  };

  /**
   * Get difficulty color
   */
  const getDifficultyColor = (tokenReward: number): string => {
    if (tokenReward <= 15) return '#2ecc71'; // Green
    if (tokenReward <= 30) return '#f39c12'; // Orange
    if (tokenReward <= 50) return '#e74c3c'; // Red
    return '#9b59b6'; // Purple
  };

  /**
   * Render quest type item
   */
  const renderQuestItem = (quest: QuestType) => (
    <View key={quest.id} style={[styles.questItem, !quest.is_active && styles.questItemInactive]}>
      <View style={styles.questHeader}>
        <View style={styles.questTitleRow}>
          <Text style={[styles.questName, !quest.is_active && styles.questNameInactive]}>
            {quest.name}
          </Text>
          <View style={styles.questActions}>
            <Switch
              value={quest.is_active}
              onValueChange={() => handleToggleActive(quest)}
              trackColor={{ false: '#3e3e3e', true: '#00d4ff' }}
              thumbColor={quest.is_active ? '#ffffff' : '#8892b0'}
            />
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditQuest(quest)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteQuest(quest)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.questMeta}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(quest.token_reward) }]}>
            <Text style={styles.difficultyText}>{getDifficultyLevel(quest.token_reward)}</Text>
          </View>
          <Text style={styles.rewardText}>{quest.token_reward} tokens</Text>
        </View>
      </View>
      
      <Text style={[styles.questDescription, !quest.is_active && styles.questDescriptionInactive]}>
        {quest.description}
      </Text>
      
      <View style={styles.verificationPrompt}>
        <Text style={styles.verificationLabel}>AI Verification Prompt:</Text>
        <Text style={[styles.verificationText, !quest.is_active && styles.verificationTextInactive]}>
          {quest.verification_prompt}
        </Text>
      </View>
    </View>
  );

  /**
   * Render quest form modal
   */
  const renderQuestForm = () => (
    <Modal
      visible={showForm}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowForm(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowForm(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingQuest ? 'Edit Quest Type' : 'Create Quest Type'}
          </Text>
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
            <Text style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.formContainer}>
          {/* Quest Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Quest Name *</Text>
            <TextInput
              style={[styles.formInput, formErrors.name && styles.formInputError]}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter quest name (e.g., Clean Room)"
              placeholderTextColor="#8892b0"
              maxLength={50}
            />
            {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
          </View>
          
          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description *</Text>
            <TextInput
              style={[styles.formTextArea, formErrors.description && styles.formInputError]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe what the child needs to do"
              placeholderTextColor="#8892b0"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            {formErrors.description && <Text style={styles.errorText}>{formErrors.description}</Text>}
          </View>
          
          {/* Token Reward */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Token Reward *</Text>
            <View style={styles.rewardContainer}>
              <TextInput
                style={[styles.formInput, styles.rewardInput, formErrors.token_reward && styles.formInputError]}
                value={formData.token_reward.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  setFormData(prev => ({ ...prev, token_reward: num }));
                }}
                placeholder="10"
                placeholderTextColor="#8892b0"
                keyboardType="numeric"
                maxLength={3}
              />
              <View style={[styles.difficultyIndicator, { backgroundColor: getDifficultyColor(formData.token_reward) }]}>
                <Text style={styles.difficultyIndicatorText}>
                  {getDifficultyLevel(formData.token_reward)}
                </Text>
              </View>
            </View>
            {formErrors.token_reward && <Text style={styles.errorText}>{formErrors.token_reward}</Text>}
            <Text style={styles.formHint}>
              Reward scaling: Easy (1-15), Medium (16-30), Hard (31-50), Expert (51+)
            </Text>
          </View>
          
          {/* Verification Prompt */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>AI Verification Prompt *</Text>
            <TextInput
              style={[styles.formTextArea, styles.verificationTextArea, formErrors.verification_prompt && styles.formInputError]}
              value={formData.verification_prompt}
              onChangeText={(text) => setFormData(prev => ({ ...prev, verification_prompt: text }))}
              placeholder="Describe what the AI should look for in the image to verify quest completion..."
              placeholderTextColor="#8892b0"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            {formErrors.verification_prompt && <Text style={styles.errorText}>{formErrors.verification_prompt}</Text>}
            <Text style={styles.formHint}>
              Be specific about what the AI should verify in the photo (e.g., "Look for a made bed with sheets pulled tight, pillows arranged neatly...")
            </Text>
          </View>
          
          {/* Active Status */}
          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.formLabel}>Active</Text>
              <Switch
                value={formData.is_active}
                onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
                trackColor={{ false: '#3e3e3e', true: '#00d4ff' }}
                thumbColor={formData.is_active ? '#ffffff' : '#8892b0'}
              />
            </View>
            <Text style={styles.formHint}>
              Inactive quest types won't be available for children to complete
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Check if user has parent role
  if (!hasRole('parent')) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          <Text style={styles.errorText}>Access denied. Parent account required.</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Quest Management</Text>
          <TouchableOpacity onPress={handleCreateQuest}>
            <Text style={styles.createButton}>+ New Quest</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00d4ff" />
            <Text style={styles.loadingText}>Loading quest types...</Text>
          </View>
        ) : (
          <ScrollView style={styles.questList}>
            {questTypes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No quest types found.</Text>
                <TouchableOpacity style={styles.createFirstButton} onPress={handleCreateQuest}>
                  <Text style={styles.createFirstButtonText}>Create Your First Quest</Text>
                </TouchableOpacity>
              </View>
            ) : (
              questTypes.map(renderQuestItem)
            )}
          </ScrollView>
        )}
        
        {renderQuestForm()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  
  // Modal Header Styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
    backgroundColor: '#0a0a0a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8892b0',
  },
  saveButton: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#3e3e3e',
  },
  createButton: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '600',
  },
  
  // Quest List Styles
  questList: {
    flex: 1,
    padding: 20,
  },
  questItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  questItemInactive: {
    opacity: 0.6,
    borderColor: '#3e3e3e',
  },
  questHeader: {
    marginBottom: 10,
  },
  questTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginRight: 10,
  },
  questNameInactive: {
    color: '#8892b0',
  },
  questActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#0a0a0a',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  questMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  rewardText: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '500',
  },
  questDescription: {
    color: '#8892b0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  questDescriptionInactive: {
    color: '#5a5a5a',
  },
  verificationPrompt: {
    backgroundColor: '#16213e',
    padding: 10,
    borderRadius: 8,
  },
  verificationLabel: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 5,
  },
  verificationText: {
    color: '#8892b0',
    fontSize: 12,
    lineHeight: 16,
  },
  verificationTextInactive: {
    color: '#5a5a5a',
  },
  
  // Form Styles
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#16213e',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  formInputError: {
    borderColor: '#e74c3c',
  },
  formTextArea: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#16213e',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  verificationTextArea: {
    minHeight: 100,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  rewardInput: {
    flex: 1,
  },
  difficultyIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  difficultyIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formHint: {
    color: '#8892b0',
    fontSize: 12,
    marginTop: 5,
    lineHeight: 16,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
  },
  
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8892b0',
    fontSize: 16,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#8892b0',
    fontSize: 16,
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#0a0a0a',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#0a0a0a',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default QuestManagement;