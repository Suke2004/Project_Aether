# Project Aether: The Attention Wallet - Setup Guide

## Overview
Project Aether is a React Native/Expo application that implements an "Attention Wallet" system where children earn tokens by completing quests (chores, homework, etc.) and can spend those tokens on entertainment apps. The system uses AI verification through Google Gemini to validate quest completion.

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- A Supabase account
- A Google AI Studio account (for Gemini API)

## Installation

### 1. Clone and Install Dependencies
```bash
cd Aether

# Clean install to avoid dependency conflicts
rm -rf node_modules package-lock.json

# Install with legacy peer deps to resolve React version conflicts
npm install --legacy-peer-deps
```

**Note**: If you encounter dependency conflicts, see `install-android.md` for alternative installation methods.

### 2. Environment Setup
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your actual API keys:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GEMINI_KEY=your_gemini_api_key
   ```

### 3. Database Setup (Supabase)

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for initialization to complete
3. Go to Settings > API to get your project URL and anon key

#### Run Database Scripts
1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `database/schema.sql` and run it
3. Copy and paste the contents of `database/rls_policies.sql` and run it

### 4. Google Gemini AI Setup
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the key to your `.env` file

## Running the Application

### Development
```bash
npm start
```

### Platform-specific
```bash
npm run android    # Android (recommended for testing)
npm run ios        # iOS  
npm run web        # Web
```

### Android Development Setup
For the best Android development experience:

1. **Install Android Studio**:
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install Android SDK and build tools
   - Set up an Android Virtual Device (AVD) or connect a physical device

2. **Enable Developer Options on Physical Device**:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings > Developer Options
   - Enable "USB Debugging"

3. **Run on Android**:
   ```bash
   # Start the development server
   npm start
   
   # In another terminal, run on Android
   npm run android
   
   # Or build APK for testing
   npx eas build --platform android --profile preview
   ```

### Testing
```bash
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## Project Structure

```
Aether/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and services
│   ├── screens/        # Main app screens
│   └── __tests__/      # Test files
├── database/           # SQL scripts for Supabase
├── assets/             # Images and static assets
└── coverage/           # Test coverage reports
```

## Key Features

### For Children
- **Quest Completion**: Take photos to prove quest completion
- **AI Verification**: Google Gemini AI validates quest photos
- **Token Earning**: Earn tokens for completed quests
- **App Launcher**: Spend tokens to access entertainment apps
- **Balance Tracking**: View token balance and transaction history

### For Parents
- **Quest Management**: Create and manage custom quests
- **Child Monitoring**: View children's progress and spending
- **Manual Verification**: Override AI decisions when needed
- **Family Management**: Link parent and child accounts

### Technical Features
- **Offline Support**: Queue transactions when offline
- **Error Handling**: Comprehensive error recovery
- **Data Integrity**: Backup and corruption detection
- **Security**: Row-level security with Supabase
- **Cross-platform**: Works on iOS, Android, and Web

## Configuration

### App Settings (src/lib/config.ts)
- `tokenRate`: Tokens earned per minute (default: 5)
- `minConfidenceScore`: Minimum AI confidence for auto-approval (default: 70)
- `maxRetries`: Maximum API retry attempts (default: 3)
- `syncInterval`: Offline sync interval in ms (default: 30000)

### Entertainment Apps
The app includes pre-configured entertainment apps (YouTube, Netflix, Spotify, etc.). You can modify the list in `src/lib/config.ts`.

## Android-Specific Features

### Device Compatibility
The app is optimized for Android devices with:
- **Minimum SDK**: Android 5.0 (API level 21)
- **Target SDK**: Android 14 (API level 34)
- **Screen Sizes**: All sizes from small phones to tablets
- **Architectures**: ARM64, ARMv7, x86_64

### Android Optimizations
- **Responsive Design**: Automatically adapts to different screen sizes and densities
- **Performance**: Optimized for lower-end Android devices
- **Battery**: Efficient background processing and camera usage
- **Permissions**: Proper handling of Android permission system
- **Navigation**: Support for Android back button and gesture navigation

### Android-Specific Permissions
The app requests these permissions:
- **Camera**: For quest photo verification
- **Storage**: For saving and accessing photos
- **Internet**: For API communication
- **Network State**: For offline/online detection

### Building for Android

#### Development Build (APK)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build development APK
eas build --platform android --profile development
```

#### Production Build (AAB)
```bash
# Build production AAB for Google Play Store
eas build --platform android --profile production
```

### Android Testing
- **Emulator**: Use Android Studio AVD for testing
- **Physical Device**: Enable USB debugging for real device testing
- **Different Versions**: Test on Android 5.0+ for compatibility
- **Screen Sizes**: Test on phones and tablets

## Troubleshooting

### Android-Specific Issues

1. **"App not installed" error**
   - Enable "Install unknown apps" in device settings
   - Clear storage for Package Installer
   - Try installing via ADB: `adb install app.apk`

2. **Camera not working on Android**
   - Check camera permissions in Settings > Apps > Aether > Permissions
   - Restart the app after granting permissions
   - Test on physical device (emulator cameras may not work properly)

3. **Performance issues on older Android devices**
   - The app automatically optimizes for device capabilities
   - Disable animations in device settings if needed
   - Close other apps to free up memory

4. **Network issues on Android**
   - Check if device has internet connection
   - Try switching between WiFi and mobile data
   - Clear app cache in Settings > Apps > Aether > Storage

5. **Build errors**
   - Ensure Android SDK is properly installed
   - Update Android build tools to latest version
   - Clear Metro cache: `npx react-native start --reset-cache`

1. **"Missing environment variables"**
   - Ensure all required variables are set in `.env`
   - Restart the development server after changing `.env`

2. **Database connection errors**
   - Verify Supabase URL and keys are correct
   - Check that database scripts have been run
   - Ensure RLS policies are properly configured

3. **AI verification not working**
   - Verify Gemini API key is valid
   - Check network connectivity
   - Review error logs for specific issues

4. **Camera not working**
   - Ensure camera permissions are granted
   - Test on a physical device (camera doesn't work in simulators)

### Development Mode
The app includes a development mode that creates mock users and data when authentication fails. This is useful for testing without setting up full authentication.

## Testing

The project includes comprehensive tests:
- **Unit Tests**: Individual component and function tests
- **Integration Tests**: Full user flow testing
- **Build Verification**: Ensures the app builds correctly

Run tests with:
```bash
npm test
```

## Security Considerations

- Never commit real API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor for unusual transaction patterns
- Keep dependencies updated

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the database README (`database/README.md`)
3. Check test files for usage examples
4. Review the comprehensive error handling in `src/lib/errorHandling.ts`