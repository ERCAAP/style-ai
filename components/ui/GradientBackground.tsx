import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, ViewStyle, View } from 'react-native';
import { Gradients, Colors } from '@/constants/theme';

interface GradientBackgroundProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'background' | 'card' | 'button' | 'premium' | 'subtle';
}

export function GradientBackground({
  children,
  style,
  variant = 'background',
}: GradientBackgroundProps) {
  // Ana sayfa için sarı-beyaz gradient
  if (variant === 'background') {
    return (
      <LinearGradient
        colors={['#FFFFFC', '#FFFFFE', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.gradient, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  const gradient = Gradients[variant];

  return (
    <LinearGradient
      colors={[...gradient.colors]}
      start={gradient.start}
      end={gradient.end}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  solid: {
    flex: 1,
    backgroundColor: Colors.background.start,
  },
});
