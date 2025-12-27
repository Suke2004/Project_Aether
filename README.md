# 🪙 Project Aether-Attention Wallet

**Revolutionary Token-Based Screen Time Management System**

Transform how families interact with technology through gamified digital wellness. Attention Wallet uses a token-based economy to manage screen time, where users earn tokens through productive activities and spend them on entertainment apps.

## 🚀 Key Features

### 🎯 **Token Economy System**
- **Precise Billing**: 5 tokens per minute (1 token every 12 seconds)
- **Integer-Only Consumption**: No fractional tokens, perfect synchronization
- **Real-Time Tracking**: Live token balance and usage monitoring
- **Automatic Cutoff**: Apps close when tokens run out

### 🎮 **Gamified Experience**
- **Quest System**: Earn tokens through productive challenges
- **Interactive Rewards**: Photo verification and task completion
- **Progress Tracking**: Visual feedback and achievement system
- **Family Dashboard**: Parent monitoring and control

### 📱 **Cross-Platform Support**
- **React Native**: Native mobile experience (iOS/Android)
- **Web Compatible**: Runs seamlessly in browsers
- **Offline-First**: Works without internet, syncs when connected
- **Real-Time Sync**: Instant updates across all devices

### 🎨 **Modern UI/UX**
- **Cyberpunk Theme**: Futuristic neon aesthetics
- **Smooth Animations**: Polished visual feedback
- **Responsive Design**: Adapts to all screen sizes
- **Accessibility**: Built with inclusive design principles

## 🛠️ Technology Stack

- **Frontend**: React Native + TypeScript + Expo
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Authentication**: Supabase Auth with role-based access
- **State Management**: React Context + Custom hooks
- **Styling**: StyleSheet with cyberpunk design system
- **Testing**: Jest + React Native Testing Library

## 📦 Quick Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g @expo/cli`
- Git for version control

### 1. Clone & Install
```bash
git clone <repository-url>
cd attention-wallet
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your Supabase credentials:
# EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
```bash
# Run the SQL scripts in /database/ folder:
# 1. schema.sql - Creates tables and functions
# 2. rls_policies.sql - Sets up security policies
```

### 4. Start Development
```bash
# Start the development server
npm start

# Or run on specific platforms:
npm run android    # Android emulator/device
npm run ios        # iOS simulator/device  
npm run web        # Web browser
```

## 🎯 How It Works

### For Children:
1. **Start with tokens** - Begin each day with allocated tokens
2. **Complete quests** - Earn more tokens through productive activities
3. **Spend on apps** - Use tokens to access entertainment (5 tokens/minute)
4. **Real-time tracking** - Watch token balance decrease as you use apps
5. **Automatic limits** - Apps close when tokens run out

### For Parents:
1. **Monitor usage** - Real-time dashboard showing all activity
2. **Set allowances** - Configure daily token allocations
3. **Create quests** - Design custom earning opportunities
4. **Review reports** - Detailed analytics and usage patterns
5. **Adjust settings** - Fine-tune the system for your family

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── WalletCard.tsx      # Token balance display
│   ├── AppLauncher.tsx     # Entertainment app grid
│   ├── StableTimer.tsx     # Synchronized timer system
│   └── QuestCam.tsx        # Photo verification
├── screens/             # Main app screens
│   ├── HomeScreen.tsx      # Child dashboard
│   ├── QuestScreen.tsx     # Quest completion
│   └── ParentDashboard.tsx # Parent controls
├── context/             # Global state management
│   ├── WalletContext.tsx   # Token management
│   ├── AuthContext.tsx     # User authentication
│   └── ThemeContext.tsx    # UI theming
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and helpers
└── database/            # SQL schema and policies
```

## 🎨 Design Philosophy

**Cyberpunk Aesthetic**: Neon colors, futuristic UI elements, and smooth animations create an engaging experience that makes screen time management feel like a game rather than a restriction.

**Token Economy**: By gamifying screen time with a token system, children learn valuable lessons about resource management, delayed gratification, and earning rewards through productive behavior.

**Family-Centered**: The system strengthens family bonds by encouraging communication about digital habits and providing parents with tools to guide rather than restrict.

## 🚀 Deployment

### Web Deployment
```bash
npm run build:web
# Deploy the web-build/ folder to your hosting service
```

### Mobile App Store
```bash
# Build for production
eas build --platform all

# Submit to app stores
eas submit --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Hackathon Innovation

**Attention Wallet** represents a paradigm shift in digital wellness:

- **Novel Approach**: First token-based screen time management system
- **Technical Excellence**: Precise synchronization and offline-first architecture  
- **Real-World Impact**: Addresses growing concerns about screen addiction
- **Family Solution**: Brings parents and children together around healthy tech use
- **Scalable Design**: Built for growth from family use to enterprise solutions

---

**Built with ❤️ for healthier digital relationships**

*Transform screen time from a battle into a collaborative journey toward digital wellness.*