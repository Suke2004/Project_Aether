/**
 * Demo Enhancements Component
 * Adds visual polish and demo-ready features for hackathon presentation
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';

// Cyberpunk color scheme
const colors = {
  primary: '#00ffff',
  secondary: '#ff00ff',
  accent: '#ffff00',
  background: '#0a0a0a',
  cardBg: '#1a1a2e',
  success: '#00ff80',
  error: '#ff0040',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
};

interface DemoEnhancementsProps {
  children: React.ReactNode;
  showParticles?: boolean;
  showGlow?: boolean;
}

export const DemoEnhancements = ({
  children,
  showParticles = true,
  showGlow = true,
}: DemoEnhancementsProps) => {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(Math.random() * 300),
      y: new Animated.Value(Math.random() * 600),
      opacity: new Animated.Value(Math.random()),
    }))
  ).current;

  useEffect(() => {
    if (showGlow) {
      const glow = () => {
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ]).start(() => glow());
      };
      glow();
    }

    if (showParticles) {
      const animateParticles = () => {
        const animations = particleAnims.map((particle) => {
          return Animated.loop(
            Animated.sequence([
              Animated.parallel([
                Animated.timing(particle.x, {
                  toValue: Math.random() * 300,
                  duration: 3000 + Math.random() * 2000,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.y, {
                  toValue: Math.random() * 600,
                  duration: 3000 + Math.random() * 2000,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.opacity, {
                  toValue: Math.random() * 0.8 + 0.2,
                  duration: 1500 + Math.random() * 1000,
                  useNativeDriver: true,
                }),
              ]),
            ])
          );
        });

        Animated.parallel(animations).start();
      };

      animateParticles();
    }
  }, [showGlow, showParticles, glowAnim, particleAnims]);

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.primary + '20', colors.primary + '60'],
  });

  return (
    <View style={styles.container}>
      {/* Background glow effect */}
      {showGlow && (
        <Animated.View
          style={[
            styles.backgroundGlow,
            {
              backgroundColor: glowColor,
            },
          ]}
        />
      )}

      {/* Floating particles */}
      {showParticles &&
        particleAnims.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                ],
                opacity: particle.opacity,
              },
            ]}
          />
        ))}

      {/* Main content */}
      <View style={styles.content}>{children}</View>

      {/* Demo watermark */}
      <View style={styles.watermark}>
        <Text style={styles.watermarkText}>HACKATHON DEMO</Text>
      </View>
    </View>
  );
};

// Floating notification component for demo
interface FloatingNotificationProps {
  message: string;
  type?: 'success' | 'info' | 'warning';
  visible: boolean;
}

export const FloatingNotification = ({
  message,
  type = 'info',
  visible,
}: FloatingNotificationProps) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 3 seconds
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 3000);
    }
  }, [visible, slideAnim, opacityAnim]);

  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.accent;
      default:
        return colors.primary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.notification,
        {
          backgroundColor: getTypeColor(),
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Text style={styles.notificationText}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,

  backgroundGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    zIndex: -1,
  } as ViewStyle,

  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 1.5,
    zIndex: -1,
  } as ViewStyle,

  content: {
    flex: 1,
    zIndex: 1,
  } as ViewStyle,

  watermark: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  } as ViewStyle,

  watermarkText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  } as TextStyle,

  notification: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  } as ViewStyle,

  notificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
    textAlign: 'center',
  } as TextStyle,
});

export default DemoEnhancements;