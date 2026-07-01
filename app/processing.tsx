/**
 * Processing Screen - Outfit Try-On Transformation Animation
 * Production-quality phased animation system with P-IMAGE API integration
 * Phase 1: User photo entrance
 * Phase 2: Target outfits flying in
 * Phase 3: Frame and prepare
 * Phase 4: Blur + Radar scanning (API processing)
 * Phase 5: Complete and redirect
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FlyingImagesAnimation } from '@/components/processing/FlyingImagesAnimation';
import { EnhancedRadarScan } from '@/components/processing/EnhancedRadarScan';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as Haptics from 'expo-haptics';
import { generateOutfitTryOn, PImageStatus } from '@/services/api/pImageCloudService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type AnimationPhase = 'entering' | 'flying' | 'framing' | 'scanning' | 'completing';

function ProcessingScreenContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const userImageUri = params.userImageUri as string;
  const targetImageUris = params.targetImageUris
    ? JSON.parse(params.targetImageUris as string)
    : [];

  const [phase, setPhase] = useState<AnimationPhase>('entering');
  const [statusText, setStatusText] = useState(t('processing.status.preparing'));

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = React.useRef(true);

  // Prevent multiple API generation calls
  const hasStartedGeneration = React.useRef(false);
  const generationRequestKey = React.useRef<string | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Animation values
  const screenOpacity = useSharedValue(0);
  const userPhotoOpacity = useSharedValue(0);
  const userPhotoScale = useSharedValue(0.6);
  const userPhotoTranslateY = useSharedValue(80);
  const frameBorderWidth = useSharedValue(0);
  const frameBorderOpacity = useSharedValue(0);
  const frameGlowOpacity = useSharedValue(0);
  const blurOpacity = useSharedValue(0);
  const statusOpacity = useSharedValue(0);

  // Loading bar animation (goes left to right repeatedly)
  const loadingBarPosition = useSharedValue(-30);

  // User photo dimensions
  const PHOTO_WIDTH = wp('65%');
  const PHOTO_HEIGHT = PHOTO_WIDTH * 1.33;
  const PHOTO_CENTER_X = SCREEN_WIDTH / 2;
  const PHOTO_CENTER_Y = SCREEN_HEIGHT / 2 - hp('5%');

  // Phase callbacks
  const startFlyingPhase = useCallback(() => {
    setPhase('flying');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptics error:', error);
    }
  }, []);

  const startFramingPhase = useCallback(() => {
    setPhase('framing');

    // Scale down slightly for framing
    userPhotoScale.value = withTiming(0.88, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    // Frame border appears
    frameBorderWidth.value = withTiming(3, { duration: 400 });
    frameBorderOpacity.value = withTiming(1, { duration: 400 });
    frameGlowOpacity.value = withTiming(0.7, { duration: 500 });

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptics error:', error);
    }
  }, []);

  const startScanningPhase = useCallback(async () => {
    setPhase('scanning');
    setStatusText(t('processing.status.changing'));
    statusOpacity.value = withTiming(1, { duration: 300 });

    // Start loading bar animation (repeating left to right)
    loadingBarPosition.value = withRepeat(
      withTiming(100, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      true // reverse - goes back and forth
    );

    // Blur overlay
    blurOpacity.value = withTiming(0.12, { duration: 400 });

    // Subtle pulse during scanning
    const pulse = () => {
      userPhotoScale.value = withSequence(
        withTiming(0.90, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.88, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      );
    };
    pulse();

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Haptics error:', error);
    }

    // Start P-IMAGE API generation - AWAIT to catch errors
    await startAPIGeneration();
  }, []);

  // P-IMAGE API generation
  const startAPIGeneration = async () => {
    // Create unique key for this request
    const requestKey = `${userImageUri}_${JSON.stringify(targetImageUris)}`;

    // Check if we've already started generation for this exact request
    if (hasStartedGeneration.current && generationRequestKey.current === requestKey) {
      console.log('[P-IMAGE] Generation already started for this request, skipping duplicate call');
      return;
    }

    // Mark as started
    hasStartedGeneration.current = true;
    generationRequestKey.current = requestKey;
    console.log('[P-IMAGE] Starting generation (first call only)');

    try {
      const statusMessages = [
        t('processing.status.changing'),
        t('processing.status.applyingStyle'),
        t('processing.status.trying'),
        t('processing.status.finalizing'),
      ];

      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        if (!isMountedRef.current) {
          clearInterval(messageInterval);
          return;
        }
        messageIndex = (messageIndex + 1) % statusMessages.length;
        setStatusText(statusMessages[messageIndex]);
      }, 3000);

      const result = await generateOutfitTryOn(
        {
          userImageUri,
          clothingImageUris: targetImageUris,
          turbo: true,
        },
        (status: PImageStatus) => {
          // Update status based on API feedback (only if still mounted)
          if (!isMountedRef.current) return;

          if (status.status === 'completed' && status.imageUrl) {
            clearInterval(messageInterval);
            setStatusText(t('processing.status.completed'));
          } else if (status.status === 'failed') {
            clearInterval(messageInterval);
            setStatusText(t('processing.status.error'));
          }
        }
      );

      clearInterval(messageInterval);

      // Debug log to see what we got back
      console.log('Final result from generateOutfitTryOn:', JSON.stringify(result, null, 2));
      console.log('Checking navigation conditions:', {
        success: result.success,
        hasImageUrl: !!result.imageUrl,
        imageUrl: result.imageUrl,
        isMounted: isMountedRef.current,
      });

      if (result.success && result.imageUrl) {
        // Success - navigate to result screen
        console.log('SUCCESS! Navigating to result screen...');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          console.warn('Haptics error:', error);
        }
        setTimeout(() => {
          console.log('Executing navigation now...');
          router.replace({
            pathname: '/outfit-try-result',
            params: {
              imageUrl: result.imageUrl,
              userImageUri,
              targetImageUris: JSON.stringify(targetImageUris),
              predictionId: result.predictionId || '',
            },
          });
        }, 800);
      } else {
        console.log('FAILED! Not navigating. Showing error alert...');

        // Reset flag so user can retry
        hasStartedGeneration.current = false;
        generationRequestKey.current = null;

        // Error
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (error) {
          console.warn('Haptics error:', error);
        }

        // Better error message based on error type
        let errorMessage = result.error || t('processing.error.defaultMessage');
        let errorTitle = t('common.error');

        // Check for specific error types
        if (errorMessage.includes('zaman aşımı') || errorMessage.includes('timeout')) {
          errorTitle = t('processing.error.timeout.title');
          errorMessage = t('processing.error.timeout.message');
        } else if (errorMessage.includes('yüklenemedi') || errorMessage.includes('upload')) {
          errorTitle = t('processing.error.upload.title');
          errorMessage = t('processing.error.upload.message');
        } else if (errorMessage.includes('auth') || errorMessage.includes('Giriş')) {
          errorTitle = t('processing.error.auth.title');
          errorMessage = t('processing.error.auth.message');
        }

        Alert.alert(
          errorTitle,
          errorMessage,
          [
            {
              text: t('common.retry'),
              onPress: () => router.back(),
            },
            {
              text: t('common.home'),
              onPress: () => router.replace('/'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('API generation error:', error);

      // Reset flag on error so user can retry
      hasStartedGeneration.current = false;
      generationRequestKey.current = null;
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (hapticError) {
        console.warn('Haptics error:', hapticError);
      }

      // Better error handling
      let errorMessage = t('processing.error.unexpectedError');

      if (error?.message) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = t('processing.error.network');
        } else if (error.message.includes('timeout')) {
          errorMessage = t('processing.error.requestTimeout');
        }
      }

      Alert.alert(
        t('common.error'),
        errorMessage,
        [
          {
            text: t('common.retry'),
            onPress: () => router.back(),
          },
          {
            text: t('common.home'),
            onPress: () => router.replace('/'),
          },
        ]
      );
    }
  };

  // Animation choreography
  useEffect(() => {
    if (!userImageUri) {
      router.back();
      return;
    }

    // PHASE 1: Entering - Screen and user photo fade in
    screenOpacity.value = withTiming(1, { duration: 400 });

    const t1 = setTimeout(() => {
      userPhotoOpacity.value = withTiming(1, { duration: 500 });
      userPhotoTranslateY.value = withSpring(0, {
        damping: 14,
        stiffness: 100,
      });
      userPhotoScale.value = withSpring(1, {
        damping: 12,
        stiffness: 110,
      });
    }, 300);

    // PHASE 2: Flying - Trigger target images animation
    const t2 = setTimeout(() => {
      runOnJS(startFlyingPhase)();
    }, 1000);

    // PHASE 3: Framing (after flying completes)
    const t3 = setTimeout(() => {
      runOnJS(startFramingPhase)();
    }, 3200);

    // PHASE 4: Scanning (radar animation starts and API call begins)
    const t4 = setTimeout(() => {
      runOnJS(startScanningPhase)();
    }, 4000);

    // Cleanup timeouts on unmount to prevent memory leaks and crashes
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [userImageUri]);

  // Animated styles
  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const userPhotoContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: userPhotoTranslateY.value },
      { scale: userPhotoScale.value },
    ],
    opacity: userPhotoOpacity.value,
  }));

  const frameBorderStyle = useAnimatedStyle(() => ({
    borderWidth: frameBorderWidth.value,
    opacity: frameBorderOpacity.value,
  }));

  const frameGlowStyle = useAnimatedStyle(() => ({
    opacity: frameGlowOpacity.value,
  }));

  const blurOverlayStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  const statusStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
  }));

  // Calculate track width for loading bar animation
  const trackWidth = wp('85%') - (Spacing.xl * 2); // Status container width - padding

  const loadingBarStyle = useAnimatedStyle(() => {
    // Convert percentage to pixels
    const translateValue = (loadingBarPosition.value / 100) * trackWidth;
    return {
      transform: [{ translateX: translateValue }],
    };
  });

  const handleBack = () => {
    Alert.alert(
      t('processing.cancel.title'),
      t('processing.cancel.message'),
      [
        { text: t('processing.cancel.no'), style: 'cancel' },
        { text: t('processing.cancel.yes'), onPress: () => router.back(), style: 'destructive' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Animated.View style={[styles.container, screenStyle]}>
        {/* Gradient Background */}
        <LinearGradient
          colors={['#F8F9FF', '#FFFFFF', '#F8F9FF']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Main content area */}
        <View style={styles.mainContent}>
          {/* User Photo Container */}
          <View style={styles.photoSection}>
            {/* Frame glow effect */}
            <Animated.View
              style={[
                styles.frameGlow,
                frameGlowStyle,
                { width: PHOTO_WIDTH + 24, height: PHOTO_HEIGHT + 24 },
              ]}
            />

            {/* Frame border */}
            <Animated.View
              style={[
                styles.frameBorder,
                frameBorderStyle,
                { width: PHOTO_WIDTH + 10, height: PHOTO_HEIGHT + 10 },
              ]}
            />

            {/* User photo */}
            <Animated.View
              style={[
                styles.userPhotoContainer,
                userPhotoContainerStyle,
                { width: PHOTO_WIDTH, height: PHOTO_HEIGHT },
              ]}
            >
              <Image
                source={{ uri: userImageUri }}
                style={styles.userPhoto}
                resizeMode="cover"
              />

              {/* Blur overlay */}
              <Animated.View style={[styles.blurOverlay, blurOverlayStyle]} />

              {/* Enhanced Radar Scan */}
              <EnhancedRadarScan
                isActive={phase === 'scanning'}
                width={PHOTO_WIDTH}
                height={PHOTO_HEIGHT}
              />
            </Animated.View>
          </View>

          {/* Status text and loading bar */}
          <Animated.View style={[styles.statusSection, statusStyle]}>
            <View style={styles.statusContent}>
              <View style={styles.statusHeader}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{statusText}</Text>
              </View>

              {/* Animated loading bar (no percentage) */}
              <View style={styles.loadingBarContainer}>
                <View style={styles.loadingBarTrack}>
                  <Animated.View style={[styles.loadingBarFill, loadingBarStyle]} />
                </View>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Flying images animation */}
        <FlyingImagesAnimation
          images={targetImageUris}
          isActive={phase === 'flying' || phase === 'framing'}
          centerX={PHOTO_CENTER_X}
          centerY={PHOTO_CENTER_Y}
          onComplete={startFramingPhase}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    ...Shadows.sm,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('8%'),
  },
  frameGlow: {
    position: 'absolute',
    borderRadius: wp('6%'),
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    ...Shadows.glow,
  },
  frameBorder: {
    position: 'absolute',
    borderRadius: wp('5.5%'),
    borderColor: '#6366F1',
    backgroundColor: 'transparent',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  userPhotoContainer: {
    borderRadius: wp('5%'),
    overflow: 'hidden',
    backgroundColor: Colors.background.secondary,
    ...Shadows.lg,
  },
  userPhoto: {
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#6366F1',
  },
  statusSection: {
    position: 'absolute',
    bottom: hp('12%'),
    paddingHorizontal: Spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  statusContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
    width: wp('85%'),
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    justifyContent: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
    marginRight: Spacing.sm,
  },
  statusText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  loadingBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.background.secondary,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  loadingBarTrack: {
    width: '100%',
    height: '100%',
  },
  loadingBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '30%',
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
});

// Wrap with Error Boundary to catch and handle crashes gracefully
export default function ProcessingScreen() {
  const router = useRouter();

  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.container}>
            <LinearGradient
              colors={['#F8F9FF', '#FFFFFF', '#F8F9FF']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.mainContent}>
              <View style={{ alignItems: 'center', padding: Spacing.xl }}>
                <Ionicons name="alert-circle" size={64} color={Colors.accent.error} />
                <Text style={{ ...Typography.h2, marginTop: Spacing.lg, marginBottom: Spacing.md }}>
                  {t('processing.error.title')}
                </Text>
                <Text style={{ ...Typography.body, color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing.xl }}>
                  {t('processing.error.message')}
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#6366F1',
                    paddingVertical: Spacing.md,
                    paddingHorizontal: Spacing.xl,
                    borderRadius: BorderRadius.lg,
                  }}
                  onPress={() => {
                    resetError();
                    router.back();
                  }}
                >
                  <Text style={{ ...Typography.body, color: Colors.text.white, fontWeight: '600' }}>
                    {t('processing.error.back')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      )}
    >
      <ProcessingScreenContent />
    </ErrorBoundary>
  );
}
