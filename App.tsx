import React, { ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Context Providers
import { AuthProvider, useAuth } from './src/context';
import { WalletProvider } from './src/context';

// Screens
import { 
  HomeScreen, 
  QuestScreen, 
  LockScreen, 
  ParentDashboard 
} from './src/screens';

// Types
export type RootStackParamList = {
  Home: undefined;
  Quest: undefined;
  Lock: undefined;
  ParentDashboard: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
    
    // In production, you might want to log this to a crash reporting service
    Alert.alert(
      'Application Error',
      'An unexpected error occurred. The app will restart.',
      [
        {
          text: 'Restart',
          onPress: () => {
            this.setState({ hasError: false, error: undefined });
          },
        },
      ]
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Loading Component
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#00ff88" />
    <Text style={styles.loadingText}>Loading Attention Wallet...</Text>
  </View>
);

// Main Navigation Component
const AppNavigator: React.FC = () => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0a0a0a',
          },
          headerTintColor: '#00ff88',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          cardStyle: {
            backgroundColor: '#0a0a0a',
          },
        }}
      >
        {user && profile ? (
          // Authenticated screens
          <>
            {profile.role === 'child' ? (
              // Child screens
              <>
                <Stack.Screen 
                  name="Home" 
                  component={HomeScreen}
                  options={{ 
                    title: 'Attention Wallet',
                    headerShown: false 
                  }}
                />
                <Stack.Screen 
                  name="Quest" 
                  component={QuestScreen}
                  options={{ 
                    title: 'Complete Quest',
                    headerBackTitle: 'Back'
                  }}
                />
                <Stack.Screen 
                  name="Lock" 
                  component={LockScreen}
                  options={{ 
                    title: 'Earn More Tokens',
                    headerLeft: () => null, // Prevent going back when locked
                    gestureEnabled: false
                  }}
                />
              </>
            ) : (
              // Parent screens
              <Stack.Screen 
                name="ParentDashboard" 
                component={ParentDashboard}
                options={{ 
                  title: 'Parent Dashboard',
                  headerShown: false
                }}
              />
            )}
          </>
        ) : (
          // Authentication screens would go here
          // For now, showing loading as auth context handles sign-in
          <Stack.Screen 
            name="Home" 
            component={LoadingScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Main App Component
export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <WalletProvider>
            <View style={styles.container}>
              <StatusBar style="light" backgroundColor="#0a0a0a" />
              <AppNavigator />
            </View>
          </WalletProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#00ff88',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  errorTitle: {
    color: '#ff4444',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
