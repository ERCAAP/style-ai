/**
 * EnhancedRadarScan - Production quality radar tarama animasyonu
 * Smooth git-gel hareketi, gradient scan line, pulse effects
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface EnhancedRadarScanProps {
  isActive: boolean;
  height: number;
  width: number;
}

export function EnhancedRadarScan({ isActive, height, width }: EnhancedRadarScanProps) {
  // Animasyon değerleri
  const scanPosition = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Smooth fade in
      opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });

      // Scan line - yumuşak git-gel hareketi
      scanPosition.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }), // Reset
          withTiming(1, {
            duration: 2200, // Daha yavaş, daha smooth
            easing: Easing.bezier(0.45, 0.05, 0.55, 0.95), // Custom smooth easing
          }),
          withTiming(0, {
            duration: 2200,
            easing: Easing.bezier(0.45, 0.05, 0.55, 0.95),
          })
        ),
        -1, // Sonsuz tekrar
        false
      );

      // Subtle pulse effect (çok daha yumuşak)
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, {
            duration: 1800,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          }),
          withTiming(1, {
            duration: 1800,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          })
        ),
        -1,
        false
      );

      // Glow intensity oscillation
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Smooth fade out
      opacity.value = withTiming(0, { duration: 400 });
      cancelAnimation(scanPosition);
      cancelAnimation(pulseScale);
      cancelAnimation(glowIntensity);
      scanPosition.value = 0;
      pulseScale.value = 1;
      glowIntensity.value = 0;
    }

    return () => {
      cancelAnimation(scanPosition);
      cancelAnimation(pulseScale);
      cancelAnimation(glowIntensity);
    };
  }, [isActive]);

  // Scan çizgisi - yumuşak hareket
  const scanLineStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scanPosition.value,
      [0, 1],
      [0, height - 6],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }],
      opacity: opacity.value,
    };
  });

  // Overlay - çok subtle
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.08, // Çok hafif
  }));

  // Pulse glow
  const pulseGlowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * glowIntensity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  // Frame pulse
  const framePulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.4,
    transform: [{ scale: pulseScale.value }],
  }));

  if (!isActive) return null;

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {/* Very subtle overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]} />

      {/* Pulsing frame glow */}
      <Animated.View style={[styles.frameGlow, framePulseStyle, { width, height }]} />

      {/* Scanning line with gradient */}
      <Animated.View style={[styles.scanLineContainer, scanLineStyle]}>
        <LinearGradient
          colors={['rgba(99, 102, 241, 0)', 'rgba(99, 102, 241, 0.9)', 'rgba(99, 102, 241, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.scanLine}
        />

        {/* Intense glow at scan line */}
        <Animated.View style={[styles.scanGlow, pulseGlowStyle]}>
          <LinearGradient
            colors={[
              'rgba(99, 102, 241, 0)',
              'rgba(99, 102, 241, 0.5)',
              'rgba(99, 102, 241, 0.3)',
              'rgba(99, 102, 241, 0)',
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.scanGlowGradient}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
    borderRadius: wp('5%'),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#6366F1',
  },
  frameGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: wp('5%'),
    borderWidth: 2,
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 4,
  },
  scanLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
  },
  scanLine: {
    width: '100%',
    height: 3,
  },
  scanGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -30,
    height: 66,
  },
  scanGlowGradient: {
    width: '100%',
    height: '100%',
  },
});
