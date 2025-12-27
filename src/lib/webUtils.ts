/**
 * Web-specific utilities for React Native Web compatibility
 * Handles common issues when running React Native components in web browsers
 */

import { Platform } from 'react-native';

/**
 * Suppress React Native Web touch event warnings
 * This is a common issue when using TouchableOpacity and other touch components in web
 */
export const suppressTouchWarnings = (): void => {
  if (Platform.OS === 'web' && __DEV__) {
    // Store original console methods
    const originalWarn = console.warn;
    const originalError = console.error;

    // Override console.warn to filter out touch event warnings
    console.warn = (...args) => {
      const message = args[0];
      if (typeof message === 'string') {
        // Suppress specific React Native Web warnings
        if (
          message.includes('Cannot record touch end without a touch start') ||
          message.includes('ResponderTouchHistoryStore') ||
          message.includes('Touch End:') ||
          message.includes('Touch Bank:') ||
          message.includes('"shadow*" style props are deprecated') ||
          message.includes('"textShadow*" style props are deprecated') ||
          message.includes('props.pointerEvents is deprecated') ||
          message.includes('useNativeDriver') ||
          message.includes('RCTAnimation') ||
          message.includes('Require cycle:') ||
          message.includes('Download the React DevTools')
        ) {
          return; // Suppress these warnings
        }
      }
      originalWarn.apply(console, args);
    };

    // Override console.error to filter out related errors
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string') {
        // Suppress specific React Native Web errors related to touch events, CORS, and Supabase
        if (
          message.includes('ResponderTouchHistoryStore') ||
          message.includes('touch event') ||
          message.includes('CORS policy') ||
          message.includes('Access-Control-Allow-Origin') ||
          message.includes('generate_204') ||
          message.includes('WebSocket connection') ||
          message.includes('WebSocket is closed before the connection is established') ||
          message.includes('supabase.co/realtime') ||
          message.includes('RealtimeClient')
        ) {
          return; // Suppress these errors
        }
      }
      originalError.apply(console, args);
    };

    console.log('🌐 Web compatibility warnings suppressed for development');
  }
};

/**
 * Configure web-specific settings for better React Native Web compatibility
 */
export const configureWebCompatibility = (): void => {
  if (Platform.OS === 'web') {
    // Suppress touch warnings
    suppressTouchWarnings();

    // Set up web network detection
    setupWebNetworkDetection();

    // Add web-specific CSS for better touch handling
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        /* Improve touch handling on web */
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Allow text selection for input fields */
        input, textarea {
          -webkit-user-select: text;
          -khtml-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Better focus handling */
        *:focus {
          outline: none;
        }
      `;
      document.head.appendChild(style);
    }
  }
};

/**
 * Enhanced TouchableOpacity props for web compatibility
 */
export const getWebCompatibleTouchProps = () => {
  if (Platform.OS === 'web') {
    return {
      // Prevent default touch behaviors that can cause warnings
      onTouchStart: undefined,
      onTouchEnd: undefined,
      onTouchMove: undefined,
      onTouchCancel: undefined,
      // Use mouse events instead for web
      activeOpacity: 0.7,
    };
  }
  return {};
};

/**
 * Check if running in web environment
 */
export const isWeb = (): boolean => {
  return Platform.OS === 'web';
};

/**
 * Get platform-specific styles
 */
export const getPlatformStyles = (webStyles: any = {}, nativeStyles: any = {}) => {
  return Platform.OS === 'web' ? webStyles : nativeStyles;
};

/**
 * Web-specific network detection
 * Uses the Navigator API to detect online/offline status
 */
export const setupWebNetworkDetection = (): (() => void) => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return () => {}; // No-op for non-web platforms
  }

  const handleOnline = () => {
    console.log('🌐 Network: Online');
  };

  const handleOffline = () => {
    console.log('🌐 Network: Offline');
  };

  // Add event listeners for network status changes
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Log initial status
  console.log(`🌐 Initial network status: ${navigator.onLine ? 'Online' : 'Offline'}`);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Check if currently online (web-compatible)
 */
export const isOnlineWeb = (): boolean => {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true; // Assume online for non-web platforms
};