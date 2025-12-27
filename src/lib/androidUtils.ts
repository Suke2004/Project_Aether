/**
 * Android-specific utilities for device compatibility
 * Handles various Android versions and device-specific requirements
 */

import { Platform, Dimensions, StatusBar } from 'react-native';
// import * as Device from 'expo-device'; // Commented out until expo-device is installed

export interface AndroidDeviceInfo {
  isAndroid: boolean;
  apiLevel: number | null;
  deviceType: string | null;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  hasNotch: boolean;
  statusBarHeight: number;
}

/**
 * Get comprehensive Android device information
 */
export const getAndroidDeviceInfo = (): AndroidDeviceInfo => {
  const { width, height } = Dimensions.get('window');
  const isAndroid = Platform.OS === 'android';
  
  // Calculate screen size category
  const screenSize = (() => {
    const minDimension = Math.min(width, height);
    if (minDimension < 320) return 'small';
    if (minDimension < 480) return 'medium';
    if (minDimension < 720) return 'large';
    return 'xlarge';
  })();

  // Estimate if device has notch (rough heuristic)
  const hasNotch = height / width > 2.0;

  return {
    isAndroid,
    apiLevel: isAndroid ? Platform.Version as number : null,
    deviceType: null, // Device.deviceType ? Device.deviceType.toString() : null,
    screenSize,
    hasNotch,
    statusBarHeight: StatusBar.currentHeight || 0,
  };
};

/**
 * Get Android-safe styles for different screen sizes
 */
export const getAndroidSafeStyles = () => {
  const deviceInfo = getAndroidDeviceInfo();
  
  return {
    // Safe area padding for different Android versions
    paddingTop: deviceInfo.isAndroid ? deviceInfo.statusBarHeight : 0,
    
    // Responsive font sizes
    fontSize: {
      small: deviceInfo.screenSize === 'small' ? 12 : 14,
      medium: deviceInfo.screenSize === 'small' ? 14 : 16,
      large: deviceInfo.screenSize === 'small' ? 16 : 18,
      xlarge: deviceInfo.screenSize === 'small' ? 18 : 20,
    },
    
    // Responsive spacing
    spacing: {
      xs: deviceInfo.screenSize === 'small' ? 4 : 8,
      sm: deviceInfo.screenSize === 'small' ? 8 : 12,
      md: deviceInfo.screenSize === 'small' ? 12 : 16,
      lg: deviceInfo.screenSize === 'small' ? 16 : 24,
      xl: deviceInfo.screenSize === 'small' ? 24 : 32,
    },
    
    // Touch target sizes (Android minimum 48dp)
    touchTarget: {
      minHeight: 48,
      minWidth: 48,
    },
  };
};

/**
 * Check if device supports specific features
 */
export const checkAndroidFeatureSupport = () => {
  const deviceInfo = getAndroidDeviceInfo();
  
  return {
    // Camera features
    supportsCamera2: (deviceInfo.apiLevel || 0) >= 21,
    supportsCameraX: (deviceInfo.apiLevel || 0) >= 21,
    
    // Storage features
    supportsScopedStorage: (deviceInfo.apiLevel || 0) >= 29,
    
    // UI features
    supportsEdgeToEdge: (deviceInfo.apiLevel || 0) >= 29,
    supportsGestureNavigation: (deviceInfo.apiLevel || 0) >= 29,
    
    // Network features
    supportsNetworkSecurityConfig: (deviceInfo.apiLevel || 0) >= 24,
  };
};

/**
 * Get optimized camera settings for Android devices
 */
export const getAndroidCameraSettings = () => {
  const deviceInfo = getAndroidDeviceInfo();
  const features = checkAndroidFeatureSupport();
  
  return {
    // Quality settings based on device capability
    quality: deviceInfo.screenSize === 'small' ? 0.7 : 0.8,
    
    // Aspect ratio based on screen
    aspectRatio: deviceInfo.hasNotch ? '16:9' : '4:3',
    
    // Flash settings
    flashMode: 'auto',
    
    // Focus settings
    autoFocus: true,
    
    // Optimization for older devices
    skipProcessing: (deviceInfo.apiLevel || 0) < 23,
  };
};

/**
 * Handle Android back button behavior
 */
export const handleAndroidBackButton = (onBack?: () => boolean) => {
  if (Platform.OS !== 'android') return;
  
  // This would typically be used with BackHandler
  // BackHandler.addEventListener('hardwareBackPress', onBack);
};

/**
 * Get Android-specific network configuration
 */
export const getAndroidNetworkConfig = () => {
  const features = checkAndroidFeatureSupport();
  
  return {
    // Use cleartext traffic only on older Android versions
    allowCleartextTraffic: !features.supportsNetworkSecurityConfig,
    
    // Timeout settings for different Android versions
    timeoutMs: features.supportsNetworkSecurityConfig ? 30000 : 60000,
    
    // Retry settings
    maxRetries: 3,
  };
};

/**
 * Optimize app performance for Android devices
 */
export const optimizeForAndroid = () => {
  const deviceInfo = getAndroidDeviceInfo();
  
  return {
    // Animation settings
    enableAnimations: deviceInfo.screenSize !== 'small',
    animationDuration: deviceInfo.screenSize === 'small' ? 200 : 300,
    
    // Image loading settings
    imageQuality: deviceInfo.screenSize === 'small' ? 0.6 : 0.8,
    enableImageCaching: true,
    
    // Memory management
    enableMemoryOptimization: (deviceInfo.apiLevel || 0) < 26,
    
    // Battery optimization
    enableBatteryOptimization: true,
  };
};

/**
 * Get Android-specific error messages
 */
export const getAndroidErrorMessages = () => {
  return {
    cameraPermission: 'Camera permission is required to take photos for quest verification. Please enable it in Settings > Apps > Aether > Permissions.',
    storagePermission: 'Storage permission is required to save photos. Please enable it in Settings > Apps > Aether > Permissions.',
    networkError: 'Network connection failed. Please check your internet connection and try again.',
    lowMemory: 'Device is low on memory. Please close other apps and try again.',
    oldAndroidVersion: 'This feature requires Android 6.0 or higher. Please update your device or use an alternative method.',
  };
};

export default {
  getAndroidDeviceInfo,
  getAndroidSafeStyles,
  checkAndroidFeatureSupport,
  getAndroidCameraSettings,
  handleAndroidBackButton,
  getAndroidNetworkConfig,
  optimizeForAndroid,
  getAndroidErrorMessages,
};