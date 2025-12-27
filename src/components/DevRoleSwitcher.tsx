/**
 * Development Role Switcher Component
 * Allows switching between parent and child roles in development mode
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useAuth } from '../context/AuthContext';

const colors = {
  primary: '#00ffff',
  secondary: '#ff00ff',
  accent: '#ffff00',
  background: '#0a0a0a',
  cardBg: '#1a1a2e',
  success: '#00ff80',
  error: '#ff0040',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
};

export const DevRoleSwitcher: React.FC = () => {
  const { profile, switchRole } = useAuth();
  
  // Only show in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;
  
  if (!isDevelopment) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Dev Mode</Text>
      <Text style={styles.currentRole}>
        Current Role: <Text style={styles.roleText}>{profile?.role || 'none'}</Text>
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            profile?.role === 'child' && styles.activeButton,
          ]}
          onPress={() => switchRole?.('child')}
        >
          <Text style={[
            styles.buttonText,
            profile?.role === 'child' && styles.activeButtonText,
          ]}>
            👶 Child
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.roleButton,
            profile?.role === 'parent' && styles.activeButton,
          ]}
          onPress={() => switchRole?.('parent')}
        >
          <Text style={[
            styles.buttonText,
            profile?.role === 'parent' && styles.activeButtonText,
          ]}>
            👨‍👩‍👧‍👦 Parent
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    zIndex: 9999, // Increased z-index to ensure visibility
    minWidth: 150,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8, // For Android shadow
  } as ViewStyle,

  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 8,
  } as TextStyle,

  currentRole: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  } as TextStyle,

  roleText: {
    color: colors.primary,
    fontWeight: 'bold',
  } as TextStyle,

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,

  roleButton: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.primary + '50',
    flex: 1,
    marginHorizontal: 2,
  } as ViewStyle,

  activeButton: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  } as ViewStyle,

  buttonText: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  } as TextStyle,

  activeButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  } as TextStyle,
});

export default DevRoleSwitcher;