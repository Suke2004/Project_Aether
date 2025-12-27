/**
 * Hackathon Showcase Component
 * Highlights key features and innovations for presentation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ScrollView,
} from 'react-native';
import { FadeInView, SlideInView, AnimatedButton } from './AnimatedComponents';

const colors = {
  primary: '#00ffff',
  secondary: '#ff00ff',
  accent: '#ffff00',
  background: '#0a0a0a',
  cardBg: '#1a1a2e',
  success: '#00ff80',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
};

interface Feature {
  title: string;
  description: string;
  icon: string;
  highlight: boolean;
}

const FEATURES: Feature[] = [
  {
    title: 'Token-Based Screen Time',
    description: 'Revolutionary approach to managing digital attention through gamified tokens',
    icon: '🪙',
    highlight: true,
  },
  {
    title: 'Real-Time Usage Tracking',
    description: 'Precise per-second billing system that charges tokens based on actual app usage',
    icon: '⏱️',
    highlight: true,
  },
  {
    title: 'Quest-Based Earning',
    description: 'Interactive challenges that reward productive behavior with tokens',
    icon: '🎯',
    highlight: false,
  },
  {
    title: 'Cross-Platform Compatibility',
    description: 'Seamless experience across web, mobile, and desktop platforms',
    icon: '🌐',
    highlight: false,
  },
  {
    title: 'Parental Dashboard',
    description: 'Comprehensive monitoring and control system for parents',
    icon: '👨‍👩‍👧‍👦',
    highlight: false,
  },
  {
    title: 'Offline-First Architecture',
    description: 'Robust offline support with automatic sync when connection returns',
    icon: '📱',
    highlight: true,
  },
];

interface HackathonShowcaseProps {
  visible: boolean;
  onClose: () => void;
}

export const HackathonShowcase = ({ visible, onClose }: HackathonShowcaseProps) => {
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    if (visible) {
      const interval = setInterval(() => {
        setCurrentFeature((prev) => (prev + 1) % FEATURES.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <FadeInView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🏆 ATTENTION WALLET</Text>
          <Text style={styles.subtitle}>Hackathon Innovation Showcase</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>🚀 KEY INNOVATIONS</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>Core Features</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Platforms</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>100%</Text>
                <Text style={styles.statLabel}>Offline Support</Text>
              </View>
            </View>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>✨ FEATURE HIGHLIGHTS</Text>
            {FEATURES.map((feature, index) => (
              <SlideInView
                key={feature.title}
                direction="left"
                delay={index * 100}
                style={[
                  styles.featureCard,
                  feature.highlight && styles.highlightCard,
                  currentFeature === index && styles.activeCard,
                ]}
              >
                <View style={styles.featureHeader}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <Text style={[
                    styles.featureTitle,
                    feature.highlight && styles.highlightText,
                  ]}>
                    {feature.title}
                  </Text>
                </View>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
                {feature.highlight && (
                  <View style={styles.highlightBadge}>
                    <Text style={styles.highlightBadgeText}>INNOVATION</Text>
                  </View>
                )}
              </SlideInView>
            ))}
          </View>

          <View style={styles.techSection}>
            <Text style={styles.sectionTitle}>⚡ TECHNICAL EXCELLENCE</Text>
            <View style={styles.techGrid}>
              <View style={styles.techItem}>
                <Text style={styles.techTitle}>React Native</Text>
                <Text style={styles.techDesc}>Cross-platform mobile</Text>
              </View>
              <View style={styles.techItem}>
                <Text style={styles.techTitle}>TypeScript</Text>
                <Text style={styles.techDesc}>Type-safe development</Text>
              </View>
              <View style={styles.techItem}>
                <Text style={styles.techTitle}>Supabase</Text>
                <Text style={styles.techDesc}>Real-time backend</Text>
              </View>
              <View style={styles.techItem}>
                <Text style={styles.techTitle}>Expo</Text>
                <Text style={styles.techDesc}>Rapid deployment</Text>
              </View>
            </View>
          </View>

          <View style={styles.demoSection}>
            <Text style={styles.sectionTitle}>🎮 LIVE DEMO READY</Text>
            <Text style={styles.demoText}>
              Experience the future of digital wellness through gamified screen time management.
              Our token-based system transforms how families interact with technology.
            </Text>
            <AnimatedButton
              style={styles.demoButton}
              glowEffect={true}
              onPress={onClose}
            >
              <Text style={styles.demoButtonText}>START DEMO</Text>
            </AnimatedButton>
          </View>
        </ScrollView>
      </FadeInView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  container: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  } as ViewStyle,

  header: {
    padding: 24,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    alignItems: 'center',
  } as ViewStyle,

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  } as TextStyle,

  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  } as TextStyle,

  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  closeText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  } as TextStyle,

  content: {
    flex: 1,
    padding: 20,
  } as ViewStyle,

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
  } as TextStyle,

  statsSection: {
    marginBottom: 24,
  } as ViewStyle,

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  } as ViewStyle,

  statItem: {
    alignItems: 'center',
  } as ViewStyle,

  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
  } as TextStyle,

  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  } as TextStyle,

  featuresSection: {
    marginBottom: 24,
  } as ViewStyle,

  featureCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  } as ViewStyle,

  highlightCard: {
    borderColor: colors.accent,
    backgroundColor: '#2a2a0a',
  } as ViewStyle,

  activeCard: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,

  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  } as ViewStyle,

  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  } as TextStyle,

  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  } as TextStyle,

  highlightText: {
    color: colors.accent,
  } as TextStyle,

  featureDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  } as TextStyle,

  highlightBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  } as ViewStyle,

  highlightBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  } as TextStyle,

  techSection: {
    marginBottom: 24,
  } as ViewStyle,

  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  } as ViewStyle,

  techItem: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  } as ViewStyle,

  techTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  } as TextStyle,

  techDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,

  demoSection: {
    alignItems: 'center',
    paddingBottom: 20,
  } as ViewStyle,

  demoText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  } as TextStyle,

  demoButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  } as ViewStyle,

  demoButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  } as TextStyle,
});

export default HackathonShowcase;