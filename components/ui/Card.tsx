import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadows, Gradients } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'gradient';
  pressable?: boolean;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Card({
  children,
  onPress,
  style,
  variant = 'default',
  pressable = true,
  disabled = false,
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (pressable && !disabled) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
    }
  };

  const handlePressOut = () => {
    if (pressable && !disabled) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    }
  };

  const handlePress = () => {
    if (onPress && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'elevated' && Shadows.md,
    variant === 'default' && Shadows.sm,
    disabled && styles.disabled,
    style,
  ];

  if (variant === 'gradient') {
    const content = (
      <LinearGradient
        colors={[...Gradients.subtle.colors]}
        start={Gradients.subtle.start}
        end={Gradients.subtle.end}
        style={[styles.card, Shadows.sm, style]}
      >
        {children}
      </LinearGradient>
    );

    if (onPress && pressable) {
      return (
        <AnimatedTouchable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          disabled={disabled}
          style={animatedStyle}
        >
          {content}
        </AnimatedTouchable>
      );
    }

    return content;
  }

  if (onPress && pressable) {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
        style={[animatedStyle, cardStyle]}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  elevated: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  disabled: {
    opacity: 0.6,
  },
});
