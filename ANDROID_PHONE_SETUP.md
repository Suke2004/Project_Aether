# Android Phone Setup Guide for Aether App

## 🚀 Quick Setup (5 Minutes)

### Step 1: Enable Developer Options
1. **Open Settings** on your Android phone
2. **Go to "About Phone"** (might be under System > About Phone)
3. **Find "Build Number"** and **tap it 7 times rapidly**
4. You'll see a message saying **"You are now a developer!"**

### Step 2: Enable USB Debugging
1. **Go back to main Settings**
2. **Find "Developer Options"** (usually under System or Advanced)
3. **Toggle "Developer Options" ON**
4. **Find "USB Debugging"** and **toggle it ON**
5. **Accept the warning dialog**

### Step 3: Connect Your Phone
1. **Connect your phone to your computer** using a USB cable
2. **On your phone**, you'll see a popup asking **"Allow USB Debugging?"**
3. **Check "Always allow from this computer"**
4. **Tap "OK"**

### Step 4: Install the App
```bash
# In your project directory (Aether folder)
npm run android
```

That's it! The app should install and launch on your phone automatically.

---

## 📱 Detailed Android Phone Setup

### Prerequisites on Your Computer
Make sure you have these installed:
```bash
# Check if you have Node.js
node --version  # Should be v16 or higher

# Check if you have Expo CLI
expo --version

# If not installed:
npm install -g @expo/cli
```

### Method 1: Direct Install via Expo (Recommended)

#### Option A: Using Expo Go App (Easiest)
1. **Install Expo Go** from Google Play Store
2. **Start the development server:**
   ```bash
   cd Aether
   npm start
   ```
3. **Scan the QR code** with your phone's camera or Expo Go app
4. **The app will load** in Expo Go

#### Option B: Development Build (Full Features)
1. **Enable Developer Options** (Steps 1-2 above)
2. **Connect phone via USB** (Step 3 above)
3. **Install the development build:**
   ```bash
   cd Aether
   npm run android
   ```

### Method 2: Install APK File

#### Build APK
```bash
# Install EAS CLI if you haven't
npm install -g eas-cli

# Login to Expo (create free account if needed)
eas login

# Build APK for your phone
eas build --platform android --profile development
```

#### Install APK on Phone
1. **Download the APK** from the link provided after build completes
2. **On your phone**, go to **Settings > Security**
3. **Enable "Install unknown apps"** for your browser/file manager
4. **Open the downloaded APK** and install it

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Device not found" or "No devices connected"
**Solution:**
```bash
# Check if your device is detected
adb devices

# If not listed, try:
adb kill-server
adb start-server
adb devices
```

### Issue 2: "Install unknown apps" blocked
**Solution:**
1. Go to **Settings > Apps & notifications**
2. Find your **browser or file manager**
3. Tap **"Install unknown apps"**
4. **Toggle it ON**

### Issue 3: App crashes on startup
**Solution:**
1. **Clear app data**: Settings > Apps > Aether > Storage > Clear Data
2. **Restart your phone**
3. **Reinstall the app**

### Issue 4: Camera not working
**Solution:**
1. Go to **Settings > Apps > Aether > Permissions**
2. **Enable Camera permission**
3. **Restart the app**

### Issue 5: "USB Debugging" option not visible
**Solution:**
1. Make sure you **tapped Build Number 7 times**
2. Look for **Developer Options** in:
   - Settings > System > Advanced > Developer Options
   - Settings > Additional Settings > Developer Options
   - Settings > Developer Options (directly)

---

## 📋 Testing Checklist

Once the app is installed, test these features:

### ✅ Basic Functionality
- [ ] App launches without crashing
- [ ] Navigation works (Home, Quests, Settings)
- [ ] UI elements are visible and properly sized

### ✅ Quest System
- [ ] Can see list of available quests
- [ ] Can tap on a quest to start it
- [ ] Camera opens when starting a quest
- [ ] Can take photos for quest verification
- [ ] Tokens are awarded after quest completion

### ✅ App Launcher
- [ ] Can see entertainment apps (YouTube, Netflix, etc.)
- [ ] Apps show as "available" (not "Not Available")
- [ ] Can tap apps to launch them
- [ ] Tokens are deducted when launching apps
- [ ] Apps open in browser or native app if installed

### ✅ Settings
- [ ] Can access settings page
- [ ] Can see user profile information
- [ ] Can toggle various settings
- [ ] Settings are saved properly

---

## 🎯 Specific Testing for Your Phone

### Test App Launching
1. **Go to Home screen** in the app
2. **Scroll down** to see the app launcher
3. **Try launching YouTube:**
   - Should either open YouTube app (if installed)
   - Or open YouTube in browser
   - Should deduct 5 tokens
4. **Try other apps** like Netflix, Spotify, etc.

### Test Quest System
1. **Go to Quests page** (tap 🎯 button)
2. **Pick a simple quest** like "📚 Read for 20 Minutes"
3. **Tap the quest** - should show completion dialog
4. **Tap "Mark as Complete"** (web testing mode)
5. **Should earn tokens** and see success message

### Test Scrolling
1. **All pages should scroll smoothly**
2. **Should see cyan scrollbars** on the right
3. **Trackpad/finger scrolling** should work
4. **No content should be cut off**

---

## 🔍 Advanced Setup (Optional)

### For Development/Debugging
```bash
# View real-time logs from your phone
adb logcat | grep -i "aether\|expo\|react"

# Install specific APK
adb install path/to/your/app.apk

# Uninstall app
adb uninstall host.exp.exponent

# Clear app data remotely
adb shell pm clear host.exp.exponent
```

### Performance Monitoring
```bash
# Monitor app performance
adb shell top | grep -i expo

# Check memory usage
adb shell dumpsys meminfo host.exp.exponent
```

---

## 📞 Need Help?

### Quick Fixes
1. **Restart your phone** - fixes 80% of issues
2. **Restart the development server** - `npm start`
3. **Clear app cache** - Settings > Apps > Aether > Storage > Clear Cache
4. **Reinstall the app** - `npm run android`

### Check These First
- ✅ Phone is connected via USB
- ✅ USB Debugging is enabled
- ✅ Developer Options are enabled
- ✅ Computer recognizes the phone (`adb devices`)
- ✅ Development server is running (`npm start`)

### Still Having Issues?
1. **Check the main SETUP.md** for general troubleshooting
2. **Look at the console output** for error messages
3. **Try the Expo Go method** if direct install fails
4. **Test on a different phone** if available

---

## 🎉 Success!

If everything is working, you should be able to:
- ✅ **Launch the app** on your Android phone
- ✅ **Navigate between screens** smoothly
- ✅ **Complete quests** and earn tokens
- ✅ **Launch entertainment apps** and spend tokens
- ✅ **See all features** working properly

**Your Android phone is now ready for testing the Aether app!** 🚀

---

*Last updated: December 2024*