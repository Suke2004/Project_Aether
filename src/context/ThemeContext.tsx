/**
 * Theme Context Provider
 * Provides theme configuration and utilities throughout the app
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { theme } from '../lib/theme';

interface ThemeContextType {
  theme: typeof theme;
  colors: typeof theme.colors;
  typography: typeof theme.typography;
  spacing: typeof theme.spacing;
  borderRadius: typeof theme.borderRadius;
  shadows: typeof theme.shadows;
  dimensions: typeof theme.dimensions;
  animations: typeof theme.animations;
  commonStyles: typeof theme.commonStyles;
  cyberpunkEffects: typeof theme.cyberpunkEffects;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const value: ThemeContextType = {
    theme,
    colors: theme.colors,
    typography: theme.typography,
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
    shadows: theme.shadows,
    dimensions: theme.dimensions,
    animations: theme.animations,
    commonStyles: theme.commonStyles,
    cyberpunkEffects: theme.cyberpunkEffects,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;