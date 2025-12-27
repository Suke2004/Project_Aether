/**
 * Cyberpunk Theme Configuration
 * Consistent styling and theming for the Attention Wallet app
 */

import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Color Palette - Cyberpunk inspired
export const colors = {
  // Primary colors
  primary: '#00ff88',      // Neon green
  primaryDark: '#00cc6a',  // Darker green
  primaryLight: '#33ffaa', // Lighter green
  
  // Secondary colors
  secondary: '#ff0080',    // Neon pink
  secondaryDark: '#cc0066', // Darker pink
  secondaryLight: '#ff33aa', // Lighter pink
  
  // Accent colors
  accent: '#00ccff',       // Neon blue
  accentDark: '#0099cc',   // Darker blue
  accentLight: '#33ddff',  // Lighter blue
  
  // Background colors
  background: '#0a0a0a',   // Deep black
  backgroundCard: '#1a1a1a', // Dark gray
  backgroundModal: '#0f0f0f', // Slightly lighter black
  
  // Text colors
  text: '#ffffff',         // White
  textSecondary: '#cccccc', // Light gray
  textMuted: '#888888',    // Medium gray
  textDark: '#444444',     // Dark gray
  
  // Status colors
  success: '#00ff88',      // Same as primary
  warning: '#ffaa00',      // Orange
  error: '#ff4444',        // Red
  info: '#00ccff',         // Same as accent
  
  // UI colors
  border: '#333333',       // Dark border
  borderLight: '#555555',  // Lighter border
  shadow: '#000000',       // Black shadow
  overlay: 'rgba(0, 0, 0, 0.8)', // Semi-transparent overlay
  
  // Transparent variations
  primaryTransparent: 'rgba(0, 255, 136, 0.1)',
  secondaryTransparent: 'rgba(255, 0, 128, 0.1)',
  accentTransparent: 'rgba(0, 204, 255, 0.1)',
};

// Typography
export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 48,
  },
  
  // Font weights
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
};

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 6.27,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
};

// Screen dimensions
export const dimensions = {
  screenWidth,
  screenHeight,
  isSmallScreen: screenWidth < 375,
  isMediumScreen: screenWidth >= 375 && screenWidth < 414,
  isLargeScreen: screenWidth >= 414,
};

// Animation durations
export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};

// Common component styles
export const commonStyles = {
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  
  centeredContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  
  glowCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.glow,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.md,
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Text styles
  heading1: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    lineHeight: typography.fontSize.display * typography.lineHeight.tight,
  },
  
  heading2: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    lineHeight: typography.fontSize.xxxl * typography.lineHeight.tight,
  },
  
  heading3: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    lineHeight: typography.fontSize.xxl * typography.lineHeight.normal,
  },
  
  bodyText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    color: colors.text,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
  },
  
  captionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  
  // Input styles
  textInput: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  
  textInputFocused: {
    borderColor: colors.primary,
    ...shadows.glow,
  },
};

// Cyberpunk-specific effects
export const cyberpunkEffects = {
  neonGlow: {
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  
  pinkGlow: {
    textShadowColor: colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  
  blueGlow: {
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  
  scanlines: {
    // This would be implemented with a custom component or gradient
    opacity: 0.1,
  },
};

// Export the complete theme
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  dimensions,
  animations,
  commonStyles,
  cyberpunkEffects,
};

export default theme;