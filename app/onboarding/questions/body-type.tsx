// Body Type Question Screen - Beden tipi sorusu

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SafeContainer, Button } from '@/components/ui';
import { OnboardingProgress, OptionCard } from '@/components/onboarding';
import { useOnboardingContext } from '@/contexts';
import { BODY_TYPE_OPTIONS } from '@/constants/onboarding';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { BodyType } from '@/types/user';

export default function BodyTypeQuestionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { totalSteps, answers, updateAnswer, nextStep } = useOnboardingContext();

  const selectedBodyType = answers.bodyType;

  const handleSelect = (value: string) => {
    updateAnswer('bodyType', value as BodyType);
  };

  const handleContinue = () => {
    nextStep();
    router.push('/onboarding/questions/colors');
  };

  const handleBack = () => {
    router.back();
  };

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
      <OnboardingProgress currentStep={4} totalSteps={totalSteps} />

      {/* Title */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.titleContainer}>
        <Text style={styles.title}>{t('onboarding.questions.bodyType.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.questions.bodyType.subtitle')}</Text>
      </Animated.View>

      {/* Options */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {BODY_TYPE_OPTIONS.map((option, index) => (
          <OptionCard
            key={option.id}
            id={option.id}
            labelKey={option.labelKey}
            icon={option.icon}
            isSelected={selectedBodyType === option.value}
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
          disabled={!selectedBodyType}
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
