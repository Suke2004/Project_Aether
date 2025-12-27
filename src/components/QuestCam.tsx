/**
 * QuestCam Component
 * Camera interface for quest completion with AI verification integration
 * Requirements: 1.1, 1.2
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
// import * as ImagePicker from 'expo-image-picker';
import { verifyQuestWithRetry } from '../lib/gemini';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { QuestType, AIVerificationResult } from '../lib/types';
import { useManualVerification } from '../lib/manualVerification';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
};

interface QuestCamProps {
  quest: QuestType;
  onQuestComplete: (success: boolean, tokensEarned?: number) => void;
  onCancel: () => void;
  style?: ViewStyle;
}

export const QuestCam: React.FC<QuestCamProps> = ({
  quest,
  onQuestComplete,
  onCancel,
  style,
}) => {
  const { earnTokens } = useWallet();
  const { profile } = useAuth();
  const { requestVerification } = useManualVerification();
  
  // Camera and image states
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<AIVerificationResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const cameraRef = useRef<Camera>(null);

  // Request camera permissions on mount
  useEffect(() => {
    requestCameraPermission();
  }, []);

  // Animate component entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
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

  // Pulse animation for capture button
  useEffect(() => {
    if (!capturedImage && !isProcessing) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [capturedImage, isProcessing]);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to verify quest completion. Please enable camera permissions in your device settings.',
          [
            { text: 'Cancel', onPress: onCancel },
            { text: 'Settings', onPress: () => {/* Open settings if possible */} },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });
      
      setCapturedImage(photo.uri);
      
      // Start AI verification immediately
      await verifyQuestCompletion(photo.uri);
      
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
      setIsProcessing(false);
    }
  };

  const selectFromGallery = async () => {
    // Temporarily disabled - expo-image-picker import issue
    Alert.alert('Feature Disabled', 'Gallery selection temporarily disabled');
    /*
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        setCapturedImage(result.assets[0].uri);
        await verifyQuestCompletion(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      setIsProcessing(false);
    }
    */
  };

  const verifyQuestCompletion = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      setVerificationResult(null);
      
      // Create manual verification fallback function
      const requestManualVerification = async (): Promise<boolean> => {
        if (!profile) {
          console.error('No profile available for manual verification');
          return false;
        }

        try {
          Alert.alert(
            'AI Verification Failed',
            'The AI service is currently unavailable. Would you like to request manual verification from a parent?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => {} },
              {
                text: 'Request Parent Review',
                onPress: async () => {
                  try {
                    const manualResult = await requestVerification(
                      profile.id,
                      quest.description,
                      quest.verification_prompt,
                      imageUri
                    );

                    if (manualResult) {
                      // Process manual verification result
                      const result: AIVerificationResult = {
                        isValid: manualResult.approved,
                        confidence: manualResult.confidence,
                        reasoning: manualResult.reasoning || 'Manually verified by parent',
                      };

                      setVerificationResult(result);
                      setShowResult(true);

                      if (result.isValid) {
                        await earnTokens(quest.token_reward, `Quest completed: ${quest.name} (Manual verification)`, imageUri);
                        setTimeout(() => {
                          onQuestComplete(true, quest.token_reward);
                        }, 2000);
                      } else {
                        setTimeout(() => {
                          setShowResult(false);
                          setCapturedImage(null);
                          setVerificationResult(null);
                        }, 3000);
                      }
                    } else {
                      Alert.alert(
                        'Verification Timeout',
                        'Manual verification timed out or was not completed. Please try again later.',
                        [{ text: 'OK', onPress: retryCapture }]
                      );
                    }
                  } catch (error) {
                    console.error('Manual verification failed:', error);
                    Alert.alert(
                      'Verification Failed',
                      'Manual verification could not be completed. Please try again.',
                      [{ text: 'OK', onPress: retryCapture }]
                    );
                  }
                },
              },
            ]
          );
          return true; // Indicate that manual verification was requested
        } catch (error) {
          console.error('Failed to request manual verification:', error);
          return false;
        }
      };
      
      // Call AI verification service with manual fallback
      const result = await verifyQuestWithRetry(
        imageUri,
        quest.description,
        quest.verification_prompt,
        requestManualVerification
      );
      
      // Check if manual verification was requested (indicated by confidence 0)
      if (result.confidence === 0 && result.reasoning?.includes('Manual verification')) {
        // Manual verification is in progress, don't process the result yet
        setIsProcessing(false);
        return;
      }
      
      setVerificationResult(result);
      setShowResult(true);
      
      // If verification is successful and confidence is high enough, award tokens
      if (result.isValid && result.confidence >= 70) {
        await earnTokens(quest.token_reward, `Quest completed: ${quest.name}`, imageUri);
        
        // Show success animation
        setTimeout(() => {
          onQuestComplete(true, quest.token_reward);
        }, 2000);
      } else {
        // Show failure result but allow retry
        setTimeout(() => {
          setShowResult(false);
          setCapturedImage(null);
          setVerificationResult(null);
        }, 3000);
      }
      
    } catch (error) {
      console.error('Quest verification error:', error);
      
      // Check if this is an AI service error that should trigger manual verification
      if (error instanceof Error && 'type' in error) {
        const aiError = error as any;
        if (aiError.type === 'TIMEOUT' || aiError.type === 'API_ERROR' || aiError.type === 'NETWORK_ERROR') {
          // AI service failed, offer manual verification
          Alert.alert(
            'AI Service Unavailable',
            'The AI verification service is currently unavailable. Would you like to request manual verification from a parent?',
            [
              { text: 'Cancel', onPress: onCancel },
              { text: 'Retry AI', onPress: () => verifyQuestCompletion(imageUri) },
              {
                text: 'Request Parent Review',
                onPress: async () => {
                  if (profile) {
                    try {
                      const manualResult = await requestVerification(
                        profile.id,
                        quest.description,
                        quest.verification_prompt,
                        imageUri
                      );

                      if (manualResult?.approved) {
                        await earnTokens(quest.token_reward, `Quest completed: ${quest.name} (Manual verification)`, imageUri);
                        onQuestComplete(true, quest.token_reward);
                      } else {
                        Alert.alert('Quest Not Approved', 'The quest was not approved by the parent.');
                        retryCapture();
                      }
                    } catch (manualError) {
                      console.error('Manual verification failed:', manualError);
                      Alert.alert('Verification Failed', 'Manual verification could not be completed.');
                      retryCapture();
                    }
                  }
                },
              },
            ]
          );
          return;
        }
      }
      
      // Generic error handling
      Alert.alert(
        'Verification Failed',
        error instanceof Error ? error.message : 'Unable to verify quest completion. Please try again.',
        [
          { text: 'Retry', onPress: retryCapture },
          { text: 'Cancel', onPress: onCancel },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const retryCapture = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    setShowResult(false);
    setIsProcessing(false);
  };

  const flipCamera = () => {
    setCameraType(current => 
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  // Loading state
  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Camera access denied</Text>
        <Text style={styles.instructionText}>
          Please enable camera permissions to complete quests
        </Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      {/* Quest Instructions Header */}
      <View style={styles.header}>
        <Text style={styles.questTitle}>{quest.name}</Text>
        <Text style={styles.questDescription}>{quest.description}</Text>
        <Text style={styles.rewardText}>Reward: {quest.token_reward} tokens</Text>
      </View>

      {/* Camera or Image Preview */}
      <View style={styles.cameraContainer}>
        {capturedImage ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            
            {/* Verification Result Overlay */}
            {showResult && verificationResult && (
              <View style={[
                styles.resultOverlay,
                verificationResult.isValid ? styles.successOverlay : styles.errorOverlay
              ]}>
                <Text style={styles.resultTitle}>
                  {verificationResult.isValid ? '✅ Quest Complete!' : '❌ Try Again'}
                </Text>
                <Text style={styles.resultConfidence}>
                  Confidence: {verificationResult.confidence}%
                </Text>
                <Text style={styles.resultReasoning}>
                  {verificationResult.reasoning}
                </Text>
                {verificationResult.isValid && (
                  <Text style={styles.tokensEarned}>
                    +{quest.token_reward} tokens earned!
                  </Text>
                )}
              </View>
            )}
            
            {/* Processing Overlay */}
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.processingText}>Verifying quest...</Text>
              </View>
            )}
          </View>
        ) : (
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            ratio="4:3"
          >
            <View style={styles.cameraOverlay}>
              {/* Viewfinder frame */}
              <View style={styles.viewfinder}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              
              {/* Instructions overlay */}
              <View style={styles.instructionsOverlay}>
                <Text style={styles.instructionText}>
                  Position your completed quest in the frame and tap to capture
                </Text>
              </View>
            </View>
          </Camera>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        {!capturedImage && !isProcessing && (
          <>
            <TouchableOpacity style={styles.controlButton} onPress={selectFromGallery}>
              <Text style={styles.controlButtonText}>📷</Text>
            </TouchableOpacity>
            
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </Animated.View>
            
            <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
              <Text style={styles.controlButtonText}>🔄</Text>
            </TouchableOpacity>
          </>
        )}
        
        {capturedImage && !showResult && !isProcessing && (
          <>
            <TouchableOpacity style={styles.button} onPress={retryCapture}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => verifyQuestCompletion(capturedImage)}
            >
              <Text style={styles.buttonText}>Verify Quest</Text>
            </TouchableOpacity>
          </>
        )}
        
        {/* Cancel button */}
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  header: {
    padding: 20,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  } as ViewStyle,

  questTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  } as TextStyle,

  questDescription: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  } as TextStyle,

  rewardText: {
    fontSize: 14,
    color: colors.accent,
    textAlign: 'center',
    fontWeight: '600',
  } as TextStyle,

  cameraContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.cardBg,
  } as ViewStyle,

  camera: {
    flex: 1,
  } as ViewStyle,

  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  viewfinder: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    position: 'relative',
  } as ViewStyle,

  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
    borderWidth: 3,
  } as ViewStyle,

  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  } as ViewStyle,

  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  } as ViewStyle,

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  } as ViewStyle,

  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  } as ViewStyle,

  instructionsOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  } as ViewStyle,

  instructionText: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 14,
  } as TextStyle,

  imagePreview: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,

  previewImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'cover',
  } as ViewStyle,

  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  } as ViewStyle,

  successOverlay: {
    backgroundColor: 'rgba(0, 255, 128, 0.2)',
  } as ViewStyle,

  errorOverlay: {
    backgroundColor: 'rgba(255, 0, 64, 0.2)',
  } as ViewStyle,

  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  } as TextStyle,

  resultConfidence: {
    fontSize: 18,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  } as TextStyle,

  resultReasoning: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  } as TextStyle,

  tokensEarned: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.success,
    textAlign: 'center',
  } as TextStyle,

  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  } as ViewStyle,

  processingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 12,
  } as TextStyle,

  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.cardBg,
  } as ViewStyle,

  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  controlButtonText: {
    fontSize: 24,
  } as TextStyle,

  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.text,
  } as ViewStyle,

  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.text,
  } as ViewStyle,

  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.primary,
  } as ViewStyle,

  primaryButton: {
    backgroundColor: colors.primary,
  } as ViewStyle,

  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,

  cancelButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.error,
    borderRadius: 6,
  } as ViewStyle,

  cancelButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,

  loadingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 12,
  } as TextStyle,

  errorText: {
    color: colors.error,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  } as TextStyle,
});

export default QuestCam;