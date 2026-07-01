// MiniAnalysisAnimation - Küçük analiz animasyonu (Ana sayfa için)
// Onboarding'teki AnalysisDemoSlide'dan esinlenilmiştir

import React, { useEffect } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '@/constants/theme';

interface MiniAnalysisAnimationProps {
  size?: number;
}

export function MiniAnalysisAnimation({
  size = 56,
}: MiniAnalysisAnimationProps) {
  // Animasyon değerleri
  const scanPosition = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const imageScale = useSharedValue(1);
  const frameOpacity = useSharedValue(0);

  useEffect(() => {
    // Frame glow animasyonu
    frameOpacity.value = withTiming(1, { duration: 300 });

    // Glow effect - pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Image subtle pulse
    imageScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Scan line animasyonu - yukarıdan aşağı (loop)
    scanPosition.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, {
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, { duration: 800 }) // Pause at bottom
      ),
      -1, // Sonsuz tekrar
      false
    );
  }, []);

  // Scan çizgisi stili
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scanPosition.value, [0, 1], [0, size - 3]),
      },
    ],
    opacity: interpolate(scanPosition.value, [0, 0.05, 0.95, 1], [0, 1, 1, 0]),
  }));

  // Glow stili
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Frame stili
  const frameStyle = useAnimatedStyle(() => ({
    opacity: frameOpacity.value,
  }));

  // Image container stili
  const imageContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background glow */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: size / 2,
          }
        ]}
      />

      {/* Frame border */}
      <Animated.View
        style={[
          styles.frameBorder,
          frameStyle,
          {
            width: size + 4,
            height: size + 4,
            borderRadius: (size + 4) * 0.22,
          }
        ]}
      />

      {/* Image container */}
      <Animated.View
        style={[
          styles.imageContainer,
          imageContainerStyle,
          {
            width: size,
            height: size,
            borderRadius: size * 0.22,
          }
        ]}
      >
        <Image
          source={require('@/assets/images/Onboarding-Assets/Model/a.webp')}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Scanning line */}
        <Animated.View style={[styles.scanLineContainer, scanLineStyle]}>
          <LinearGradient
            colors={['transparent', '#6366F1', '#6366F1', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scanLine}
          />
          {/* Glow effect on scan line */}
          <Animated.View style={[styles.scanGlow, glowStyle]}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0)', 'rgba(99, 102, 241, 0.38)', 'rgba(99, 102, 241, 0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.scanGlowGradient}
            />
          </Animated.View>
        </Animated.View>

        {/* Scan overlay */}
        <Animated.View style={[styles.scanOverlay, glowStyle]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  frameBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: 'transparent',
  },
  imageContainer: {
    overflow: 'hidden',
    backgroundColor: Colors.background.secondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  scanLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    top: 0,
  },
  scanLine: {
    width: '100%',
    height: '100%',
  },
  scanGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -12,
    height: 28,
  },
  scanGlowGradient: {
    width: '100%',
    height: '100%',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#6366F1',
    opacity: 0.08,
  },
});
