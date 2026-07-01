// Colors Question Screen - Favori renkler sorusu

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SafeContainer, Button } from '@/components/ui';
import { OnboardingProgress, ColorPicker } from '@/components/onboarding';
import { useOnboardingContext } from '@/contexts';
import { COLOR_OPTIONS } from '@/constants/onboarding';
import { Colors, Typography, Spacing } from '@/constants/theme';

export default function ColorsQuestionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { totalSteps, answers, updateAnswer, nextStep } = useOnboardingContext();

  const selectedColors = answers.favoriteColors || [];

  const handleSelect = (colorValue: string) => {
    const newColors = selectedColors.includes(colorValue)
      ? selectedColors.filter(c => c !== colorValue)
      : [...selectedColors, colorValue];

    updateAnswer('favoriteColors', newColors);
  };

  const handleContinue = () => {
    nextStep();
    router.push('/onboarding/questions/goals');
  };

  const handleBack = () => {
    router.back();
  };

  const isValid = selectedColors.length >= 2 && selectedColors.length <= 5;

  return (
    <SafeContainer edges={['top', 'bottom']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Button
          title=""
          variant="ghost"
          size="sm"
          onPress={handleBack}
          icon={<Ionicons name="chevron-back" size={24} color={Colors.text.secondary} />}
        />
      </View>

      {/* Progress */}
      <OnboardingProgress currentStep={5} totalSteps={totalSteps} />

      {/* Title */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.titleContainer}>
        <Text style={styles.title}>{t('onboarding.questions.colors.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.questions.colors.subtitle')}</Text>
      </Animated.View>

      {/* Color Picker */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.colorPickerContainer}
        showsVerticalScrollIndicator={false}
      >
        <ColorPicker
          options={COLOR_OPTIONS}
          selectedColors={selectedColors}
          onSelect={handleSelect}
          minSelect={2}
          maxSelect={5}
        />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <Button
          title={t('common.continue')}
          onPress={handleContinue}
          fullWidth
          size="lg"
          disabled={!isValid}
          icon={<Ionicons name="arrow-forward" size={20} color={Colors.text.white} />}
          iconPosition="right"
        />
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  titleContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  colorPickerContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
});
