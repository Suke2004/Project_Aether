/**
 * Utility functions for the Attention Wallet system
 */

/**
 * Format timestamp to readable string
 */
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

/**
 * Calculate tokens from minutes
 */
export const minutesToTokens = (minutes: number): number => {
  return Math.ceil(minutes * 5); // 5 tokens per minute
};

/**
 * Calculate minutes from tokens
 */
export const tokensToMinutes = (tokens: number): number => {
  return tokens / 5;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate unique ID for offline transactions
 */
export const generateOfflineId = (): string => {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return __DEV__;
};

/**
 * Safe JSON parse with fallback
 */
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};