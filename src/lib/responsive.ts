/**
 * Responsive Design Utilities
 * Helper functions for responsive design across different screen sizes
 * Enhanced for Android device compatibility
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';
import { getAndroidDeviceInfo } from './androidUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro as reference, but adjusted for Android)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Screen size categories (enhanced for Android)
export const SCREEN_SIZES = {
  SMALL: 'small',   // < 360px width (older Android phones)
  MEDIUM: 'medium', // 360px - 414px width (most Android phones)
  LARGE: 'large',   // 414px - 768px width (large Android phones)
  XLARGE: 'xlarge', // > 768px width (tablets)
} as const;

export type ScreenSize = typeof SCREEN_SIZES[keyof typeof SCREEN_SIZES];

// Get current screen size category (Android-optimized)
export const getScreenSize = (): ScreenSize => {
  if (SCREEN_WIDTH < 360) return SCREEN_SIZES.SMALL;
  if (SCREEN_WIDTH <= 414) return SCREEN_SIZES.MEDIUM;
  if (SCREEN_WIDTH <= 768) return SCREEN_SIZES.LARGE;
  return SCREEN_SIZES.XLARGE;
};

// Scale function based on screen width (Android-optimized)
export const scaleWidth = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  
  // Apply different scaling for Android to account for density
  if (Platform.OS === 'android') {
    const pixelRatio = PixelRatio.get();
    return (scale * size) / Math.max(pixelRatio / 2, 1);
  }
  
  return scale * size;
};

// Scale function based on screen height (Android-optimized)
export const scaleHeight = (size: number): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  
  // Account for Android navigation bars and status bars
  if (Platform.OS === 'android') {
    const androidInfo = getAndroidDeviceInfo();
    const adjustedHeight = SCREEN_HEIGHT - androidInfo.statusBarHeight;
    return (adjustedHeight / BASE_HEIGHT) * size;
  }
  
  return scale * size;
};

// Scale font size based on screen size and pixel density (Android-optimized)
export const scaleFontSize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  let newSize = size * scale;
  
  if (Platform.OS === 'android') {
    // Android font scaling considerations
    const fontScale = PixelRatio.getFontScale();
    const pixelRatio = PixelRatio.get();
    
    // Adjust for Android's font scale setting
    newSize = newSize / Math.max(fontScale, 1);
    
    // Ensure readability on high-density Android screens
    if (pixelRatio > 2.5) {
      newSize = Math.max(newSize, size * 0.9);
    }
  }
  
  // Ensure minimum readability
  return Math.max(newSize, size * 0.75);
};

// Responsive spacing (Android-optimized)
export const getResponsiveSpacing = (baseSpacing: number) => {
  const screenSize = getScreenSize();
  
  // Android-specific spacing adjustments
  if (Platform.OS === 'android') {
    const androidInfo = getAndroidDeviceInfo();
    const densityMultiplier = androidInfo.screenSize === 'small' ? 0.8 : 1;
    
    switch (screenSize) {
      case SCREEN_SIZES.SMALL:
        return baseSpacing * 0.7 * densityMultiplier;
      case SCREEN_SIZES.MEDIUM:
        return baseSpacing * densityMultiplier;
      case SCREEN_SIZES.LARGE:
        return baseSpacing * 1.1 * densityMultiplier;
      case SCREEN_SIZES.XLARGE:
        return baseSpacing * 1.3 * densityMultiplier;
      default:
        return baseSpacing * densityMultiplier;
    }
  }
  
  // iOS/Web spacing
  switch (screenSize) {
    case SCREEN_SIZES.SMALL:
      return baseSpacing * 0.8;
    case SCREEN_SIZES.MEDIUM:
      return baseSpacing;
    case SCREEN_SIZES.LARGE:
      return baseSpacing * 1.2;
    case SCREEN_SIZES.XLARGE:
      return baseSpacing * 1.4;
    default:
      return baseSpacing;
  }
};

// Responsive padding/margin
export const getResponsivePadding = (basePadding: number) => {
  return getResponsiveSpacing(basePadding);
};

// Check if device is tablet-like (Android-optimized)
export const isTablet = (): boolean => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  
  if (Platform.OS === 'android') {
    // Android tablet detection
    const androidInfo = getAndroidDeviceInfo();
    return androidInfo.screenSize === 'xlarge' || 
           (SCREEN_WIDTH >= 600 && aspectRatio < 1.8);
  }
  
  // iOS/Web tablet detection
  return SCREEN_WIDTH >= 768 || (SCREEN_WIDTH >= 600 && aspectRatio < 1.6);
};

// Get responsive grid columns (Android-optimized)
export const getGridColumns = (baseColumns: number = 2): number => {
  const screenSize = getScreenSize();
  
  if (isTablet()) {
    return Math.min(baseColumns + 2, 5);
  }
  
  // Android-specific column adjustments
  if (Platform.OS === 'android') {
    switch (screenSize) {
      case SCREEN_SIZES.SMALL:
        return Math.max(baseColumns - 1, 1);
      case SCREEN_SIZES.MEDIUM:
        return baseColumns;
      case SCREEN_SIZES.LARGE:
        return baseColumns + 1;
      case SCREEN_SIZES.XLARGE:
        return baseColumns + 2;
      default:
        return baseColumns;
    }
  }
  
  // iOS/Web columns
  switch (screenSize) {
    case SCREEN_SIZES.SMALL:
      return Math.max(baseColumns - 1, 1);
    case SCREEN_SIZES.MEDIUM:
      return baseColumns;
    case SCREEN_SIZES.LARGE:
      return baseColumns + 1;
    case SCREEN_SIZES.XLARGE:
      return baseColumns + 2;
    default:
      return baseColumns;
  }
};

// Responsive breakpoints (Android-optimized)
export const breakpoints = {
  small: 360,   // Adjusted for Android
  medium: 414,
  large: 768,
  xlarge: 1024,
};

// Media query-like function
export const mediaQuery = {
  small: () => SCREEN_WIDTH < breakpoints.small,
  medium: () => SCREEN_WIDTH >= breakpoints.small && SCREEN_WIDTH < breakpoints.medium,
  large: () => SCREEN_WIDTH >= breakpoints.medium && SCREEN_WIDTH < breakpoints.large,
  xlarge: () => SCREEN_WIDTH >= breakpoints.large,
};

// Responsive values helper (enhanced)
export const responsive = <T>(values: {
  small?: T;
  medium?: T;
  large?: T;
  xlarge?: T;
  android?: T;
  ios?: T;
  default: T;
}): T => {
  // Platform-specific values
  if (Platform.OS === 'android' && values.android !== undefined) {
    return values.android;
  }
  if (Platform.OS === 'ios' && values.ios !== undefined) {
    return values.ios;
  }
  
  // Screen size-specific values
  const screenSize = getScreenSize();
  
  switch (screenSize) {
    case SCREEN_SIZES.SMALL:
      return values.small ?? values.default;
    case SCREEN_SIZES.MEDIUM:
      return values.medium ?? values.default;
    case SCREEN_SIZES.LARGE:
      return values.large ?? values.default;
    case SCREEN_SIZES.XLARGE:
      return values.xlarge ?? values.default;
    default:
      return values.default;
  }
};

// Screen dimensions (enhanced)
export const screenDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: getScreenSize() === SCREEN_SIZES.SMALL,
  isMedium: getScreenSize() === SCREEN_SIZES.MEDIUM,
  isLarge: getScreenSize() === SCREEN_SIZES.LARGE,
  isXLarge: getScreenSize() === SCREEN_SIZES.XLARGE,
  isTablet: isTablet(),
  pixelRatio: PixelRatio.get(),
  fontScale: PixelRatio.getFontScale(),
};

// Safe area helpers (Android-optimized)
export const getSafeAreaPadding = () => {
  if (Platform.OS === 'android') {
    const androidInfo = getAndroidDeviceInfo();
    return {
      top: androidInfo.statusBarHeight,
      bottom: androidInfo.hasNotch ? 24 : 0,
      left: 0,
      right: 0,
    };
  }
  
  // iOS safe area (simplified)
  const hasNotch = SCREEN_HEIGHT >= 812;
  return {
    top: hasNotch ? 44 : 20,
    bottom: hasNotch ? 34 : 0,
    left: 0,
    right: 0,
  };
};

// Android-specific touch target sizing
export const getTouchTargetSize = (baseSize: number) => {
  if (Platform.OS === 'android') {
    // Android minimum touch target is 48dp
    return Math.max(baseSize, 48);
  }
  return Math.max(baseSize, 44); // iOS minimum
};

export default {
  scaleWidth,
  scaleHeight,
  scaleFontSize,
  getScreenSize,
  getResponsiveSpacing,
  getResponsivePadding,
  getGridColumns,
  isTablet,
  mediaQuery,
  responsive,
  screenDimensions,
  getSafeAreaPadding,
  getTouchTargetSize,
  SCREEN_SIZES,
  breakpoints,
};