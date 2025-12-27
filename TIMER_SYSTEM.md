# ⏱️ Real-Time Timer System

## Overview
The Aether app now features a **real-time timer system** that charges **5 tokens per minute** for app usage, replacing the old upfront payment system.

## How It Works

### 🚀 App Launch Process
1. **No Upfront Charge**: Apps no longer charge tokens when launched
2. **Timer Starts**: When an app launches successfully, a real-time timer begins
3. **Per-Minute Billing**: Every full minute of usage costs 5 tokens
4. **Automatic Deduction**: Tokens are deducted automatically every minute

### ⏰ Timer Features
- **Real-time Display**: Shows current session time, remaining time, and tokens spent
- **Background Monitoring**: Pauses when app goes to background, resumes when active
- **Low Balance Warnings**: Alerts when balance is running low
- **Automatic Shutdown**: Stops timer when balance is insufficient
- **Session Summary**: Shows total usage and cost when timer stops

### 💰 Token System
- **Cost**: 5 tokens per minute of usage
- **Minimum Balance**: Need at least 5 tokens to launch any app
- **Real-time Deduction**: Tokens deducted every 60 seconds
- **Balance Display**: Shows remaining minutes based on current balance

## Components

### TimerContext
- Manages active app sessions
- Handles real-time token deduction
- Monitors app state changes (background/foreground)
- Provides timer control functions

### TimerDisplay
- Floating timer widget showing active session
- Real-time updates every second
- Stop timer button with confirmation
- Progress bar and balance warnings

### Updated AppLauncher
- No upfront token charge
- Shows "tokens/min" instead of "tokens to start"
- Prevents multiple simultaneous sessions
- Integrates with timer system

## Usage Instructions

### For Users
1. **Launch App**: Tap any entertainment app (requires 5+ tokens)
2. **Timer Starts**: Real-time timer begins automatically
3. **Monitor Usage**: Check the floating timer display
4. **Stop Timer**: Return to app and tap stop button to end session

### For Developers
```typescript
// Use the timer context
const { activeSession, startAppTimer, stopAppTimer } = useTimer();

// Start a timer
startAppTimer(appConfig, tokensPerMinute);

// Stop the timer
stopAppTimer();

// Check session status
if (activeSession) {
  console.log(`${activeSession.appName} running for ${getSessionDuration()}ms`);
}
```

## Key Features

### ✅ Real-time Billing
- Charges exactly for time used
- No wasted tokens on failed launches
- Fair usage-based pricing

### ✅ Smart Monitoring
- Pauses when app goes to background
- Resumes when returning to foreground
- Prevents accidental overcharges

### ✅ User-Friendly Interface
- Clear timer display with remaining time
- Balance warnings before running out
- Easy stop timer functionality

### ✅ Session Management
- Only one app timer at a time
- Prevents conflicts between apps
- Clean session start/stop process

## Testing the System

1. **Start the app**: `npm run web`
2. **Switch to child role** using the dev panel
3. **Go to Home screen** and launch an entertainment app
4. **Watch the timer** in the floating display
5. **Observe token deduction** every minute
6. **Test stop functionality** by tapping the stop button

The timer system provides a fair, transparent, and engaging way to manage screen time while teaching children about time and resource management!