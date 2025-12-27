/**
 * Animated Components
 * Reusable animated components for smooth transitions and cyberpunk effects
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Fade In Animation Component
interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 300,
  delay = 0,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      {children}
    </Animated.View>
  );
};

// Slide In Animation Component
interface SlideInViewProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  distance?: number;
  style?: ViewStyle;
}

export const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  direction = 'up',
  duration = 300,
  delay = 0,
  distance = 50,
  style,
}) => {
  const slideAnim = useRef(new Animated.Value(distance)).current;
  const { dimensions } = useTheme();

  const getInitialValue = () => {
    switch (direction) {
      case 'left':
        return -distance;
      case 'right':
        return distance;
      case 'up':
        return distance;
      case 'down':
        return -distance;
      default:
        return distance;
    }
  };

  const getTransformStyle = () => {
    switch (direction) {
      case 'left':
      case 'right':
        return { translateX: slideAnim };
      case 'up':
      case 'down':
        return { translateY: slideAnim };
      default:
        return { translateY: slideAnim };
    }
  };

  useEffect(() => {
    slideAnim.setValue(getInitialValue());
    
    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [slideAnim, duration, delay, direction, distance]);

  return (
    <Animated.View
      style={[
        {
          transform: [getTransformStyle()],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Pulse Animation Component
interface PulseViewProps {
  children: React.ReactNode;
  duration?: number;
  minScale?: number;
  maxScale?: number;
  style?: ViewStyle;
}

export const PulseView: React.FC<PulseViewProps> = ({
  children,
  duration = 1000,
  minScale = 0.95,
  maxScale = 1.05,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(minScale)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: maxScale,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: minScale,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    pulse();
  }, [pulseAnim, duration, minScale, maxScale]);

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: pulseAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Glow Animation Component
interface GlowTextProps {
  children: string;
  style?: TextStyle;
  glowColor?: string;
  duration?: number;
}

export const GlowText: React.FC<GlowTextProps> = ({
  children,
  style,
  glowColor,
  duration = 2000,
}) => {
  const { colors, cyberpunkEffects } = useTheme();
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glow = () => {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: false,
        }),
      ]).start(() => glow());
    };

    glow();
  }, [glowAnim, duration]);

  const animatedGlowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [glowColor || colors.primary, 'transparent'],
  });

  return (
    <Animated.Text
      style={[
        style,
        {
          textShadowColor: animatedGlowColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10,
        },
      ]}
    >
      {children}
    </Animated.Text>
  );
};

// Animated Button Component
interface AnimatedButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  glowEffect?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  glowEffect = false,
  style,
  onPress,
  ...props
}) => {
  const { colors, spacing, borderRadius, shadows, commonStyles } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    if (glowEffect) {
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    if (glowEffect) {
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: borderRadius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };

    const sizeStyles = {
      small: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
      },
      medium: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
      },
      large: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: colors.primary,
        ...shadows.md,
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return [baseStyle, sizeStyles[size], variantStyles[variant]];
  };

  const animatedGlowStyle = glowEffect
    ? {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: glowAnim,
        shadowRadius: glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 20],
        }),
        elevation: glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 20],
        }),
      }
    : {};

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
        animatedGlowStyle,
      ]}
    >
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={0.8}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  color,
  style,
}) => {
  const { colors } = useTheme();
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = () => {
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        spinAnim.setValue(0);
        spin();
      });
    };

    spin();
  }, [spinAnim]);

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderWidth: 3,
          borderColor: 'transparent',
          borderTopColor: color || colors.primary,
          borderRadius: size / 2,
          transform: [{ rotate: rotation }],
        },
        style,
      ]}
    />
  );
};