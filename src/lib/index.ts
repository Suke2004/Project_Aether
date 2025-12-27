/**
 * Main exports for the lib directory
 * Provides centralized access to types, configuration, and utilities
 */

// Export all types
export * from './types';

// Export configuration
export * from './config';

// Export utilities
export * from './utils';

// Export web utilities
export * from './webUtils';

// Export Supabase client and helpers
export * from './supabase';

// Export Gemini AI service
export * from './gemini';

// Export offline queue management
export * from './offlineQueue';

// Re-export commonly used types for convenience
export type {
  Profile,
  Transaction,
  QuestType,
  AppUsageSession,
  WalletContextType,
  AuthContextType,
  AIVerificationResult,
  AppConfig,
  QueuedTransaction,
} from './types';