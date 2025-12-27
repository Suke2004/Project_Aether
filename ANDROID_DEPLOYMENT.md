# Android Deployment Guide for Aether

## Quick Start for Android

### 1. Install Dependencies
```bash
cd Aether
npm install
```

### 2. Set Up Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key  
# EXPO_PUBLIC_GEMINI_KEY=your_gemini_key
```

### 3. Run on Android Device/Emulator
```bash
# Start development server
npm start

# In Expo Go app, scan QR code
# OR run directly on connected device:
npm run android
```

## Android Device Requirements

### Minimum Requirements
- **Android Version**: 5.0 (API level 21) or higher
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 100MB free space
- **Camera**: Rear camera required for quest verification
- **Internet**: WiFi or mobile data connection

### Supported Devices
- **Phones**: All Android phones from 2015 onwards
- **Tablets**: Android tablets 7" and larger
- **Foldables**: Samsung Galaxy Fold, Google Pixel Fold, etc.
- **Android TV**: Limited support (camera features disabled)

## Building APK for Distribution

### Development APK (for testing)
```bash
# Install Expo CLI (not EAS CLI for basic usage)
npm install -g @expo/cli

# For building APKs, you can use Expo's online build service
# or set up local Android development environment

# Start development server
npm start

# Use Expo Go app to test, or connect Android device:
npm run android
```

### Production APK/AAB
```bash
# Build production APK for sideloading
eas build --platform android --profile preview

# Build AAB for Google Play Store
eas build --platform android --profile production
```

## Android-Specific Features

### Adaptive UI
- **Screen Density**: Automatically adapts to hdpi, xhdpi, xxhdpi, xxxhdpi
- **Screen Sizes**: Optimized for phones (4"-7") and tablets (7"+)
- **Orientation**: Portrait mode with responsive layouts
- **Dark Mode**: Follows system dark mode settings

### Performance Optimizations
- **Memory Management**: Efficient image loading and caching
- **Battery Optimization**: Minimal background processing
- **Network Handling**: Offline queue for poor connections
- **Camera Optimization**: Reduced quality on older devices

### Android Permissions
The app requests these permissions automatically:
- `CAMERA` - For quest photo verification
- `READ_EXTERNAL_STORAGE` - For accessing saved photos
- `WRITE_EXTERNAL_STORAGE` - For saving quest photos (Android < 10)
- `INTERNET` - For API communication
- `ACCESS_NETWORK_STATE` - For offline detection

## Testing on Different Android Versions

### Android 5.0-6.0 (API 21-23)
- Basic functionality supported
- Manual permission requests
- Reduced camera quality
- Simplified animations

### Android 7.0-9.0 (API 24-28)
- Full feature support
- Improved camera performance
- Better memory management
- Enhanced security

### Android 10+ (API 29+)
- Scoped storage support
- Enhanced privacy features
- Gesture navigation support
- Dark mode support

## Common Android Issues & Solutions

### Installation Issues
```bash
# Enable unknown sources
Settings > Security > Unknown Sources

# Install via ADB
adb install path/to/aether.apk

# Clear package installer cache
Settings > Apps > Package Installer > Storage > Clear Cache
```

### Camera Issues
```bash
# Check permissions
Settings > Apps > Aether > Permissions > Camera (Enable)

# Clear app cache
Settings > Apps > Aether > Storage > Clear Cache

# Restart app after permission grant
```

### Performance Issues
```bash
# Close background apps
Recent Apps > Close All

# Clear device cache
Settings > Storage > Cached Data > Clear

# Restart device if needed
```

### Network Issues
```bash
# Check internet connection
Settings > Network & Internet

# Clear app data (will reset login)
Settings > Apps > Aether > Storage > Clear Data

# Try different network (WiFi vs Mobile)
```

## Device-Specific Optimizations

### Samsung Devices
- Optimized for Samsung's One UI
- Support for Samsung DeX (desktop mode)
- Enhanced camera integration
- Battery optimization whitelist recommended

### Google Pixel Devices
- Native Android experience
- Enhanced camera features
- Adaptive brightness support
- Call screening integration disabled

### OnePlus Devices
- OxygenOS optimizations
- Gaming mode compatibility
- Fast charging awareness
- Zen mode integration

### Xiaomi/MIUI Devices
- MIUI permission handling
- Battery optimization settings
- Notification management
- Security app whitelist

## Publishing to Google Play Store

### 1. Prepare App Bundle
```bash
# Build production AAB
eas build --platform android --profile production

# Download AAB file from Expo dashboard
```

### 2. Google Play Console Setup
1. Create developer account at [play.google.com/console](https://play.google.com/console)
2. Pay $25 registration fee
3. Create new app listing
4. Upload AAB file
5. Complete store listing (description, screenshots, etc.)

### 3. Required Store Assets
- **App Icon**: 512x512 PNG
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: Phone (16:9, 9:16) and Tablet (16:10, 10:16)
- **Privacy Policy**: Required for apps with permissions
- **App Description**: Detailed feature list

### 4. Release Process
1. Upload AAB to Internal Testing
2. Test with internal testers
3. Promote to Closed Testing (optional)
4. Submit for Production review
5. Release to Production

## Monitoring & Analytics

### Crash Reporting
- Expo automatically reports crashes
- View reports in Expo dashboard
- Set up Sentry for detailed crash analysis

### Performance Monitoring
- Monitor app performance in Google Play Console
- Track ANR (Application Not Responding) rates
- Monitor battery usage statistics

### User Feedback
- Respond to Google Play Store reviews
- Monitor in-app feedback through error reporting
- Track user engagement metrics

## Maintenance & Updates

### Regular Updates
```bash
# Update dependencies
npm update

# Rebuild and test
npm test
eas build --platform android --profile production

# Submit update to Google Play
```

### Version Management
- Increment `versionCode` in app.json for each release
- Update `version` for feature releases
- Follow semantic versioning (1.0.0, 1.0.1, 1.1.0, etc.)

### Backward Compatibility
- Test on Android 5.0+ devices
- Maintain support for older API levels
- Graceful degradation for missing features
- Clear migration paths for data updates