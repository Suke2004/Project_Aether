import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
export interface AuthUser {
  id: string;
  email: string;
  role: 'parent' | 'child';
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

// Placeholder authentication service
export class AuthService {
  private static instance: AuthService;
  private currentSession: AuthSession | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    if (this.currentSession) {
      return this.currentSession;
    }

    try {
      const sessionData = await AsyncStorage.getItem('auth_session');
      if (sessionData) {
        const session = JSON.parse(sessionData) as AuthSession;
        if (session.expiresAt > Date.now()) {
          this.currentSession = session;
          return session;
        } else {
          await this.signOut();
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }

    return null;
  }

  async signOut(): Promise<void> {
    this.currentSession = null;
    await AsyncStorage.removeItem('auth_session');
  }

  // Note: This is a placeholder implementation
  // In a real app, you would implement proper JWT authentication
  async signIn(email: string, password: string): Promise<AuthSession> {
    throw new Error('Authentication not implemented - using Supabase instead');
  }

  async signUp(email: string, password: string, role: 'parent' | 'child'): Promise<AuthSession> {
    throw new Error('Authentication not implemented - using Supabase instead');
  }
}

export default AuthService;