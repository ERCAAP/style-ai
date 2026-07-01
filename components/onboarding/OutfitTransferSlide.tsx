// OutfitTransferSlide - Kıyafet Transfer Demo Bileşeni
// Model üzerine kıyafet aktarımını gösteren interaktif demo

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
  FadeInUp,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Transfer fazları
export type TransferPhase =
  | 'initial'        // Başlangıç
  | 'show_model'     // Model gösteriliyor
  | 'outfit_entering' // Kıyafet sağdan geliyor
  | 'merging'        // Birleşme animasyonu
  | 'complete';      // Tamamlandı

// Timing konfigürasyonu (ms) - Optimize edilmiş dengeli hızlar
const PHASE_TIMING = {
  initial: 400,
  show_model: 700,       // Model gösterimi
  outfit_entering: 900,  // Kıyafet girişi
  merging: 900,          // Birleşme
};

interface OutfitTransferSlideProps {
  onPhaseChange?: (phase: TransferPhase) => void;
  autoStart?: boolean;
  skipToComplete?: boolean;
  modelImage: ImageSourcePropType;
  outfitImage: ImageSourcePropType;
  resultImage: ImageSourcePropType;
}

export function OutfitTransferSlide({
  onPhaseChange,
  autoStart = true,
  skipToComplete = false,
  modelImage,
  outfitImage,
  resultImage,
}: OutfitTransferSlideProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<TransferPhase>('initial');
  const [showCompleteMessage, setShowCompleteMessage] = useState(false);

  // Animasyon değerleri
  const modelOpacity = useSharedValue(0);
  const modelScale = useSharedValue(0.8);

  const outfitTranslateX = useSharedValue(SCREEN_WIDTH);
  const outfitOpacity = useSharedValue(0);
  const outfitScale = useSharedValue(0.7);

  const mergeProgress = useSharedValue(0);
  const resultOpacity = useSharedValue(0);

  const glowOpacity = useSharedValue(0);
  const statusTextOpacity = useSharedValue(0);

  // Faz değişikliğini bildir
  const handlePhaseChange = useCallback((newPhase: TransferPhase) => {
    setPhase(newPhase);
    onPhaseChange?.(newPhase);
  }, [onPhaseChange]);

  // Animasyon sekansını başlat
  useEffect(() => {
    if (!autoStart) return;

    const timeouts: number[] = [];

    // FAZ 1: Model göster
    const t1 = window.setTimeout(() => {
      runOnJS(handlePhaseChange)('show_model');

      modelOpacity.value = withTiming(1, { duration: PHASE_TIMING.show_model });
      modelScale.value = withTiming(1, {
        duration: PHASE_TIMING.show_model,
        easing: Easing.out(Easing.back(1.2))
      });
    }, PHASE_TIMING.initial);
    timeouts.push(t1);

    // FAZ 2: Kıyafet giriş
    const t2 = window.setTimeout(() => {
      runOnJS(handlePhaseChange)('outfit_entering');

      outfitOpacity.value = withTiming(1, { duration: 300 });
      outfitTranslateX.value = withTiming(0, {
        duration: PHASE_TIMING.outfit_entering,
        easing: Easing.out(Easing.cubic)
      });
      outfitScale.value = withTiming(1, {
        duration: PHASE_TIMING.outfit_entering,
        easing: Easing.out(Easing.cubic)
      });

      glowOpacity.value = withTiming(0.8, { duration: 400 });
      statusTextOpacity.value = withTiming(1, { duration: 300 });
    }, PHASE_TIMING.initial + PHASE_TIMING.show_model);
    timeouts.push(t2);

    // FAZ 3: Birleşme
    const t3 = window.setTimeout(() => {
      runOnJS(handlePhaseChange)('merging');

      mergeProgress.value = withTiming(1, {
        duration: PHASE_TIMING.merging,
        easing: Easing.inOut(Easing.ease)
      });

      statusTextOpacity.value = withTiming(0, { duration: 200 });

      // Model ve outfit fade out, result fade in - Daha hızlı geçiş
      modelOpacity.value = withDelay(150, withTiming(0, { duration: 350 }));
      outfitOpacity.value = withDelay(150, withTiming(0, { duration: 350 }));
      resultOpacity.value = withDelay(350, withTiming(1, { duration: 350 }));
    }, PHASE_TIMING.initial + PHASE_TIMING.show_model + PHASE_TIMING.outfit_entering);
    timeouts.push(t3);

    // FAZ 4: Tamamlandı
    const t4 = window.setTimeout(() => {
      runOnJS(handlePhaseChange)('complete');
      glowOpacity.value = withTiming(0.3, { duration: 300 });
    }, PHASE_TIMING.initial + PHASE_TIMING.show_model + PHASE_TIMING.outfit_entering + PHASE_TIMING.merging);
    timeouts.push(t4);

    return () => {
      timeouts.forEach(t => window.clearTimeout(t));
    };
  }, [autoStart]);

  // skipToComplete değiştiğinde animasyonu atla
  useEffect(() => {
    if (skipToComplete && phase !== 'complete') {
      modelOpacity.value = withTiming(0, { duration: 200 });
      outfitOpacity.value = withTiming(0, { duration: 200 });
      resultOpacity.value = withTiming(1, { duration: 200 });
      glowOpacity.value = withTiming(0.3, { duration: 200 });
      statusTextOpacity.value = withTiming(0, { duration: 100 });

      setPhase('complete');
      onPhaseChange?.('complete');
    }
  }, [skipToComplete]);

  // Complete mesajını göster ve 3 saniye sonra gizle
  useEffect(() => {
    if (phase === 'complete') {
      setShowCompleteMessage(true);
      const hideTimer = window.setTimeout(() => {
        setShowCompleteMessage(false);
      }, 3000);

      return () => window.clearTimeout(hideTimer);
    }
  }, [phase]);

  // Animasyonlu stiller
  const modelStyle = useAnimatedStyle(() => ({
    opacity: modelOpacity.value,
    transform: [{ scale: modelScale.value }],
  }));

  const outfitStyle = useAnimatedStyle(() => ({
    opacity: outfitOpacity.value,
    transform: [
      { translateX: outfitTranslateX.value },
      { scale: outfitScale.value }
    ],
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const statusTextStyle = useAnimatedStyle(() => ({
    opacity: statusTextOpacity.value,
  }));

  // Görsel boyutları
  const IMAGE_WIDTH = wp('55%');
  const IMAGE_HEIGHT = IMAGE_WIDTH * 1.33;

  const OUTFIT_WIDTH = IMAGE_WIDTH;
  const OUTFIT_HEIGHT = IMAGE_HEIGHT;

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{t('onboarding.outfitTransfer.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.outfitTransfer.subtitle')}</Text>
      </View>

      <View style={styles.demoSection}>
        <Animated.View style={[styles.glow, glowStyle, { width: IMAGE_WIDTH + 40, height: IMAGE_HEIGHT + 40 }]} />

        <Animated.View style={[styles.imageContainer, modelStyle, { width: IMAGE_WIDTH, height: IMAGE_HEIGHT }]}>
          <Image
            source={modelImage}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.outfitContainer, outfitStyle, { width: OUTFIT_WIDTH, height: OUTFIT_HEIGHT }]}>
          <View style={styles.outfitCard}>
            <Image
              source={outfitImage}
              style={styles.outfitImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Animated.View style={[styles.resultContainer, resultStyle, { width: IMAGE_WIDTH, height: IMAGE_HEIGHT }]}>
          <Image
            source={resultImage}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>

        {(phase === 'outfit_entering' || phase === 'merging') && (
          <Animated.View style={[styles.transferIcon, statusTextStyle]}>
            <Ionicons name="swap-horizontal" size={32} color={Colors.accent.primary} />
          </Animated.View>
        )}

        <Animated.View style={[styles.statusContainer, statusTextStyle]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{t('onboarding.outfitTransfer.transferring')}</Text>
        </Animated.View>

        {showCompleteMessage && (
          <Animated.View
            entering={FadeInUp.delay(200)}
            style={styles.completeMessage}
          >
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={24} color={Colors.text.white} />
            </View>
            <Text style={styles.completeText}>{t('onboarding.outfitTransfer.success')}</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: '90%',
  },
  demoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: hp('50%'),
  },
  glow: {
    position: 'absolute',
    backgroundColor: Colors.accent.primarySoft,
    borderRadius: wp('8%'),
    ...Shadows.glow,
  },
  imageContainer: {
    position: 'absolute',
    borderRadius: wp('6%'),
    backgroundColor: Colors.background.secondary,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  outfitContainer: {
    position: 'absolute',
  },
  outfitCard: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.card.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.md,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  resultContainer: {
    position: 'absolute',
    borderRadius: wp('6%'),
    backgroundColor: Colors.background.secondary,
    overflow: 'hidden',
  },
  transferIcon: {
    position: 'absolute',
    backgroundColor: Colors.card.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.md,
  },
  statusContainer: {
    position: 'absolute',
    bottom: -hp('8%'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent.primary,
    marginRight: Spacing.sm,
  },
  statusText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  completeMessage: {
    position: 'absolute',
    bottom: hp('5%'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  completeText: {
    ...Typography.body,
    color: Colors.success.main,
    fontWeight: '600',
  },
});
