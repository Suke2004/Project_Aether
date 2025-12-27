/**
 * Responsive Design Utilities
 * Helper functions for responsive design across different screen sizes
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro as reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Screen size categories
export const SCREEN_SIZES = {
  SMALL: 'small',   // < 375px width
  MEDIUM: 'medium', // 375px - 414px width
  LARGE: 'large',   // > 414px width
} as const;

export type ScreenSize = typeof SCREEN_SIZES[keyof typeof SCREEN_SIZES];

// Get current screen size category
export const getScreenSize = (): ScreenSize => {
  if (SCREEN_WIDTH < 375) return SCREEN_SIZES.SMALL;
  if (SCREEN_WIDTH <= 414) return SCREEN_SIZES.MEDIUM;
  return SCREEN_SIZES.LARGE;
};

// Scale function based on screen width
export const scaleWidth = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

// Scale function based on screen height
export const scaleHeight = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

// Scale font size based on screen size and pixel density
export const scaleFontSize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  
  // Ensure minimum readability
  if (PixelRatio.getFontScale() > 1) {
    return Math.max(newSize, size * 0.9);
  }
  
  return Math.max(newSize, size * 0.8);
};

// Responsive spacing
export const getResponsiveSpacing = (baseSpacing: number) => {
  const screenSize = getScreenSize();
  
  switch (screenSize) {
    case SCREEN_SIZES.SMALL:
      return baseSpacing * 0.8;
    case SCREEN_SIZES.MEDIUM:
      return baseSpacing;
    case SCREEN_SIZES.LARGE:
      return baseSpacing * 1.2;
    default:
      return baseSpacing;
  }
};

// Responsive padding/margin
export const getResponsivePadding = (basePadding: number) => {
  return getResponsiveSpacing(basePadding);
};

// Check if device is tablet-like (based on screen size and aspect ratio)
export const isTablet = (): boolean => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return SCREEN_WIDTH >= 768 || (SCREEN_WIDTH >= 600 && aspectRatio < 1.6);
};

// Get responsive grid columns
export const getGridColumns = (baseColumns: number = 2): number => {
  const screenSize = getScreenSize();
  
  if (isTablet()) {
    return Math.min(baseColumns + 2, 4);
  }
  
  switch (screenSize) {
    case SCREEN_SIZES.SMALL:
      return Math.max(baseColumns - 1, 1);
    case SCREEN_SIZES.MEDIUM:
      return baseColumns;
    case SCREEN_SIZES.LARGE:
      return baseColumns + 1;
    default:
      return baseColumns;
  }
};

// Responsive breakpoints
export const breakpoints = {
  small: 375,
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

// Responsive values helper
export const responsive = <T>(values: {
  small?: T;
  medium?: T;
  large?: T;
  default: T;
}): T => {
  const screenSize = getScreenSize();
  
  switch (screenSize) {
    case SCREEN_SIZES.SMALL:
      return values.small ?? values.default;
    case SCREEN_SIZES.MEDIUM:
      return values.medium ?? values.default;
    case SCREEN_SIZES.LARGE:
      return values.large ?? values.default;
    default:
      return values.default;
  }
};

// Screen dimensions
export const screenDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: getScreenSize() === SCREEN_SIZES.SMALL,
  isMedium: getScreenSize() === SCREEN_SIZES.MEDIUM,
  isLarge: getScreenSize() === SCREEN_SIZES.LARGE,
  isTablet: isTablet(),
};

// Safe area helpers (for devices with notches)
export const getSafeAreaPadding = () => {
  // This is a simplified version - in production you'd use react-native-safe-area-context
  const hasNotch = SCREEN_HEIGHT >= 812; // iPhone X and newer
  
  return {
    top: hasNotch ? 44 : 20,
    bottom: hasNotch ? 34 : 0,
  };
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
  SCREEN_SIZES,
  breakpoints,
};