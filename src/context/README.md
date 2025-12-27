# Authentication Context Usage

## Overview

The `AuthContext` provides authentication functionality for the Attention Wallet system, including user sign up/in/out, session management, and role-based access control.

## Basic Usage

```tsx
import React from 'react';
import { AuthProvider, useAuth } from './context';

// Wrap your app with the AuthProvider
function App() {
  return (
    <AuthProvider>
      <YourAppComponents />
    </AuthProvider>
  );
}

// Use the authentication context in components
function LoginScreen() {
  const { signIn, signUp, isLoading } = useAuth();
  
  const handleSignIn = async () => {
    try {
      await signIn('user@example.com', 'password');
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };
  
  const handleSignUp = async () => {
    try {
      await signUp('user@example.com', 'password', 'child');
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };
  
  // Your UI components here
}
```

## Role-Based Access Control

```tsx
import { useAuth, withRoleAccess } from './context';

// Check roles in components
function SomeComponent() {
  const { hasRole, profile } = useAuth();
  
  if (hasRole('parent')) {
    return <ParentDashboard />;
  }
  
  return <ChildInterface />;
}

// Use HOC for role-based component access
const ParentOnlyComponent = withRoleAccess(ParentDashboard, 'parent');
const ChildOnlyComponent = withRoleAccess(ChildInterface, 'child');
```

## Available Functions

- `signIn(email, password)` - Sign in existing user
- `signUp(email, password, role)` - Create new user account
- `signOut()` - Sign out current user
- `hasRole(role)` - Check if user has specific role
- `isAuthenticated()` - Check if user is authenticated
- `refreshProfile()` - Refresh user profile from database

## State Properties

- `user` - Current Supabase user object
- `profile` - User profile with role and token data
- `isLoading` - Loading state for auth operations