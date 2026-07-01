// Style Question Screen - Stil tercihi sorusu

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SafeContainer, Button } from '@/components/ui';
import { OnboardingProgress, OptionCard } from '@/components/onboarding';
import { useOnboardingContext } from '@/contexts';
import { STYLE_OPTIONS } from '@/constants/onboarding';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { StylePreference } from '@/types/user';

export default function StyleQuestionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentStepIndex, totalSteps, answers, updateAnswer, nextStep } = useOnboardingContext();

  const selectedStyles = answers.stylePreferences || [];

  const handleSelect = (value: string) => {
    const style = value as StylePreference;
    const newStyles = selectedStyles.includes(style)
      ? selectedStyles.filter(s => s !== style)
      : [...selectedStyles, style];
    updateAnswer('stylePreferences', newStyles);
  };

  const handleContinue = () => {
    nextStep();
    router.push('/onboarding/questions/body-type');
  };

  return (
    <SafeContainer edges={['top', 'bottom']}>
      {/* Progress */}
      <OnboardingProgress currentStep={3} totalSteps={totalSteps} />

      {/* Title */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.titleContainer}>
        <Text style={styles.title}>{t('onboarding.questions.style.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.questions.style.subtitle')}</Text>
      </Animated.View>

      {/* Options */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {STYLE_OPTIONS.map((option, index) => (
          <OptionCard
            key={option.id}
            id={option.id}
            labelKey={option.labelKey}
            icon={option.icon}
            isSelected={selectedStyles.includes(option.value as StylePreference)}
            onPress={() => handleSelect(option.value)}
            delay={index * 50}
          />
        ))}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <Button
          title={t('common.continue')}
          onPress={handleContinue}
          fullWidth
          size="lg"
          disabled={selectedStyles.length === 0}
          icon={<Ionicons name="arrow-forward" size={20} color={Colors.text.white} />}
          iconPosition="right"
        />
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
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
  optionsContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
});
