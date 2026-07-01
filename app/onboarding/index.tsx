// Welcome Screen - Onboarding first screen

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import LottieView from 'lottie-react-native';
import { SafeContainer, Button } from '@/components/ui';
import { OnboardingProgress } from '@/components/onboarding';
import { useOnboardingContext, useReferral } from '@/contexts';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentStepIndex, totalSteps, nextStep, skipOnboarding } = useOnboardingContext();
  const { referrer } = useReferral();

  const handleContinue = () => {
    console.log('📊 Onboarding started', { referrer, step: 'welcome' });
    nextStep();
    router.push('/onboarding/features');
  };

  const handleSkip = async () => {
    console.log('📊 Onboarding skipped', { referrer, step: 'welcome' });
    await skipOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeContainer edges={['top', 'bottom']}>
      {/* Skip Button */}
      <Animated.View
        entering={FadeIn.delay(500)}
        style={styles.skipContainer}
      >
        <Button
          title={t('common.skip')}
          variant="ghost"
          size="sm"
          onPress={handleSkip}
        />
      </Animated.View>

      {/* Progress */}
      <OnboardingProgress currentStep={currentStepIndex + 1} totalSteps={totalSteps} />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo/Icon - Lottie Animation */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.logoContainer}
        >
          <LottieView
            source={require('@/assets/images/Onboarding-Animation/Hello World.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <Text style={styles.title}>{t('onboarding.welcome.title', { appName: t('app.name') })}</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <Text style={styles.subtitle}>{t('onboarding.welcome.subtitle')}</Text>
        </Animated.View>
      </View>

      {/* Bottom Button */}
      <Animated.View
        entering={FadeInUp.delay(500)}
        style={styles.bottomSection}
      >
        <Button
          title={t('onboarding.welcome.button')}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  logoContainer: {
    marginBottom: Spacing['3xl'],
    width: wp('60%'),
    height: wp('60%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});
