# Attention Wallet - Source Code Structure

This directory contains the source code for Project Aether: The Attention Wallet application.

## Directory Structure

```
src/
├── components/     # Reusable UI components
├── context/        # React Context providers for state management
├── hooks/          # Custom React hooks
├── lib/            # Core utilities, types, and configuration
├── screens/        # Main application screens
└── index.ts        # Main exports
```

## Core Files

### lib/
- `types.ts` - TypeScript interfaces for all data models
- `config.ts` - Environment configuration and app settings
- `utils.ts` - Utility functions used throughout the app
- `index.ts` - Centralized exports for the lib directory

## Key Dependencies

- **@supabase/supabase-js** - Backend database and authentication
- **@google/generative-ai** - AI-powered quest verification
- **@react-native-async-storage/async-storage** - Local data persistence
- **react-native-chart-kit** - Analytics charts for parent dashboard

## Environment Variables

The following environment variables must be configured in `.env`:

- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_PUBLIC_GEMINI_KEY` - Google Gemini API key

## Development Notes

- All TypeScript interfaces are defined in `lib/types.ts`
- Configuration constants are centralized in `lib/config.ts`
- Each directory has an `index.ts` file for clean imports
- The project follows React Native + Expo best practices