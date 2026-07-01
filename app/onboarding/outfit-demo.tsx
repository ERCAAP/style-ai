// Outfit Demo Screen - Stage 3: Outfit analysis demo page

import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SafeContainer, Button } from '@/components/ui';
import { OnboardingProgress, AnalysisDemoSlide } from '@/components/onboarding';
import { useOnboardingContext } from '@/contexts';
import { Colors, Spacing } from '@/constants/theme';
import type { DemoResult } from '@/components/onboarding/AnalysisDemoSlide';

// Pink dress results
const OUTFIT_RESULTS: DemoResult[] = [
  { label: 'onboarding.demo.elegance', value: 98, position: 'top-left' },
  { label: 'onboarding.demo.harmony', value: 94, position: 'top-right' },
  { label: 'onboarding.demo.trend', value: 91, position: 'bottom-left' },
  { label: 'onboarding.demo.dateSuitable', value: null, position: 'bottom-right', isTag: true },
];

export default function OutfitDemoScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentStepIndex, totalSteps, nextStep, skipOnboarding } = useOnboardingContext();
  const [isComplete, setIsComplete] = useState(false);
  const [skipToComplete, setSkipToComplete] = useState(false);

  // When animation phase changes
  const handlePhaseChange = useCallback((phase: string) => {
    if (phase === 'complete') {
      setIsComplete(true);
    }
  }, []);

  // Go to next page (questions)
  const goToNextPage = useCallback(() => {
    nextStep();
    router.push('/onboarding/questions');
  }, [nextStep, router]);

  const handleContinue = () => {
    if (isComplete) {
      goToNextPage();
    } else {
      // Skip animation and proceed
      setSkipToComplete(true);
      setTimeout(() => {
        goToNextPage();
      }, 500);
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeContainer edges={['top', 'bottom']}>
      {/* Skip Button */}
      <View style={styles.skipContainer}>
        <Button
          title={t('common.skip')}
          variant="ghost"
          size="sm"
          onPress={handleSkip}
        />
      </View>

      {/* Progress */}
      <OnboardingProgress currentStep={currentStepIndex + 1} totalSteps={totalSteps} />

      {/* Outfit Demo */}
      <View style={styles.content}>
        <AnalysisDemoSlide
          autoStart={true}
          onPhaseChange={handlePhaseChange}
          skipToComplete={skipToComplete}
          mode="transform"
          clothesImage={require('@/assets/images/Onboarding-Assets/Clothes/c.webp')}
          resultModelImage={require('@/assets/images/Onboarding-Assets/Model/d.webp')}
          results={OUTFIT_RESULTS}
          titleKey="onboarding.features.analysis.title"
          subtitleKey="onboarding.features.analysis.subtitle"
        />
      </View>

      {/* Bottom Button */}
      <Animated.View
        entering={FadeInUp.delay(100)}
        style={styles.bottomSection}
      >
        <Button
          title={t('common.continue')}
          onPress={handleContinue}
          fullWidth
          size="lg"
          icon={<Ionicons name="arrow-forward" size={20} color={Colors.text.white} />}
          iconPosition="right"
        />
      </Animated.View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  skipContainer: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});
