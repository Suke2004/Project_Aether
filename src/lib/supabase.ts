/**
 * Supabase client configuration for the Attention Wallet system
 * Handles database operations, authentication, and real-time subscriptions
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, validateConfig } from './config';
import { Profile, Transaction, QuestType } from './types';

// Initialize Supabase client
let supabase: SupabaseClient | null = null;

/**
 * Get or create the Supabase client instance
 * Implements singleton pattern for efficient resource usage
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    // Validate configuration before creating client
    if (!validateConfig()) {
      throw new Error('Invalid Supabase configuration. Please check your environment variables.');
    }

    try {
      supabase = createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        }
      );

      console.log('Supabase client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      throw new Error('Failed to initialize Supabase client');
    }
  }

  return supabase;
};

/**
 * Authentication helper functions
 */
export const authHelpers = {
  /**
   * Sign up a new user with email and password
   */
  signUp: async (email: string, password: string, role: 'parent' | 'child') => {
    const client = getSupabaseClient();
    
    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }

      // Create profile after successful signup
      if (data.user) {
        await createUserProfile(data.user.id, role);
      }

      return data;
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    const client = getSupabaseClient();
    
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    const client = getSupabaseClient();
    
    try {
      const { error } = await client.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  },

  /**
   * Get current user session
   */
  getSession: async (): Promise<Session | null> => {
    const client = getSupabaseClient();
    
    try {
      const { data: { session }, error } = await client.auth.getSession();
      
      if (error) {
        console.error('Get session error:', error);
        throw error;
      }

      return session;
    } catch (error) {
      console.error('Get session failed:', error);
      throw error;
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<User | null> => {
    const client = getSupabaseClient();
    
    try {
      const { data: { user }, error } = await client.auth.getUser();
      
      if (error) {
        console.error('Get user error:', error);
        throw error;
      }

      return user;
    } catch (error) {
      console.error('Get user failed:', error);
      throw error;
    }
  },
};

/**
 * Database helper functions
 */
export const dbHelpers = {
  /**
   * Get user profile by ID
   */
  getProfile: async (userId: string): Promise<Profile | null> => {
    const client = getSupabaseClient();
    
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Get profile error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get profile failed:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
    const client = getSupabaseClient();
    
    try {
      const { data, error } = await client
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Update profile error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  },

  /**
   * Get transactions for a user
   */
  getTransactions: async (userId: string, limit?: number): Promise<Transaction[]> => {
    const client = getSupabaseClient();
    
    try {
      let query = client
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get transactions error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get transactions failed:', error);
      throw error;
    }
  },

  /**
   * Create a new transaction
   */
  createTransaction: async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const client = getSupabaseClient();
    
    try {
      const { data, error } = await client
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) {
        console.error('Create transaction error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Create transaction failed:', error);
      throw error;
    }
  },

  /**
   * Get active quest types
   */
  getActiveQuestTypes: async (): Promise<QuestType[]> => {
    const client = getSupabaseClient();
    
    try {
      const { data, error } = await client
        .from('quest_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Get quest types error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get quest types failed:', error);
      throw error;
    }
  },
};

/**
 * Real-time subscription helpers
 */
export const realtimeHelpers = {
  /**
   * Subscribe to profile changes
   */
  subscribeToProfile: (userId: string, callback: (profile: Profile) => void) => {
    const client = getSupabaseClient();
    
    return client
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Profile);
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to transaction changes
   */
  subscribeToTransactions: (userId: string, callback: (transaction: Transaction) => void) => {
    const client = getSupabaseClient();
    
    return client
      .channel(`transactions-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Transaction);
        }
      )
      .subscribe();
  },
};

/**
 * Create user profile after signup
 */
const createUserProfile = async (userId: string, role: 'parent' | 'child'): Promise<Profile> => {
  const client = getSupabaseClient();
  
  try {
    const { data, error } = await client
      .from('profiles')
      .insert({
        id: userId,
        role,
        balance: 0,
        total_earned: 0,
        total_spent: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Create profile error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Create profile failed:', error);
    throw error;
  }
};

// Export the client instance for direct access when needed
export { supabase };
export default getSupabaseClient;