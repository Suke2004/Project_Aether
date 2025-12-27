const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Ensure proper module resolution
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

module.exports = config;