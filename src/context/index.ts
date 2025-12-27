/**
 * Context providers index file
 * Export all context providers from this directory
 */

// Authentication Context
export { AuthProvider, useAuth, withRoleAccess } from './AuthContext';

// Wallet Context
export { WalletProvider, useWallet, withWalletAccess } from './WalletContext';

// Theme Context
export { ThemeProvider, useTheme } from './ThemeContext';