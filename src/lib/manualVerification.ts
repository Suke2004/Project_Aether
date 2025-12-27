/**
 * Manual verification service for parent fallback when AI fails
 * Requirements: 8.2
 */

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ManualVerificationRequest {
  id: string;
  childId: string;
  questDescription: string;
  verificationPrompt: string;
  imageUri: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  parentResponse?: {
    approved: boolean;
    reasoning?: string;
    timestamp: string;
  };
}

export interface ManualVerificationResult {
  approved: boolean;
  reasoning?: string;
  confidence: number; // Always 100 for manual verification
}

/**
 * Manual Verification Service
 */
export class ManualVerificationService {
  private static readonly STORAGE_KEY = 'manual_verification_requests';
  private static readonly EXPIRY_HOURS = 24; // Requests expire after 24 hours

  /**
   * Request manual verification from parent
   */
  static async requestManualVerification(
    childId: string,
    questDescription: string,
    verificationPrompt: string,
    imageUri: string
  ): Promise<string> {
    const request: ManualVerificationRequest = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      childId,
      questDescription,
      verificationPrompt,
      imageUri,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    try {
      // Store the request
      await this.storeVerificationRequest(request);

      // Notify parent (in a real app, this might send a push notification)
      this.notifyParent(request);

      console.log(`Manual verification requested: ${request.id}`);
      return request.id;
    } catch (error) {
      console.error('Failed to request manual verification:', error);
      throw new Error('Failed to request manual verification');
    }
  }

  /**
   * Check if a manual verification request has been responded to
   */
  static async checkVerificationStatus(requestId: string): Promise<ManualVerificationRequest | null> {
    try {
      const requests = await this.getStoredRequests();
      const request = requests.find(r => r.id === requestId);

      if (!request) {
        return null;
      }

      // Check if request has expired
      const requestTime = new Date(request.timestamp).getTime();
      const now = Date.now();
      const expiryTime = this.EXPIRY_HOURS * 60 * 60 * 1000;

      if (now - requestTime > expiryTime && request.status === 'pending') {
        request.status = 'expired';
        await this.updateVerificationRequest(request);
      }

      return request;
    } catch (error) {
      console.error('Failed to check verification status:', error);
      return null;
    }
  }

  /**
   * Parent responds to manual verification request
   */
  static async respondToVerification(
    requestId: string,
    approved: boolean,
    reasoning?: string
  ): Promise<boolean> {
    try {
      const requests = await this.getStoredRequests();
      const requestIndex = requests.findIndex(r => r.id === requestId);

      if (requestIndex === -1) {
        throw new Error('Verification request not found');
      }

      const request = requests[requestIndex];

      if (request.status !== 'pending') {
        throw new Error('Verification request is no longer pending');
      }

      // Update the request with parent response
      request.status = approved ? 'approved' : 'rejected';
      request.parentResponse = {
        approved,
        reasoning,
        timestamp: new Date().toISOString(),
      };

      await this.updateVerificationRequest(request);

      console.log(`Manual verification ${approved ? 'approved' : 'rejected'}: ${requestId}`);
      return true;
    } catch (error) {
      console.error('Failed to respond to verification:', error);
      return false;
    }
  }

  /**
   * Get all pending verification requests for a parent
   */
  static async getPendingRequests(parentId?: string): Promise<ManualVerificationRequest[]> {
    try {
      const requests = await this.getStoredRequests();
      
      // Filter for pending requests
      let pendingRequests = requests.filter(r => r.status === 'pending');

      // If parentId is provided, filter by child relationship (simplified for demo)
      if (parentId) {
        // In a real app, you'd check parent-child relationships
        // For now, return all pending requests
      }

      // Remove expired requests
      const now = Date.now();
      const expiryTime = this.EXPIRY_HOURS * 60 * 60 * 1000;

      pendingRequests = pendingRequests.filter(request => {
        const requestTime = new Date(request.timestamp).getTime();
        return now - requestTime <= expiryTime;
      });

      return pendingRequests;
    } catch (error) {
      console.error('Failed to get pending requests:', error);
      return [];
    }
  }

  /**
   * Wait for manual verification response with polling
   */
  static async waitForManualVerification(
    requestId: string,
    timeoutMs: number = 120000 // 2 minutes default (increased from 5 minutes)
  ): Promise<ManualVerificationResult | null> {
    const startTime = Date.now();
    const pollInterval = 3000; // Poll every 3 seconds (reduced from 5)

    while (Date.now() - startTime < timeoutMs) {
      const request = await this.checkVerificationStatus(requestId);

      if (!request) {
        throw new Error('Verification request not found');
      }

      if (request.status === 'approved') {
        return {
          approved: true,
          reasoning: request.parentResponse?.reasoning,
          confidence: 100,
        };
      }

      if (request.status === 'rejected') {
        return {
          approved: false,
          reasoning: request.parentResponse?.reasoning,
          confidence: 100,
        };
      }

      if (request.status === 'expired') {
        return null;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout reached
    return null;
  }

  /**
   * Show manual verification dialog to parent
   */
  static showParentVerificationDialog(request: ManualVerificationRequest): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Manual Quest Verification',
        `The AI couldn't verify this quest. Please review:\n\nQuest: ${request.questDescription}\n\nInstructions: ${request.verificationPrompt}\n\nDid your child complete this quest correctly?`,
        [
          {
            text: 'View Photo',
            onPress: () => {
              // In a real app, you'd show the image
              Alert.alert('Photo', 'Photo viewing would be implemented here');
            },
          },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: async () => {
              await this.respondToVerification(request.id, false, 'Parent rejected quest completion');
              resolve(false);
            },
          },
          {
            text: 'Approve',
            onPress: async () => {
              await this.respondToVerification(request.id, true, 'Parent approved quest completion');
              resolve(true);
            },
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Clean up old verification requests
   */
  static async cleanupOldRequests(): Promise<void> {
    try {
      const requests = await this.getStoredRequests();
      const now = Date.now();
      const expiryTime = this.EXPIRY_HOURS * 60 * 60 * 1000;

      const activeRequests = requests.filter(request => {
        const requestTime = new Date(request.timestamp).getTime();
        return now - requestTime <= expiryTime;
      });

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(activeRequests));
      
      console.log(`Cleaned up ${requests.length - activeRequests.length} old verification requests`);
    } catch (error) {
      console.error('Failed to cleanup old requests:', error);
    }
  }

  // Private helper methods

  private static async getStoredRequests(): Promise<ManualVerificationRequest[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored requests:', error);
      return [];
    }
  }

  private static async storeVerificationRequest(request: ManualVerificationRequest): Promise<void> {
    try {
      const requests = await this.getStoredRequests();
      requests.push(request);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
    } catch (error) {
      console.error('Failed to store verification request:', error);
      throw error;
    }
  }

  private static async updateVerificationRequest(updatedRequest: ManualVerificationRequest): Promise<void> {
    try {
      const requests = await this.getStoredRequests();
      const index = requests.findIndex(r => r.id === updatedRequest.id);
      
      if (index !== -1) {
        requests[index] = updatedRequest;
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
      }
    } catch (error) {
      console.error('Failed to update verification request:', error);
      throw error;
    }
  }

  private static notifyParent(request: ManualVerificationRequest): void {
    // In a real app, this would send a push notification to the parent
    // For now, we'll just log and show a local notification
    console.log('Parent notification:', {
      title: 'Manual Quest Verification Needed',
      body: `Your child needs help verifying: ${request.questDescription}`,
      requestId: request.id,
    });

    // Show immediate alert if parent is using the app (reduced delay)
    setTimeout(() => {
      Alert.alert(
        'Verification Needed',
        `Your child needs help verifying a quest: ${request.questDescription}`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Review Now', onPress: () => this.showParentVerificationDialog(request) },
        ],
        { cancelable: false } // Prevent accidental dismissal
      );
    }, 500); // Reduced from 1000ms
  }
}

/**
 * Hook for using manual verification in components
 */
export const useManualVerification = () => {
  const requestVerification = async (
    childId: string,
    questDescription: string,
    verificationPrompt: string,
    imageUri: string
  ): Promise<ManualVerificationResult | null> => {
    try {
      const requestId = await ManualVerificationService.requestManualVerification(
        childId,
        questDescription,
        verificationPrompt,
        imageUri
      );

      // Wait for parent response
      const result = await ManualVerificationService.waitForManualVerification(requestId);
      
      return result;
    } catch (error) {
      console.error('Manual verification failed:', error);
      return null;
    }
  };

  const getPendingRequests = async (parentId?: string) => {
    return await ManualVerificationService.getPendingRequests(parentId);
  };

  const respondToRequest = async (requestId: string, approved: boolean, reasoning?: string) => {
    return await ManualVerificationService.respondToVerification(requestId, approved, reasoning);
  };

  return {
    requestVerification,
    getPendingRequests,
    respondToRequest,
  };
};