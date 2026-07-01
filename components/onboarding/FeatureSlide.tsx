// FeatureSlide - Feature introduction slide for onboarding

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeatureSlideProps {
  titleKey: string;
  subtitleKey: string;
  icon: string;
  accentColor?: string;
}

export function FeatureSlide({
  titleKey,
  subtitleKey,
  icon,
  accentColor = Colors.accent.primary,
}: FeatureSlideProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Icon Container */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(500).springify()}
        style={styles.iconWrapper}
      >
        <LinearGradient
          colors={[accentColor, `${accentColor}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <View style={styles.iconInner}>
            <Ionicons name={icon as any} size={64} color={accentColor} />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Text Content */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(500)}
        style={styles.textContainer}
      >
        <Text style={styles.title}>{t(titleKey)}</Text>
        <Text style={styles.subtitle}>{t(subtitleKey)}</Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  iconWrapper: {
    marginBottom: Spacing['3xl'],
  },
  iconGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  iconInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.background.start,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.85,
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default FeatureSlide;
