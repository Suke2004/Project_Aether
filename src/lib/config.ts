/**
 * Environment configuration for the Attention Wallet system
 * Handles API keys and configuration settings
 */

// Supabase configuration
export const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};

// Google Gemini AI configuration
export const GEMINI_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_GEMINI_KEY || '',
  model: 'gemini-2.5-flash',
};

// App configuration
export const APP_CONFIG = {
  tokenRate: 5, // 5 tokens per minute
  minConfidenceScore: 70, // Minimum AI confidence for quest validation
  maxRetries: 3, // Maximum retry attempts for API calls
  syncInterval: 30000, // 30 seconds for offline sync attempts
};

// Validation functions
export const validateConfig = (): boolean => {
  const requiredVars = [
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey,
    GEMINI_CONFIG.apiKey,
  ];

  const missingVars = requiredVars.filter(variable => !variable);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables. Please check your .env file.');
    return false;
  }

  return true;
};

// Entertainment apps configuration
export const ENTERTAINMENT_APPS: Array<{
  name: string;
  packageName?: string;
  deepLink?: string;
  webUrl?: string;
  icon: string;
  category: string;
}> = [
  {
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    deepLink: 'youtube://',
    webUrl: 'https://youtube.com',
    icon: '📺',
    category: 'video',
  },
  {
    name: 'Netflix',
    packageName: 'com.netflix.mediaclient',
    deepLink: 'nflx://',
    webUrl: 'https://netflix.com',
    icon: '🎬',
    category: 'video',
  },
  {
    name: 'Spotify',
    packageName: 'com.spotify.music',
    deepLink: 'spotify://',
    webUrl: 'https://open.spotify.com',
    icon: '🎵',
    category: 'music',
  },
  {
    name: 'TikTok',
    packageName: 'com.zhiliaoapp.musically',
    deepLink: 'tiktok://',
    webUrl: 'https://tiktok.com',
    icon: '🎭',
    category: 'social',
  },
  {
    name: 'Instagram',
    packageName: 'com.instagram.android',
    deepLink: 'instagram://',
    webUrl: 'https://instagram.com',
    icon: '📸',
    category: 'social',
  },
  {
    name: 'Discord',
    packageName: 'com.discord',
    deepLink: 'discord://',
    webUrl: 'https://discord.com/app',
    icon: '💬',
    category: 'social',
  },
];