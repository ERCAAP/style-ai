// Goals Question Screen - Kullanim amaci sorusu

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SafeContainer, Button } from '@/components/ui';
import { OnboardingProgress, OptionCard } from '@/components/onboarding';
import { useOnboardingContext } from '@/contexts';
import { USAGE_GOAL_OPTIONS } from '@/constants/onboarding';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { UsageGoal } from '@/types/user';

export default function GoalsQuestionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { totalSteps, answers, updateAnswer, nextStep } = useOnboardingContext();

  const selectedGoals = answers.usageGoals || [];

  const handleSelect = (value: string) => {
    const goal = value as UsageGoal;
    const newGoals = selectedGoals.includes(goal)
      ? selectedGoals.filter(g => g !== goal)
      : [...selectedGoals, goal];

    updateAnswer('usageGoals', newGoals);
  };

  const handleContinue = () => {
    nextStep();
    router.push('/onboarding/complete');
  };

  const isValid = selectedGoals.length >= 1;

  return (
    <SafeContainer edges={['top', 'bottom']}>
      {/* Progress */}
      <OnboardingProgress currentStep={6} totalSteps={totalSteps} />

      {/* Title */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.titleContainer}>
        <Text style={styles.title}>{t('onboarding.questions.goals.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.questions.goals.subtitle', { appName: t('app.name') })}</Text>
        <Text style={styles.hint}>{t('onboarding.questions.goals.hint')}</Text>
      </Animated.View>

      {/* Options */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {USAGE_GOAL_OPTIONS.map((option, index) => (
          <OptionCard
            key={option.id}
            id={option.id}
            labelKey={option.labelKey}
            icon={option.icon}
            isSelected={selectedGoals.includes(option.value as UsageGoal)}
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
          disabled={!isValid}
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
  hint: {
    ...Typography.bodySmall,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
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
