# Quick Android Setup Guide

## Step 1: Clean Installation

```bash
# Remove existing node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Or on Windows:
rmdir /s node_modules
del package-lock.json

# Install dependencies with legacy peer deps to avoid conflicts
npm install --legacy-peer-deps
```

## Step 2: Set Up Environment

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` file with your API keys:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_KEY=your_gemini_api_key
```

## Step 3: Install Expo CLI

```bash
# Install Expo CLI globally (use correct package name)
npm install -g @expo/cli

# Or if that fails, use the old package:
npm install -g expo-cli
```

## Step 4: Run on Android

### Option A: Using Expo Go App (Easiest)
1. Install "Expo Go" from Google Play Store on your Android device
2. Run: `npm start`
3. Scan the QR code with Expo Go app

### Option B: Direct Installation (Requires Android Studio)
1. Install Android Studio and set up Android SDK
2. Enable USB debugging on your Android device
3. Connect device via USB
4. Run: `npm run android`

## Step 5: Test the App

The app should now run on your Android device with:
- Camera functionality for quest verification
- Responsive design for your screen size
- Proper Android permissions handling
- Optimized performance for Android

## Troubleshooting

### If npm install fails:
```bash
# Try with force flag
npm install --force

# Or use yarn instead
npm install -g yarn
yarn install
```

### If Expo CLI installation fails:
```bash
# Try installing locally in project
npm install @expo/cli --save-dev
npx expo start
```

### If Android build fails:
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Or clear npm cache
npm cache clean --force
```

## Alternative: Use Expo Snack (Web-based)

If local installation continues to have issues, you can test the app online:

1. Go to [snack.expo.dev](https://snack.expo.dev)
2. Upload your project files
3. Test on Android device via Expo Go app
4. Download working project when ready

This bypasses all local dependency issues and lets you test immediately on Android.