/**
 * Comprehensive error handling and recovery service
 * Requirements: 8.2, 8.4, 8.5
 */

import { Alert } from 'react-native';
import { AppConfig } from './types';

export interface ErrorRecoveryOptions {
  showAlert?: boolean;
  suggestAlternatives?: boolean;
  autoRefund?: boolean;
  logError?: boolean;
}

export interface AppLaunchError extends Error {
  type: 'DEEP_LINK_FAILED' | 'WEB_FALLBACK_FAILED' | 'INSUFFICIENT_BALANCE' | 'NETWORK_ERROR' | 'UNKNOWN';
  appName: string;
  originalError?: Error;
  tokensToRefund?: number;
}

export interface AIServiceError extends Error {
  type: 'TIMEOUT' | 'API_ERROR' | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'CONFIG_ERROR';
  retryable: boolean;
  originalError?: Error;
}

export interface DataCorruptionError extends Error {
  type: 'PROFILE_CORRUPTION' | 'TRANSACTION_CORRUPTION' | 'STORAGE_CORRUPTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  recoverable: boolean;
  backupAvailable: boolean;
}

/**
 * App Launch Error Handling
 */
export class AppLaunchErrorHandler {
  private static alternativeApps: Record<string, AppConfig[]> = {
    'Video': [
      { name: 'YouTube', packageName: 'com.google.android.youtube', deepLink: 'youtube://', webUrl: 'https://youtube.com', icon: '📺', category: 'Video' },
      { name: 'Netflix', packageName: 'com.netflix.mediaclient', deepLink: 'nflx://', webUrl: 'https://netflix.com', icon: '🎬', category: 'Video' },
      { name: 'Twitch', packageName: 'tv.twitch.android.app', deepLink: 'twitch://', webUrl: 'https://twitch.tv', icon: '🎮', category: 'Video' },
    ],
    'Music': [
      { name: 'Spotify', packageName: 'com.spotify.music', deepLink: 'spotify://', webUrl: 'https://open.spotify.com', icon: '🎵', category: 'Music' },
      { name: 'YouTube Music', packageName: 'com.google.android.apps.youtube.music', deepLink: 'youtubemusic://', webUrl: 'https://music.youtube.com', icon: '🎶', category: 'Music' },
    ],
    'Social': [
      { name: 'Instagram', packageName: 'com.instagram.android', deepLink: 'instagram://', webUrl: 'https://instagram.com', icon: '📸', category: 'Social' },
      { name: 'TikTok', packageName: 'com.zhiliaoapp.musically', deepLink: 'snssdk1233://', webUrl: 'https://tiktok.com', icon: '🎭', category: 'Social' },
      { name: 'Discord', packageName: 'com.discord', deepLink: 'discord://', webUrl: 'https://discord.com/app', icon: '💬', category: 'Social' },
    ],
    'Gaming': [
      { name: 'Roblox', packageName: 'com.roblox.client', deepLink: 'roblox://', webUrl: 'https://roblox.com', icon: '🎯', category: 'Gaming' },
      { name: 'Twitch', packageName: 'tv.twitch.android.app', deepLink: 'twitch://', webUrl: 'https://twitch.tv', icon: '🎮', category: 'Gaming' },
    ],
  };

  static createAppLaunchError(
    type: AppLaunchError['type'],
    appName: string,
    originalError?: Error,
    tokensToRefund?: number
  ): AppLaunchError {
    const error = new Error(`App launch failed: ${type}`) as AppLaunchError;
    error.type = type;
    error.appName = appName;
    error.originalError = originalError;
    error.tokensToRefund = tokensToRefund;
    return error;
  }

  static async handleAppLaunchError(
    error: AppLaunchError,
    refundTokens: (amount: number, description: string) => Promise<void>,
    options: ErrorRecoveryOptions = {}
  ): Promise<void> {
    const {
      showAlert = true,
      suggestAlternatives = true,
      autoRefund = true,
      logError = true,
    } = options;

    if (logError) {
      console.error('App launch error:', {
        type: error.type,
        appName: error.appName,
        tokensToRefund: error.tokensToRefund,
        originalError: error.originalError?.message,
      });
    }

    // Auto-refund tokens if specified
    if (autoRefund && error.tokensToRefund && error.tokensToRefund > 0) {
      try {
        await refundTokens(error.tokensToRefund, `Refund for failed ${error.appName} launch`);
        console.log(`Refunded ${error.tokensToRefund} tokens for failed ${error.appName} launch`);
      } catch (refundError) {
        console.error('Failed to refund tokens:', refundError);
      }
    }

    if (showAlert) {
      const alternatives = suggestAlternatives ? this.getAlternativeApps(error.appName) : [];
      
      let message = this.getErrorMessage(error);
      
      if (error.tokensToRefund && error.tokensToRefund > 0) {
        message += `\n\n${error.tokensToRefund} tokens have been refunded to your account.`;
      }

      if (alternatives.length > 0) {
        const altNames = alternatives.slice(0, 3).map(app => app.name).join(', ');
        message += `\n\nTry these alternatives: ${altNames}`;
      }

      Alert.alert(
        'App Launch Failed',
        message,
        [
          { text: 'OK', style: 'default' },
          ...(alternatives.length > 0 ? [{ text: 'Show Alternatives', onPress: () => this.showAlternatives(alternatives) }] : []),
        ]
      );
    }
  }

  private static getErrorMessage(error: AppLaunchError): string {
    switch (error.type) {
      case 'DEEP_LINK_FAILED':
        return `${error.appName} could not be opened directly. The app may not be installed on your device.`;
      case 'WEB_FALLBACK_FAILED':
        return `${error.appName} could not be opened in your browser. Please check your internet connection.`;
      case 'INSUFFICIENT_BALANCE':
        return `You don't have enough tokens to launch ${error.appName}. Complete more quests to earn tokens!`;
      case 'NETWORK_ERROR':
        return `Network error prevented ${error.appName} from launching. Please check your internet connection and try again.`;
      default:
        return `${error.appName} could not be launched due to an unexpected error. Please try again.`;
    }
  }

  private static getAlternativeApps(failedAppName: string): AppConfig[] {
    // Find the category of the failed app and suggest alternatives
    for (const [category, apps] of Object.entries(this.alternativeApps)) {
      const failedApp = apps.find(app => app.name === failedAppName);
      if (failedApp) {
        return apps.filter(app => app.name !== failedAppName);
      }
    }
    
    // If no specific category found, return popular alternatives
    return [
      this.alternativeApps.Video[0], // YouTube
      this.alternativeApps.Music[0], // Spotify
      this.alternativeApps.Social[0], // Instagram
    ].filter(app => app.name !== failedAppName);
  }

  private static showAlternatives(alternatives: AppConfig[]): void {
    const altList = alternatives.map((app, index) => `${index + 1}. ${app.name} (${app.category})`).join('\n');
    
    Alert.alert(
      'Alternative Apps',
      `Here are some similar apps you can try:\n\n${altList}`,
      [{ text: 'OK' }]
    );
  }
}

/**
 * AI Service Error Handling
 */
export class AIServiceErrorHandler {
  static createAIServiceError(
    type: AIServiceError['type'],
    message: string,
    retryable: boolean = true,
    originalError?: Error
  ): AIServiceError {
    const error = new Error(message) as AIServiceError;
    error.type = type;
    error.retryable = retryable;
    error.originalError = originalError;
    return error;
  }

  static async handleAIServiceError(
    error: AIServiceError,
    requestManualVerification?: () => Promise<boolean>,
    options: ErrorRecoveryOptions = {}
  ): Promise<{ shouldRetry: boolean; manualVerificationRequested: boolean }> {
    const { showAlert = true, logError = true } = options;

    if (logError) {
      console.error('AI service error:', {
        type: error.type,
        retryable: error.retryable,
        message: error.message,
        originalError: error.originalError?.message,
      });
    }

    let shouldRetry = false;
    let manualVerificationRequested = false;

    // Determine if we should retry based on error type
    if (error.retryable && (error.type === 'TIMEOUT' || error.type === 'NETWORK_ERROR')) {
      shouldRetry = true;
    }

    // For non-retryable errors or after max retries, offer manual verification
    if (!shouldRetry && requestManualVerification) {
      if (showAlert) {
        Alert.alert(
          'AI Verification Unavailable',
          this.getAIErrorMessage(error),
          [
            { text: 'Try Again Later', style: 'cancel' },
            {
              text: 'Request Parent Review',
              onPress: async () => {
                try {
                  manualVerificationRequested = await requestManualVerification();
                } catch (err) {
                  console.error('Manual verification request failed:', err);
                }
              },
            },
          ]
        );
      }
    } else if (showAlert && !shouldRetry) {
      Alert.alert(
        'AI Service Error',
        this.getAIErrorMessage(error),
        [{ text: 'OK' }]
      );
    }

    return { shouldRetry, manualVerificationRequested };
  }

  private static getAIErrorMessage(error: AIServiceError): string {
    switch (error.type) {
      case 'TIMEOUT':
        return 'The AI verification service is taking too long to respond. This might be due to high server load.';
      case 'API_ERROR':
        return 'The AI verification service encountered an error. This is usually temporary.';
      case 'NETWORK_ERROR':
        return 'Network connection issues prevented AI verification. Please check your internet connection.';
      case 'INVALID_RESPONSE':
        return 'The AI service returned an unexpected response. The image might be unclear or corrupted.';
      case 'CONFIG_ERROR':
        return 'AI service configuration error. Please contact support if this persists.';
      default:
        return 'An unexpected error occurred with the AI verification service.';
    }
  }

  static async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on non-retryable errors
        if (error instanceof Error && 'retryable' in error && !(error as any).retryable) {
          throw lastError;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff: wait baseDelay * 2^(attempt-1) milliseconds
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt} failed, waiting ${delay}ms before retry ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

/**
 * Data Corruption Detection and Recovery
 */
export class DataCorruptionHandler {
  static createDataCorruptionError(
    type: DataCorruptionError['type'],
    message: string,
    severity: DataCorruptionError['severity'] = 'MEDIUM',
    recoverable: boolean = true,
    backupAvailable: boolean = false
  ): DataCorruptionError {
    const error = new Error(message) as DataCorruptionError;
    error.type = type;
    error.severity = severity;
    error.recoverable = recoverable;
    error.backupAvailable = backupAvailable;
    return error;
  }

  static async handleDataCorruption(
    error: DataCorruptionError,
    restoreFromBackup?: () => Promise<boolean>,
    notifyParent?: (message: string) => Promise<void>,
    options: ErrorRecoveryOptions = {}
  ): Promise<{ recovered: boolean; backupRestored: boolean }> {
    const { showAlert = true, logError = true } = options;

    if (logError) {
      console.error('Data corruption detected:', {
        type: error.type,
        severity: error.severity,
        recoverable: error.recoverable,
        backupAvailable: error.backupAvailable,
        message: error.message,
      });
    }

    let recovered = false;
    let backupRestored = false;

    // Attempt recovery based on severity and availability
    if (error.recoverable && error.backupAvailable && restoreFromBackup) {
      try {
        backupRestored = await restoreFromBackup();
        recovered = backupRestored;
        
        if (backupRestored) {
          console.log('Successfully restored from backup');
          
          // Notify parent of recovery action
          if (notifyParent) {
            await notifyParent(
              `Data corruption was detected and automatically recovered from backup. Type: ${error.type}, Severity: ${error.severity}`
            );
          }
        }
      } catch (restoreError) {
        console.error('Failed to restore from backup:', restoreError);
      }
    }

    if (showAlert) {
      if (recovered) {
        Alert.alert(
          'Data Recovered',
          'A data issue was detected and automatically fixed. Your data has been restored from a recent backup.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Data Issue Detected',
          this.getCorruptionMessage(error),
          [
            { text: 'OK' },
            ...(error.recoverable && restoreFromBackup ? [
              { text: 'Try Recovery', onPress: () => restoreFromBackup() }
            ] : []),
          ]
        );
      }
    }

    return { recovered, backupRestored };
  }

  private static getCorruptionMessage(error: DataCorruptionError): string {
    const baseMessage = (() => {
      switch (error.type) {
        case 'PROFILE_CORRUPTION':
          return 'Your profile data appears to be corrupted.';
        case 'TRANSACTION_CORRUPTION':
          return 'Some transaction data appears to be corrupted.';
        case 'STORAGE_CORRUPTION':
          return 'Local storage data appears to be corrupted.';
        default:
          return 'Some app data appears to be corrupted.';
      }
    })();

    if (error.recoverable && error.backupAvailable) {
      return `${baseMessage} We can attempt to restore from a backup.`;
    } else if (error.recoverable) {
      return `${baseMessage} We can attempt to fix this automatically.`;
    } else {
      return `${baseMessage} Please contact support for assistance.`;
    }
  }

  static validateProfileData(profile: any): DataCorruptionError | null {
    if (!profile) {
      return this.createDataCorruptionError(
        'PROFILE_CORRUPTION',
        'Profile data is missing',
        'HIGH',
        false
      );
    }

    if (typeof profile.balance !== 'number' || profile.balance < 0) {
      return this.createDataCorruptionError(
        'PROFILE_CORRUPTION',
        'Profile balance is invalid',
        'MEDIUM',
        true
      );
    }

    if (typeof profile.total_earned !== 'number' || profile.total_earned < 0) {
      return this.createDataCorruptionError(
        'PROFILE_CORRUPTION',
        'Profile total_earned is invalid',
        'LOW',
        true
      );
    }

    if (typeof profile.total_spent !== 'number' || profile.total_spent < 0) {
      return this.createDataCorruptionError(
        'PROFILE_CORRUPTION',
        'Profile total_spent is invalid',
        'LOW',
        true
      );
    }

    // Check for logical inconsistencies
    if (profile.balance + profile.total_spent > profile.total_earned) {
      return this.createDataCorruptionError(
        'PROFILE_CORRUPTION',
        'Profile balance calculations are inconsistent',
        'MEDIUM',
        true
      );
    }

    return null;
  }

  static validateTransactionData(transaction: any): DataCorruptionError | null {
    if (!transaction) {
      return this.createDataCorruptionError(
        'TRANSACTION_CORRUPTION',
        'Transaction data is missing',
        'MEDIUM',
        false
      );
    }

    if (!transaction.id || !transaction.user_id) {
      return this.createDataCorruptionError(
        'TRANSACTION_CORRUPTION',
        'Transaction missing required IDs',
        'HIGH',
        false
      );
    }

    if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
      return this.createDataCorruptionError(
        'TRANSACTION_CORRUPTION',
        'Transaction amount is invalid',
        'MEDIUM',
        true
      );
    }

    if (!['earn', 'spend'].includes(transaction.type)) {
      return this.createDataCorruptionError(
        'TRANSACTION_CORRUPTION',
        'Transaction type is invalid',
        'MEDIUM',
        true
      );
    }

    return null;
  }
}

/**
 * General Error Recovery Utilities
 */
export class ErrorRecoveryUtils {
  static async withErrorRecovery<T>(
    operation: () => Promise<T>,
    errorHandler: (error: Error) => Promise<void>,
    maxRetries: number = 1
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt <= maxRetries) {
          await errorHandler(lastError);
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError!;
  }

  static logError(error: Error, context: string, additionalData?: any): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      stack: error.stack,
      additionalData,
    };

    console.error('Error logged:', errorLog);
    
    // In a production app, you might want to send this to a logging service
    // await sendToLoggingService(errorLog);
  }
}