// AnalysisDemoSlide - AI Style Analysis interactive demo component
// Used in onboarding features screen

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ResultBadge, BadgePosition } from './ResultBadge';
import { RadarScanAnimation } from './RadarScanAnimation';
import { AnalysisProgressBar } from './AnalysisProgressBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Analysis phases
export type AnalysisPhase =
  | 'initial'    // Initial
  | 'entering'   // Outfit entering from right (transform mode)
  | 'framing'    // Being framed
  | 'scanning'   // Radar scanning
  | 'transforming' // Transforming to model (transform mode)
  | 'revealing'  // Results appearing
  | 'complete';  // Completed

// Timing configuration (ms) - Optimized balanced speeds
const PHASE_TIMING = {
  initial: 300,      // Initial wait
  entering: 700,     // Outfit entrance
  framing: 600,      // Framing
  scanning: 1600,    // Scanning (as if AI is analyzing)
  transforming: 600, // Transformation
  revealing: 500,    // Results
};

// Demo result data
export interface DemoResult {
  label: string;
  value: number | null;
  position: BadgePosition;
  isTag?: boolean;
}

const DEFAULT_RESULTS: DemoResult[] = [
  { label: 'onboarding.demo.colorHarmony', value: 92, position: 'top-left' },
  { label: 'onboarding.demo.style', value: 88, position: 'top-right' },
  { label: 'onboarding.demo.season', value: 95, position: 'bottom-left' },
  { label: 'onboarding.demo.daily', value: null, position: 'bottom-right', isTag: true },
];

export type SlideMode = 'single' | 'transform';

interface AnalysisDemoSlideProps {
  onPhaseChange?: (phase: AnalysisPhase) => void;
  autoStart?: boolean;
  skipToComplete?: boolean;
  mode?: SlideMode;
  // For single mode
  modelImage?: ImageSourcePropType;
  // For transform mode
  clothesImage?: ImageSourcePropType;
  resultModelImage?: ImageSourcePropType;
  // Custom results
  results?: DemoResult[];
  // Custom title/subtitle
  titleKey?: string;
  subtitleKey?: string;
}

export function AnalysisDemoSlide({
  onPhaseChange,
  autoStart = true,
  skipToComplete = false,
  mode = 'single',
  modelImage,
  clothesImage,
  resultModelImage,
  results = DEFAULT_RESULTS,
  titleKey = 'onboarding.features.analysis.title',
  subtitleKey = 'onboarding.features.analysis.subtitle',
}: AnalysisDemoSlideProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<AnalysisPhase>('initial');

  // Animation values
  const imageScale = useSharedValue(1);
  const imageOpacity = useSharedValue(0);
  const frameBorderRadius = useSharedValue(wp('3%'));
  const frameBorderWidth = useSharedValue(0);
  const frameBorderOpacity = useSharedValue(0);
  const frameGlowOpacity = useSharedValue(0);
  const blurOpacity = useSharedValue(0);
  const statusTextOpacity = useSharedValue(0);

  // Additional animation values for transform mode
  const clothesTranslateX = useSharedValue(SCREEN_WIDTH);
  const clothesOpacity = useSharedValue(1);
  const modelOpacity = useSharedValue(0);

  // Notify phase change
  const handlePhaseChange = useCallback((newPhase: AnalysisPhase) => {
    setPhase(newPhase);
    onPhaseChange?.(newPhase);
  }, [onPhaseChange]);

  // Start animation sequence
  useEffect(() => {
    if (!autoStart) return;

    if (mode === 'transform') {
      // TRANSFORM MODE: Outfit comes from right, analyzed, transforms to model

      // PHASE 0: Initial - wait
      const enteringTimeout = setTimeout(() => {
        runOnJS(handlePhaseChange)('entering');

        // Outfit moves from right to center
        clothesTranslateX.value = withTiming(0, {
          duration: PHASE_TIMING.entering,
          easing: Easing.out(Easing.cubic)
        });
        imageOpacity.value = withTiming(1, { duration: 300 });
      }, PHASE_TIMING.initial);

      // PHASE 1: Framing
      const framingTimeout = setTimeout(() => {
        runOnJS(handlePhaseChange)('framing');

        imageScale.value = withTiming(0.85, { duration: PHASE_TIMING.framing, easing: Easing.out(Easing.cubic) });
        frameBorderRadius.value = withTiming(wp('8%'), { duration: PHASE_TIMING.framing });
        frameBorderWidth.value = withTiming(3, { duration: 200 });
        frameBorderOpacity.value = withTiming(1, { duration: 200 });
        frameGlowOpacity.value = withTiming(0.6, { duration: 300 });
      }, PHASE_TIMING.initial + PHASE_TIMING.entering);

      // PHASE 2: Scanning
      const scanningTimeout = setTimeout(() => {
        runOnJS(handlePhaseChange)('scanning');

        blurOpacity.value = withTiming(0.15, { duration: 300 });
        statusTextOpacity.value = withTiming(1, { duration: 200 });

        imageScale.value = withSequence(
          withTiming(0.88, { duration: 750, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.85, { duration: 750, easing: Easing.inOut(Easing.ease) })
        );
      }, PHASE_TIMING.initial + PHASE_TIMING.entering + PHASE_TIMING.framing);

      // PHASE 3: Transformation - outfit → model
      const transformingTimeout = setTimeout(() => {
        runOnJS(handlePhaseChange)('transforming');

        // Cross-fade: outfit disappears, model appears
        clothesOpacity.value = withTiming(0, { duration: PHASE_TIMING.transforming });
        modelOpacity.value = withTiming(1, { duration: PHASE_TIMING.transforming });
        blurOpacity.value = withTiming(0, { duration: 200 });
        statusTextOpacity.value = withTiming(0, { duration: 150 });
      }, PHASE_TIMING.initial + PHASE_TIMING.entering + PHASE_TIMING.framing + PHASE_TIMING.scanning);

      // PHASE 4: Results
      const revealingTimeout = setTimeout(() => {
        runOnJS(handlePhaseChange)('revealing');
      }, PHASE_TIMING.initial + PHASE_TIMING.entering + PHASE_TIMING.framing + PHASE_TIMING.scanning + PHASE_TIMING.transforming);

      // PHASE 5: Completed
      const completeTimeout = setTimeout(() => {
        runOnJS(handlePhaseChange)('complete');
      }, PHASE_TIMING.initial + PHASE_TIMING.entering + PHASE_TIMING.framing + PHASE_TIMING.scanning + PHASE_TIMING.transforming + PHASE_TIMING.revealing);

      return () => {
        clearTimeout(enteringTimeout);
        clearTimeout(framingTimeout);
        clearTimeout(scanningTimeout);
        clearTimeout(transformingTimeout);
        clearTimeout(revealingTimeout);
        clearTimeout(completeTimeout);
      };
    } else {
      // SINGLE MODE: Current behavior
      imageOpacity.value = withTiming(1, { duration: 300 });

      const framingTimeout = setTimeout(() => {
        runOnJS(handlePhaseChange)('framing');

        imageScale.value = withTiming(0.85, { duration: PHASE_TIMING.framing, easing: Easing.out(Easing.cubic) });
        frameBorderRadius.value = withTiming(wp('8%'), { duration: PHASE_TIMING.framing });
        frameBorderWidth.value = withTiming(3, { duration: 200 });
        frameBorderOpacity.value = withTiming(1, { duration: 200 });
        frameGlowOpacity.value = withTiming(0.6, { duration: 300 });
      }, PHASE_TIMING.initial);

      const scanningTimeout = setTimeout(() => {
        runOnJS(handlePhaseChange)('scanning');

        blurOpacity.value = withTiming(0.15, { duration: 300 });
        statusTextOpacity.value = withTiming(1, { duration: 200 });

        imageScale.value = withSequence(
          withTiming(0.88, { duration: 750, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.85, { duration: 750, easing: Easing.inOut(Easing.ease) })
        );
      }, PHASE_TIMING.initial + PHASE_TIMING.framing);

      const revealingTimeout = setTimeout(() => {
        runOnJS(handlePhaseChange)('revealing');

        blurOpacity.value = withTiming(0, { duration: 200 });
        statusTextOpacity.value = withTiming(0, { duration: 150 });
      }, PHASE_TIMING.initial + PHASE_TIMING.framing + PHASE_TIMING.scanning);

      const completeTimeout = setTimeout(() => {
        runOnJS(handlePhaseChange)('complete');
      }, PHASE_TIMING.initial + PHASE_TIMING.framing + PHASE_TIMING.scanning + PHASE_TIMING.revealing);

      return () => {
        clearTimeout(framingTimeout);
        clearTimeout(scanningTimeout);
        clearTimeout(revealingTimeout);
        clearTimeout(completeTimeout);
      };
    }
  }, [autoStart, mode]);

  // Skip animation when skipToComplete changes
  useEffect(() => {
    if (skipToComplete && phase !== 'complete') {
      imageScale.value = withTiming(0.85, { duration: 200 });
      imageOpacity.value = withTiming(1, { duration: 200 });
      frameBorderRadius.value = withTiming(wp('8%'), { duration: 200 });
      frameBorderWidth.value = withTiming(3, { duration: 200 });
      frameBorderOpacity.value = withTiming(1, { duration: 200 });
      frameGlowOpacity.value = withTiming(0.6, { duration: 200 });
      blurOpacity.value = withTiming(0, { duration: 100 });
      statusTextOpacity.value = withTiming(0, { duration: 100 });

      if (mode === 'transform') {
        clothesTranslateX.value = withTiming(0, { duration: 200 });
        clothesOpacity.value = withTiming(0, { duration: 200 });
        modelOpacity.value = withTiming(1, { duration: 200 });
      }

      setPhase('complete');
      onPhaseChange?.('complete');
    }
  }, [skipToComplete]);

  // Animated styles
  const imageContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: mode === 'transform' ? clothesTranslateX.value : 0 },
      { scale: imageScale.value },
    ],
    opacity: imageOpacity.value,
    borderRadius: frameBorderRadius.value,
  }));

  const frameBorderStyle = useAnimatedStyle(() => ({
    borderWidth: frameBorderWidth.value,
    opacity: frameBorderOpacity.value,
    borderRadius: frameBorderRadius.value,
    transform: [
      { translateX: mode === 'transform' ? clothesTranslateX.value : 0 },
      { scale: imageScale.value },
    ],
  }));

  const frameGlowStyle = useAnimatedStyle(() => ({
    opacity: frameGlowOpacity.value,
    borderRadius: frameBorderRadius.value,
    transform: [
      { translateX: mode === 'transform' ? clothesTranslateX.value : 0 },
      { scale: imageScale.value },
    ],
  }));

  const blurOverlayStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  const statusTextStyle = useAnimatedStyle(() => ({
    opacity: statusTextOpacity.value,
  }));

  // Additional styles for transform mode
  const clothesImageStyle = useAnimatedStyle(() => ({
    opacity: clothesOpacity.value,
  }));

  const modelImageStyle = useAnimatedStyle(() => ({
    opacity: modelOpacity.value,
  }));

  // Image dimensions - portrait aspect ratio (3:4)
  const IMAGE_WIDTH = wp('55%');
  const IMAGE_HEIGHT = IMAGE_WIDTH * 1.33;

  // Default images
  const defaultModelImage = require('@/assets/images/Onboarding-Assets/Model/a.webp');

  return (
    <View style={styles.container}>
      {/* Başlık */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{t(titleKey)}</Text>
        <Text style={styles.subtitle}>{t(subtitleKey)}</Text>
      </View>

      {/* Ana görsel alanı */}
      <View style={[styles.imageSection, { width: IMAGE_WIDTH + wp('35%'), height: IMAGE_HEIGHT + wp('20%') }]}>
        {/* Glow efekti */}
        <Animated.View style={[styles.frameGlow, frameGlowStyle, { width: IMAGE_WIDTH + 20, height: IMAGE_HEIGHT + 20 }]} />

        {/* Ana çerçeve */}
        <Animated.View style={[styles.frameBorder, frameBorderStyle, { width: IMAGE_WIDTH + 8, height: IMAGE_HEIGHT + 8 }]} />

        {/* Görsel container */}
        <Animated.View style={[styles.imageContainer, imageContainerStyle, { width: IMAGE_WIDTH, height: IMAGE_HEIGHT }]}>
          {mode === 'transform' ? (
            <>
              {/* Kıyafet görseli (flat lay) */}
              <Animated.View style={[StyleSheet.absoluteFill, clothesImageStyle]}>
                <Image
                  source={clothesImage || defaultModelImage}
                  style={styles.image}
                  resizeMode="contain"
                />
              </Animated.View>
              {/* Model görseli */}
              <Animated.View style={[StyleSheet.absoluteFill, modelImageStyle]}>
                <Image
                  source={resultModelImage || defaultModelImage}
                  style={styles.image}
                  resizeMode="contain"
                />
              </Animated.View>
            </>
          ) : (
            <Image
              source={modelImage || defaultModelImage}
              style={styles.image}
              resizeMode="contain"
            />
          )}

          {/* Blur overlay */}
          <Animated.View style={[styles.blurOverlay, blurOverlayStyle]} />

          {/* Radar scan efekti */}
          <RadarScanAnimation
            isActive={phase === 'scanning'}
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
          />
        </Animated.View>

        {/* Sonuç badge'leri */}
        {results.map((result, index) => (
          <ResultBadge
            key={result.label}
            label={result.label}
            value={result.value}
            position={result.position}
            isTag={result.isTag}
            visible={phase === 'complete' || phase === 'revealing'}
            delay={index * 150}
          />
        ))}

        {/* Analiz durumu metni ve progress bar */}
        <Animated.View style={[styles.statusContainer, statusTextStyle]}>
          <View style={styles.statusContent}>
            <View style={styles.statusHeader}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{t('analyzing.statusText')}</Text>
            </View>
            <AnalysisProgressBar
              isActive={phase === 'scanning'}
              width={IMAGE_WIDTH * 0.7}
            />
          </View>
        </Animated.View>

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
    maxWidth: '85%',
  },
  imageSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameGlow: {
    position: 'absolute',
    backgroundColor: Colors.accent.primarySoft,
    ...Shadows.glow,
  },
  frameBorder: {
    position: 'absolute',
    borderColor: Colors.accent.primary,
    backgroundColor: 'transparent',
  },
  imageContainer: {
    overflow: 'hidden',
    backgroundColor: Colors.background.secondary,
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.accent.primary,
  },
  statusContainer: {
    position: 'absolute',
    bottom: wp('5%'),
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : Colors.card.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Shadows.md,
  },
  statusContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
  },
});
