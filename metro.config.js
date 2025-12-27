const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Ensure proper module resolution with Android priority
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Android-specific optimizations
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Optimize for Android devices
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Increase memory limit for Android builds
config.maxWorkers = 2;

// Enable hermes for better Android performance
config.transformer.hermesCommand = 'hermes';

module.exports = config;