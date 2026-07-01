// OnboardingProgress - Animated step progress indicator

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { OnboardingColors, Spacing, Animations } from '@/constants/theme';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

interface ProgressDotProps {
  isActive: boolean;
  isCompleted: boolean;
  index: number;
}

function ProgressDot({ isActive, isCompleted, index }: ProgressDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const width = withSpring(isActive ? 24 : 8, {
      damping: Animations.spring.damping,
      stiffness: Animations.spring.stiffness,
    });

    const backgroundColor = isCompleted
      ? OnboardingColors.stepCompleted
      : isActive
        ? OnboardingColors.stepActive
        : OnboardingColors.stepInactive;

    return {
      width,
      backgroundColor,
    };
  }, [isActive, isCompleted]);

  return (
    <Animated.View
      style={[styles.dot, animatedStyle]}
    />
  );
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  // currentStep is 1-indexed, convert to 0-indexed for comparison
  const currentIndex = currentStep - 1;

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <ProgressDot
          key={index}
          index={index}
          isActive={index === currentIndex}
          isCompleted={index < currentIndex}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

export default OnboardingProgress;
