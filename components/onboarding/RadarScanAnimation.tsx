// RadarScanAnimation - Radar tarama efekti bileşeni
// Analiz sırasında yukarıdan aşağı hareket eden scan çizgisi

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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

interface RadarScanAnimationProps {
  isActive: boolean;
  height: number;
  width: number;
}

export function RadarScanAnimation({ isActive, height, width }: RadarScanAnimationProps) {
  const scanPosition = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      // Opacity fade in
      opacity.value = withTiming(1, { duration: 300 });

      // Scan line yukarıdan aşağı hareket (loop)
      scanPosition.value = withRepeat(
        withTiming(1, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Sonsuz tekrar
        true // Geri git-gel
      );

      // Pulse effect
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Animasyonları durdur
      opacity.value = withTiming(0, { duration: 200 });
      cancelAnimation(scanPosition);
      cancelAnimation(pulseScale);
      scanPosition.value = 0;
      pulseScale.value = 1;
    }

    return () => {
      cancelAnimation(scanPosition);
      cancelAnimation(pulseScale);
    };
  }, [isActive]);

  // Scan çizgisi stili
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scanPosition.value, [0, 1], [0, height - 4]),
      },
    ],
  }));

  // Overlay stili
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.3,
  }));

  // Pulse glow stili
  const pulseGlowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  if (!isActive) return null;

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]} />

      {/* Scanning line */}
      <Animated.View style={[styles.scanLineContainer, scanLineStyle]}>
        <LinearGradient
          colors={['transparent', '#6366F1', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.scanLine}
        />
        {/* Glow effect */}
        <Animated.View style={[styles.scanGlow, pulseGlowStyle]}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0)', 'rgba(99, 102, 241, 0.25)', 'rgba(99, 102, 241, 0)']}
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
  scanLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
  },
  scanLine: {
    width: '100%',
    height: 2,
  },
  scanGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -20,
    height: 44,
  },
  scanGlowGradient: {
    width: '100%',
    height: '100%',
  },
});
