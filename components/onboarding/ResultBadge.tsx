// ResultBadge - Analysis result badge component
// Used for onboarding demo

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

export type BadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ResultBadgeProps {
  label: string;
  value?: number | null;
  isTag?: boolean;
  position: BadgePosition;
  visible: boolean;
  delay?: number;
}

export function ResultBadge({
  label,
  value,
  isTag = false,
  position,
  visible,
  delay = 0,
}: ResultBadgeProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withDelay(
        delay,
        withSpring(1, { damping: 12, stiffness: 200 })
      );
      opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));

      // Yüzde animasyonu (değer varsa)
      if (value !== null && value !== undefined) {
        progress.value = withDelay(
          delay + 200,
          withTiming(value / 100, { duration: 800, easing: Easing.out(Easing.cubic) })
        );
      }
    } else {
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      progress.value = 0;
    }
  }, [visible, delay, value]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, 100])}%`,
  }));

  // Pozisyona göre stil
  const positionStyle = getPositionStyle(position);

  // Renk belirleme (yüzdeye göre)
  const getScoreColor = () => {
    if (value === null || value === undefined) return Colors.accent.primary;
    if (value >= 90) return Colors.accent.success;
    if (value >= 70) return Colors.accent.primary;
    if (value >= 50) return Colors.accent.warning;
    return Colors.accent.error;
  };

  const scoreColor = getScoreColor();

  if (isTag) {
    return (
      <Animated.View style={[styles.tagContainer, positionStyle, containerStyle]}>
        <View style={[styles.tagInner, { backgroundColor: Colors.accent.primarySoft }]}>
          <Text style={[styles.tagText, { color: Colors.accent.primary }]}>{t(label)}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, positionStyle, containerStyle]}>
      <View style={styles.badgeInner}>
        <Text style={styles.label}>{t(label)}</Text>
        <Text style={[styles.value, { color: scoreColor }]}>
          %{value ?? 0}
        </Text>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: scoreColor },
              progressBarStyle,
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

function getPositionStyle(position: BadgePosition) {
  switch (position) {
    case 'top-left':
      return { top: wp('1%'), left: 0 };
    case 'top-right':
      return { top: wp('1%'), right: 0 };
    case 'bottom-left':
      return { bottom: wp('1%'), left: 0 };
    case 'bottom-right':
      return { bottom: wp('1%'), right: 0 };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
  },
  badgeInner: {
    backgroundColor: Colors.card.primary,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: wp('24%'),
    ...Shadows.md,
  },
  label: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  value: {
    ...Typography.h3,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  tagContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  tagInner: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  },
  tagText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
