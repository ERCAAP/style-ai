// OptionCard - Selectable option card for onboarding questions

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import {
  Colors,
  OnboardingColors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Animations,
} from '@/constants/theme';

interface OptionCardProps {
  id: string;
  labelKey: string;
  descriptionKey?: string;
  icon?: string;
  isSelected: boolean;
  onPress: () => void;
  delay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OptionCard({
  id,
  labelKey,
  descriptionKey,
  icon,
  isSelected,
  onPress,
  delay = 0,
}: OptionCardProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(Animations.scale.pressed, {
      damping: Animations.spring.damping,
      stiffness: Animations.spring.stiffness,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(Animations.scale.normal, {
      damping: Animations.spring.damping,
      stiffness: Animations.spring.stiffness,
    });
  };

  return (
    <Animated.View entering={FadeIn.delay(delay).duration(300)}>
      <AnimatedPressable
        style={[
          styles.container,
          isSelected && styles.containerSelected,
          animatedStyle,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {icon && (
          <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
            <Ionicons
              name={icon as any}
              size={28}
              color={isSelected ? Colors.accent.primary : Colors.text.secondary}
            />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={[styles.label, isSelected && styles.labelSelected]}>
            {t(labelKey)}
          </Text>
          {descriptionKey && (
            <Text style={styles.description}>{t(descriptionKey)}</Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={18} color={Colors.text.white} />
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OnboardingColors.optionBackground,
    borderWidth: 2,
    borderColor: OnboardingColors.optionBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 0,
  },
  containerSelected: {
    backgroundColor: OnboardingColors.optionBackgroundSelected,
    borderColor: OnboardingColors.optionBorderSelected,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconContainerSelected: {
    backgroundColor: Colors.accent.primarySoft,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  labelSelected: {
    color: Colors.accent.primary,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OptionCard;
