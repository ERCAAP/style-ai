// ColorPicker - Color selection grid for onboarding

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
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Animations,
} from '@/constants/theme';
import { OnboardingOption } from '@/types/onboarding';

interface ColorPickerProps {
  options: OnboardingOption[];
  selectedColors: string[];
  onSelect: (colorId: string) => void;
  minSelect?: number;
  maxSelect?: number;
}

interface ColorItemProps {
  option: OnboardingOption;
  isSelected: boolean;
  onPress: () => void;
  disabled: boolean;
  index: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ColorItem({ option, isSelected, onPress, disabled, index }: ColorItemProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled || isSelected) {
      scale.value = withSpring(0.9, Animations.spring);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animations.spring);
  };

  const isLight = option.color === '#FFFFFF' || option.color === '#D4C4B0';

  return (
    <Animated.View
      entering={FadeIn.delay(index * 30).duration(200)}
      style={styles.colorItemWrapper}
    >
      <AnimatedPressable
        style={[
          styles.colorItem,
          { backgroundColor: option.color },
          isLight && styles.colorItemLight,
          isSelected && styles.colorItemSelected,
          disabled && !isSelected && styles.colorItemDisabled,
          animatedStyle,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled && !isSelected}
      >
        {isSelected && (
          <View style={[styles.checkmark, isLight && styles.checkmarkLight]}>
            <Ionicons
              name="checkmark"
              size={16}
              color={isLight ? Colors.text.primary : Colors.text.white}
            />
          </View>
        )}
      </AnimatedPressable>
      <Text
        style={[styles.colorLabel, isSelected && styles.colorLabelSelected]}
        numberOfLines={1}
      >
        {t(option.labelKey)}
      </Text>
    </Animated.View>
  );
}

export function ColorPicker({
  options,
  selectedColors,
  onSelect,
  minSelect = 1,
  maxSelect = 5,
}: ColorPickerProps) {
  const { t } = useTranslation();
  const isMaxSelected = selectedColors.length >= maxSelect;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {options.map((option, index) => (
          <ColorItem
            key={option.id}
            option={option}
            isSelected={selectedColors.includes(option.value)}
            onPress={() => onSelect(option.value)}
            disabled={isMaxSelected}
            index={index}
          />
        ))}
      </View>

      <Text style={styles.hint}>
        {t('onboarding.questions.colors.hint')} ({selectedColors.length}/{maxSelect})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    maxWidth: '100%',
  },
  colorItemWrapper: {
    alignItems: 'center',
    width: 72,
  },
  colorItem: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  colorItemLight: {
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  colorItemSelected: {
    borderWidth: 3,
    borderColor: Colors.accent.primary,
    ...Shadows.glow,
  },
  colorItemDisabled: {
    opacity: 0.4,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkLight: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  colorLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  colorLabelSelected: {
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  hint: {
    ...Typography.bodySmall,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});

export default ColorPicker;
