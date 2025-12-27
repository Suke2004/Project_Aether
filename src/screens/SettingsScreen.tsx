/**
 * SettingsScreen Component
 * User settings and preferences interface
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';

// Cyberpunk color scheme
const colors = {
  primary: '#00ffff',      // Cyan
  secondary: '#ff00ff',    // Magenta
  accent: '#ffff00',       // Yellow
  background: '#0a0a0a',   // Dark background
  cardBg: '#1a1a2e',       // Card background
  success: '#00ff80',      // Green
  error: '#ff0040',        // Red
  text: '#ffffff',         // White text
  textSecondary: '#b0b0b0', // Gray text
};

export const SettingsScreen = () => {
  const { user, profile, signOut } = useAuth();
  const { balance } = useWallet();
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [parentalControls, setParentalControls] = useState(true);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'This will reset all your quest progress and achievements. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement progress reset
            Alert.alert('Feature Coming Soon', 'Progress reset will be available in a future update.');
          },
        },
      ]
    );
  };

  const SettingItem = ({
    title,
    subtitle,
    value,
    onValueChange,
    onPress,
    showArrow,
    destructive,
  }: {
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    onPress?: () => void;
    showArrow?: boolean;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, destructive && styles.destructiveItem]}
      onPress={onPress}
      disabled={!onPress && !onValueChange}
      activeOpacity={0.7}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      
      <View style={styles.settingControl}>
        {onValueChange && (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#333', true: colors.primary }}
            thumbColor={value ? colors.accent : '#666'}
          />
        )}
        {showArrow && (
          <Text style={styles.arrow}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Platform-specific scrolling solution */}
      {Platform.OS === 'web' ? (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          overflowY: 'scroll',
          overflowX: 'hidden',
          backgroundColor: '#0a0a0a',
          padding: '0',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'auto',
          scrollbarColor: '#00ffff #333',
        }}>
          <div style={{ padding: '16px', paddingBottom: '20px' }}>
            {/* Profile Section */}
            <div style={{ marginBottom: '24px' }}>
              <Text style={styles.sectionTitle}>Profile</Text>
              <div style={{
                backgroundColor: '#1a1a2e',
                margin: '0 0 0 0',
                borderRadius: '12px',
                padding: '20px',
                border: '2px solid #00ffff',
              }}>
                <div style={{ alignItems: 'center', textAlign: 'center' }}>
                  <Text style={styles.profileName}>
                    {profile?.id ? `User ${profile.id.slice(0, 8)}` : 'Attention Wallet User'}
                  </Text>
                  <Text style={styles.profileEmail}>
                    {user?.email || 'No email available'}
                  </Text>
                  <Text style={styles.profileBalance}>
                    Current Balance: {balance} tokens
                  </Text>
                </div>
              </div>
            </div>

            {/* App Settings */}
            <div style={{ marginBottom: '24px' }}>
              <Text style={styles.sectionTitle}>App Settings</Text>
              <div style={{
                backgroundColor: '#1a1a2e',
                margin: '0 0 0 0',
                borderRadius: '12px',
                border: '1px solid #00ffff',
              }}>
                <SettingItem
                  title="Notifications"
                  subtitle="Receive quest reminders and updates"
                  value={notifications}
                  onValueChange={setNotifications}
                />
                <SettingItem
                  title="Sound Effects"
                  subtitle="Play sounds for actions and achievements"
                  value={soundEffects}
                  onValueChange={setSoundEffects}
                />
                <SettingItem
                  title="Animations"
                  subtitle="Enable visual animations and effects"
                  value={animations}
                  onValueChange={setAnimations}
                />
              </div>
            </div>

            {/* Parental Controls */}
            <div style={{ marginBottom: '24px' }}>
              <Text style={styles.sectionTitle}>Parental Controls</Text>
              <div style={{
                backgroundColor: '#1a1a2e',
                margin: '0 0 0 0',
                borderRadius: '12px',
                border: '1px solid #00ffff',
              }}>
                <SettingItem
                  title="Parental Controls"
                  subtitle="Require parent approval for certain actions"
                  value={parentalControls}
                  onValueChange={setParentalControls}
                />
                <SettingItem
                  title="Screen Time Limits"
                  subtitle="Manage daily usage limits"
                  showArrow
                  onPress={() => Alert.alert('Feature Coming Soon', 'Screen time management will be available in a future update.')}
                />
                <SettingItem
                  title="Content Filters"
                  subtitle="Control accessible content and apps"
                  showArrow
                  onPress={() => Alert.alert('Feature Coming Soon', 'Content filtering will be available in a future update.')}
                />
              </div>
            </div>

            {/* Data & Privacy */}
            <div style={{ marginBottom: '24px' }}>
              <Text style={styles.sectionTitle}>Data & Privacy</Text>
              <div style={{
                backgroundColor: '#1a1a2e',
                margin: '0 0 0 0',
                borderRadius: '12px',
                border: '1px solid #00ffff',
              }}>
                <SettingItem
                  title="Privacy Policy"
                  subtitle="View our privacy policy"
                  showArrow
                  onPress={() => Alert.alert('Privacy Policy', 'Privacy policy details would be displayed here.')}
                />
                <SettingItem
                  title="Terms of Service"
                  subtitle="View terms and conditions"
                  showArrow
                  onPress={() => Alert.alert('Terms of Service', 'Terms of service would be displayed here.')}
                />
                <SettingItem
                  title="Data Export"
                  subtitle="Export your data"
                  showArrow
                  onPress={() => Alert.alert('Feature Coming Soon', 'Data export will be available in a future update.')}
                />
              </div>
            </div>

            {/* Account Actions */}
            <div style={{ marginBottom: '24px' }}>
              <Text style={styles.sectionTitle}>Account</Text>
              <div style={{
                backgroundColor: '#1a1a2e',
                margin: '0 0 0 0',
                borderRadius: '12px',
                border: '1px solid #00ffff',
              }}>
                <SettingItem
                  title="Reset Progress"
                  subtitle="Clear all quest progress and achievements"
                  destructive
                  onPress={handleResetProgress}
                />
                <SettingItem
                  title="Sign Out"
                  subtitle="Sign out of your account"
                  destructive
                  onPress={handleSignOut}
                />
              </div>
            </div>

            {/* App Info */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                alignItems: 'center',
                textAlign: 'center',
                padding: '20px',
              }}>
                <Text style={styles.appName}>Attention Wallet</Text>
                <Text style={styles.appVersion}>Version 1.0.0</Text>
                <Text style={styles.appDescription}>
                  Gamified attention management for children
                </Text>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {profile?.id ? `User ${profile.id.slice(0, 8)}` : 'Attention Wallet User'}
                </Text>
                <Text style={styles.profileEmail}>
                  {user?.email || 'No email available'}
                </Text>
                <Text style={styles.profileBalance}>
                  Current Balance: {balance} tokens
                </Text>
              </View>
            </View>
          </View>

          {/* App Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Settings</Text>
            <View style={styles.settingsCard}>
              <SettingItem
                title="Notifications"
                subtitle="Receive quest reminders and updates"
                value={notifications}
                onValueChange={setNotifications}
              />
              <SettingItem
                title="Sound Effects"
                subtitle="Play sounds for actions and achievements"
                value={soundEffects}
                onValueChange={setSoundEffects}
              />
              <SettingItem
                title="Animations"
                subtitle="Enable visual animations and effects"
                value={animations}
                onValueChange={setAnimations}
              />
            </View>
          </View>

          {/* Parental Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parental Controls</Text>
            <View style={styles.settingsCard}>
              <SettingItem
                title="Parental Controls"
                subtitle="Require parent approval for certain actions"
                value={parentalControls}
                onValueChange={setParentalControls}
              />
              <SettingItem
                title="Screen Time Limits"
                subtitle="Manage daily usage limits"
                showArrow
                onPress={() => Alert.alert('Feature Coming Soon', 'Screen time management will be available in a future update.')}
              />
              <SettingItem
                title="Content Filters"
                subtitle="Control accessible content and apps"
                showArrow
                onPress={() => Alert.alert('Feature Coming Soon', 'Content filtering will be available in a future update.')}
              />
            </View>
          </View>

          {/* Data & Privacy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data & Privacy</Text>
            <View style={styles.settingsCard}>
              <SettingItem
                title="Privacy Policy"
                subtitle="View our privacy policy"
                showArrow
                onPress={() => Alert.alert('Privacy Policy', 'Privacy policy details would be displayed here.')}
              />
              <SettingItem
                title="Terms of Service"
                subtitle="View terms and conditions"
                showArrow
                onPress={() => Alert.alert('Terms of Service', 'Terms of service would be displayed here.')}
              />
              <SettingItem
                title="Data Export"
                subtitle="Export your data"
                showArrow
                onPress={() => Alert.alert('Feature Coming Soon', 'Data export will be available in a future update.')}
              />
            </View>
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.settingsCard}>
              <SettingItem
                title="Reset Progress"
                subtitle="Clear all quest progress and achievements"
                destructive
                onPress={handleResetProgress}
              />
              <SettingItem
                title="Sign Out"
                subtitle="Sign out of your account"
                destructive
                onPress={handleSignOut}
              />
            </View>
          </View>

          {/* App Info */}
          <View style={styles.section}>
            <View style={styles.appInfo}>
              <Text style={styles.appName}>Attention Wallet</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
              <Text style={styles.appDescription}>
                Gamified attention management for children
              </Text>
            </View>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,

  content: {
    flex: 1,
  } as ViewStyle,

  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  } as ViewStyle,

  section: {
    marginBottom: 24,
  } as ViewStyle,

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,

  profileCard: {
    backgroundColor: colors.cardBg,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  } as ViewStyle,

  profileInfo: {
    alignItems: 'center',
  } as ViewStyle,

  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  } as TextStyle,

  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  } as TextStyle,

  profileBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  } as TextStyle,

  settingsCard: {
    backgroundColor: colors.cardBg,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  } as ViewStyle,

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  } as ViewStyle,

  destructiveItem: {
    borderBottomColor: colors.error,
  } as ViewStyle,

  settingContent: {
    flex: 1,
  } as ViewStyle,

  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  } as TextStyle,

  destructiveText: {
    color: colors.error,
  } as TextStyle,

  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  } as TextStyle,

  settingControl: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  arrow: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
  } as TextStyle,

  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  } as ViewStyle,

  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  } as TextStyle,

  appVersion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  } as TextStyle,

  appDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
});

export default SettingsScreen;