// AnimatedCard - Animated card component with press feedback

import React from 'react';
import { StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Shadows, Animations } from '@/constants/theme';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  delay?: number;
  entrance?: 'fade' | 'fadeUp' | 'fadeDown' | 'none';
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedCard({
  children,
  onPress,
  style,
  delay = 0,
  entrance = 'fadeUp',
  disabled = false,
}: AnimatedCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, Animations.spring);
    opacity.value = withTiming(0.9, { duration: Animations.timing.fast });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animations.spring);
    opacity.value = withTiming(1, { duration: Animations.timing.fast });
  };

  const getEntranceAnimation = () => {
    switch (entrance) {
      case 'fade':
        return FadeIn.delay(delay).duration(Animations.timing.normal);
      case 'fadeUp':
        return FadeInUp.delay(delay).duration(Animations.timing.normal);
      case 'fadeDown':
        return FadeInDown.delay(delay).duration(Animations.timing.normal);
      case 'none':
        return undefined;
      default:
        return FadeInUp.delay(delay).duration(Animations.timing.normal);
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onPress}
      entering={getEntranceAnimation()}
      style={[styles.card, animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

// Simple fade container
interface FadeContainerProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}

export function FadeContainer({ children, delay = 0, style }: FadeContainerProps) {
  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(Animations.timing.normal)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

// Slide up container
export function SlideUpContainer({ children, delay = 0, style }: FadeContainerProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(Animations.timing.normal)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card.primary,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
});

export default AnimatedCard;
