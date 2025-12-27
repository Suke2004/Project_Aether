/**
 * Core TypeScript interfaces for the Attention Wallet system
 * Based on the design document data models
 */

export interface Profile {
  id: string;
  role: 'parent' | 'child';
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'earn' | 'spend';
  description: string;
  proof_image_url?: string;
  app_name?: string;
  timestamp: string;
}

export interface QuestType {
  id: string;
  name: string;
  description: string;
  token_reward: number;
  verification_prompt: string;
  is_active: boolean;
  created_by?: string;
}

export interface AppUsageSession {
  appName: string;
  startTime: number;
  isActive: boolean;
  tokensSpent: number;
}

// Additional interfaces for context providers
export interface WalletContextType {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: Transaction[];
  isLoading: boolean;
  earnTokens: (amount: number, description: string, proofUrl?: string) => Promise<void>;
  spendTokens: (amount: number, description: string, appName?: string) => Promise<void>;
  refundTokens: (amount: number, description: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  // Offline queue status
  offlineStatus: {
    queueLength: number;
    unsyncedCount: number;
    isOnline: boolean;
    isSyncing: boolean;
  };
  syncOfflineTransactions: () => Promise<{ success: number; failed: number }>;
}

export interface AuthContextType {
  user: any | null; // Supabase User type
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'parent' | 'child') => Promise<void>;
  signOut: () => Promise<void>;
  // Additional helper functions for role-based access control
  hasRole: (requiredRole: 'parent' | 'child') => boolean;
  isAuthenticated: () => boolean;
  refreshProfile: () => Promise<void>;
  switchRole?: (newRole: 'parent' | 'child') => void; // Optional for development mode
}

// AI Service interfaces
export interface AIVerificationResult {
  isValid: boolean;
  confidence: number;
  reasoning?: string;
}

// App configuration interfaces
export interface AppConfig {
  name: string;
  packageName?: string;
  deepLink?: string;
  webUrl?: string;
  icon?: string;
  category: string;
}

// Offline queue interfaces
export interface QueuedTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  timestamp: string;
  proofImageUrl?: string;
  appName?: string;
  synced: boolean;
}