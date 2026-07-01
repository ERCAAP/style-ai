// Complete Screen - Onboarding completion screen

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { SafeContainer, Button } from '@/components/ui';
import { useOnboardingContext, useReferral } from '@/contexts';
import {
  Colors,
  Typography,
  Spacing,
  Shadows,
  OnboardingGradients,
} from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CompleteScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { completeOnboarding, answers } = useOnboardingContext();
  const { referrer } = useReferral();

  // Celebration animation
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Scale animation
    scale.value = withSequence(
      withTiming(1.2, { duration: 300 }),
      withTiming(1, { duration: 200 })
    );

    // Subtle rotation animation
    rotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1500 }),
        withTiming(5, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handleComplete = async () => {
    try {
      console.log('📊 Onboarding completed', { referrer, step: 'complete' });
      await completeOnboarding();
      // Save user preferences to Firebase
      // This section can be moved to AuthContext
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Complete onboarding error:', error);
      router.replace('/(tabs)');
    }
  };

  // Summary of selected preferences
  const selectedStyles = answers.stylePreferences || [];
  const selectedStylesLabels = selectedStyles.map(style =>
    t(`onboarding.styles.${style}`)
  ).join(', ');
  const selectedColorsCount = answers.favoriteColors?.length || 0;
  const selectedGoalsCount = answers.usageGoals?.length || 0;

  return (
    <SafeContainer edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.iconWrapper}
        >
          <LinearGradient
            colors={OnboardingGradients.complete.colors}
            start={OnboardingGradients.complete.start}
            end={OnboardingGradients.complete.end}
            style={styles.iconGradient}
          >
            <Animated.View style={[styles.iconInner, animatedIconStyle]}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.accent.success} />
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <Text style={styles.title}>{t('onboarding.complete.title')}</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <Text style={styles.subtitle}>{t('onboarding.complete.subtitle')}</Text>
        </Animated.View>

        {/* Summary Card */}
        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryTitle}>{t('onboarding.complete.preferencesTitle')}</Text>

          {selectedStyles.length > 0 && (
            <View style={styles.summaryItem}>
              <Ionicons name="shirt-outline" size={20} color={Colors.accent.primary} />
              <Text style={styles.summaryText}>{t('onboarding.complete.styleLabel')}: {selectedStylesLabels}</Text>
            </View>
          )}

          {selectedColorsCount > 0 && (
            <View style={styles.summaryItem}>
              <Ionicons name="color-palette-outline" size={20} color={Colors.accent.primary} />
              <Text style={styles.summaryText}>{t('onboarding.complete.favoriteColorsLabel', { count: selectedColorsCount })}</Text>
            </View>
          )}

          {selectedGoalsCount > 0 && (
            <View style={styles.summaryItem}>
              <Ionicons name="flag-outline" size={20} color={Colors.accent.primary} />
              <Text style={styles.summaryText}>{t('onboarding.complete.usageGoalsLabel', { count: selectedGoalsCount })}</Text>
            </View>
          )}
        </Animated.View>

        {/* Decorative confetti-like elements */}
        <View style={styles.decorations}>
          <View style={[styles.dot, styles.dot1, { backgroundColor: Colors.accent.primary }]} />
          <View style={[styles.dot, styles.dot2, { backgroundColor: Colors.accent.success }]} />
          <View style={[styles.dot, styles.dot3, { backgroundColor: Colors.premium.start }]} />
          <View style={[styles.dot, styles.dot4, { backgroundColor: '#4A4A4A' }]} />
        </View>
      </View>

      {/* Bottom Button */}
      <Animated.View
        entering={FadeInUp.delay(500)}
        style={styles.bottomSection}
      >
        <Button
          title={t('onboarding.complete.button')}
          onPress={handleComplete}
          fullWidth
          size="lg"
          variant="primary"
          icon={<Ionicons name="sparkles" size={20} color={Colors.text.white} />}
          iconPosition="right"
        />
      </Animated.View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  content: {
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
    marginBottom: Spacing['2xl'],
  },
  summaryCard: {
    width: '100%',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  summaryTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  summaryText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  decorations: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.6,
  },
  dot1: {
    top: '15%',
    left: '10%',
  },
  dot2: {
    top: '20%',
    right: '15%',
  },
  dot3: {
    bottom: '30%',
    left: '20%',
  },
  dot4: {
    bottom: '25%',
    right: '10%',
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});
