/**
 * Authentication Context for the Attention Wallet system
 * Handles user authentication, session management, and role-based access control
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, authHelpers, dbHelpers } from '../lib/supabase';
import { Profile, AuthContextType } from '../lib/types';

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props interface for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Manages authentication state and provides auth functions to child components
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  const supabase = getSupabaseClient();

  /**
   * Initialize authentication state on component mount
   */
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;
    console.log('AuthContext useEffect starting, isDevelopment:', isDevelopment);
    
    initializeAuth();
    
    // Only set up auth state change listener in production mode
    let subscription: any = null;
    let loadingTimeout: NodeJS.Timeout;
    
    if (!isDevelopment) {
      console.log('Setting up production auth listener');
      // Set up auth state change listener for production
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);
          
          if (session?.user) {
            await handleUserSession(session.user, session);
          } else {
            // User signed out or session expired
            setUser(null);
            setProfile(null);
            setSession(null);
          }
          
          setIsLoading(false);
        }
      );
      subscription = authSubscription;
      
      // Fallback timeout for production mode
      loadingTimeout = setTimeout(() => {
        console.warn('Auth initialization timeout, forcing loading to false');
        setIsLoading(false);
      }, 10000); // 10 second timeout
    } else {
      console.log('Development mode: setting up short timeout');
      // In development mode, set a shorter timeout since we use mock data
      loadingTimeout = setTimeout(() => {
        console.log('Development mode: ensuring loading state is cleared');
        setIsLoading(false);
      }, 2000); // 2 second timeout for dev mode
    }

    return () => {
      console.log('AuthContext cleanup');
      if (subscription) {
        subscription.unsubscribe();
      }
      clearTimeout(loadingTimeout);
    };
  }, []);

  /**
   * Initialize authentication state from existing session
   */
  const initializeAuth = async () => {
    console.log('initializeAuth starting');
    
    // Development mode: Create a mock user for testing
    const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;
    
    if (isDevelopment) {
      console.log('Running in development mode - creating mock user');
      
      // Create a mock user and profile for development
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000123',
        email: 'dev@example.com',
        user_metadata: { role: 'child' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      
      const mockProfile: Profile = {
        id: '00000000-0000-0000-0000-000000000123',
        role: 'child',
        balance: 50,
        total_earned: 100,
        total_spent: 50,
      };
      
      console.log('Setting mock user and profile in development mode');
      setUser(mockUser);
      setProfile(mockProfile);
      console.log('Development mode initialization complete, setting loading to false');
      setIsLoading(false);
      return;
    }

    // Production mode: Get current session
    try {
      setIsLoading(true);
      const currentSession = await authHelpers.getSession();
      
      if (currentSession?.user) {
        await handleUserSession(currentSession.user, currentSession);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      
      // Fallback to development mode if auth fails
      console.log('Auth failed, falling back to development mode');
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000123',
        email: 'dev@example.com',
        user_metadata: { role: 'child' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      
      const mockProfile: Profile = {
        id: '00000000-0000-0000-0000-000000000123',
        role: 'child',
        balance: 50,
        total_earned: 100,
        total_spent: 50,
      };
      
      setUser(mockUser);
      setProfile(mockProfile);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle user session and load profile
   */
  const handleUserSession = async (user: User, session: Session) => {
    try {
      setUser(user);
      setSession(session);
      
      // Load user profile
      const userProfile = await dbHelpers.getProfile(user.id);
      
      if (userProfile) {
        setProfile(userProfile);
      } else {
        // Profile doesn't exist, create one based on user metadata
        const role = user.user_metadata?.role || 'child';
        console.log('Creating profile for user:', user.id, 'with role:', role);
        
        // Create profile using the helper function from supabase.ts
        const newProfile = await createUserProfile(user.id, role);
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Failed to handle user session:', error);
      // Don't throw here, just log the error and continue
    }
  };

  /**
   * Create user profile (extracted from supabase.ts for consistency)
   */
  const createUserProfile = async (userId: string, role: 'parent' | 'child'): Promise<Profile> => {
    try {
      const { data, error } = await supabase
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

  /**
   * Sign up a new user
   */
  const signUp = async (email: string, password: string, role: 'parent' | 'child'): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (!['parent', 'child'].includes(role)) {
        throw new Error('Invalid role. Must be either "parent" or "child"');
      }

      // Use the auth helper to sign up
      const { user: newUser, session: newSession } = await authHelpers.signUp(email, password, role);
      
      if (newUser && newSession) {
        // The auth state change listener will handle setting the user and profile
        console.log('User signed up successfully:', newUser.id);
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in an existing user
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Use the auth helper to sign in
      const { user: signedInUser, session: newSession } = await authHelpers.signIn(email, password);
      
      if (signedInUser && newSession) {
        // The auth state change listener will handle setting the user and profile
        console.log('User signed in successfully:', signedInUser.id);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Use the auth helper to sign out
      await authHelpers.signOut();
      
      // Clear local state (auth state change listener will also handle this)
      setUser(null);
      setProfile(null);
      setSession(null);
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if current user has required role
   */
  const hasRole = (requiredRole: 'parent' | 'child'): boolean => {
    return profile?.role === requiredRole;
  };

  /**
   * Check if current user is authenticated
   */
  const isAuthenticated = (): boolean => {
    return !!(user && profile);
  };

  /**
   * Refresh user profile from database
   */
  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const updatedProfile = await dbHelpers.getProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      throw error;
    }
  };

  // Context value with all auth functions and state
  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    // Additional helper functions for role-based access control
    hasRole,
    isAuthenticated,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the authentication context
 * Throws an error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Higher-order component for role-based access control
 * Wraps components that require specific roles
 */
export const withRoleAccess = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: 'parent' | 'child'
) => {
  return (props: P) => {
    const { hasRole, isLoading } = useAuth();
    
    if (isLoading) {
      // You might want to return a loading component here
      return null;
    }
    
    if (!hasRole(requiredRole)) {
      // You might want to return an unauthorized component here
      console.warn(`Access denied. Required role: ${requiredRole}`);
      return null;
    }
    
    return <Component {...props} />;
  };
};

export default AuthContext;