// MiniOutfitTryAnimation - Küçük kıyafet deneme animasyonu (Ana sayfa için)
// Merkezi dönüşüm kartı ile smooth animasyon - Tek sefer çalar

import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface MiniOutfitTryAnimationProps {
  size?: number;
}

// Timing configuration (ms)
const TIMING = {
  initial: 400,
  showModel: 700,
  cardAppear: 500,
  cardPulse: 300,
  swapAppear: 400,
  transform: 800,
  showResult: 700,
};

export function MiniOutfitTryAnimation({
  size = 56,
}: MiniOutfitTryAnimationProps) {
  const [hasPlayed, setHasPlayed] = useState(false);

  // Animation values
  // Model B (başlangıç - mavi pijama)
  const modelBOpacity = useSharedValue(0);
  const modelBScale = useSharedValue(0.9);

  // Center card (kıyafet kartı - ortada)
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.3);
  const cardRotate = useSharedValue(0);

  // Swap icon (değişim ikonu - ortada)
  const swapOpacity = useSharedValue(0);
  const swapScale = useSharedValue(0.5);
  const swapRotate = useSharedValue(0);

  // Transform effect (shimmer/glow)
  const transformGlow = useSharedValue(0);
  const transformProgress = useSharedValue(0);

  // Model C (final - beyaz elbise) - Son halinde kalacak
  const modelCOpacity = useSharedValue(0);
  const modelCScale = useSharedValue(0.9);

  const glowOpacity = useSharedValue(0.12);

  // Animation - sadece bir kez çalar
  const startAnimation = useCallback(() => {
    if (hasPlayed) return;

    const timeouts: NodeJS.Timeout[] = [];

    // PHASE 1: Show Model B (başlangıç modeli)
    const t1 = setTimeout(() => {
      modelBOpacity.value = withTiming(1, {
        duration: TIMING.showModel,
        easing: Easing.out(Easing.cubic)
      });
      modelBScale.value = withTiming(1, {
        duration: TIMING.showModel,
        easing: Easing.out(Easing.back(1.15))
      });
      glowOpacity.value = withTiming(0.2, { duration: 400 });
    }, TIMING.initial);
    timeouts.push(t1);

    // PHASE 2: Center card appears (kıyafet kartı ortada belirir)
    const t2 = setTimeout(() => {
      cardOpacity.value = withTiming(1, {
        duration: TIMING.cardAppear,
        easing: Easing.out(Easing.cubic)
      });
      cardScale.value = withSequence(
        withTiming(1.1, {
          duration: TIMING.cardAppear,
          easing: Easing.out(Easing.cubic)
        }),
        withTiming(1, {
          duration: TIMING.cardPulse,
          easing: Easing.inOut(Easing.ease)
        })
      );

      // Hafif rotation efekti
      cardRotate.value = withSequence(
        withTiming(3, { duration: TIMING.cardAppear / 2 }),
        withTiming(0, { duration: TIMING.cardAppear / 2 })
      );

      glowOpacity.value = withTiming(0.35, { duration: 300 });
    }, TIMING.initial + TIMING.showModel);
    timeouts.push(t2);

    // PHASE 3: Swap icon appears (değişim ikonu ortada belirir)
    const t3 = setTimeout(() => {
      swapOpacity.value = withTiming(1, {
        duration: TIMING.swapAppear,
        easing: Easing.out(Easing.back(1.3))
      });
      swapScale.value = withSequence(
        withTiming(1.2, {
          duration: TIMING.swapAppear,
          easing: Easing.out(Easing.back(1.3))
        }),
        withTiming(1, {
          duration: 200,
          easing: Easing.inOut(Easing.ease)
        })
      );

      glowOpacity.value = withTiming(0.4, { duration: 300 });
    }, TIMING.initial + TIMING.showModel + TIMING.cardAppear + TIMING.cardPulse);
    timeouts.push(t3);

    // PHASE 4: Transformation begins (swap icon rotates, transform starts)
    const t4 = setTimeout(() => {
      // Swap icon rotating animation
      swapRotate.value = withSequence(
        withTiming(180, {
          duration: TIMING.transform * 0.6,
          easing: Easing.inOut(Easing.cubic)
        }),
        withTiming(360, {
          duration: TIMING.transform * 0.4,
          easing: Easing.inOut(Easing.cubic)
        })
      );

      transformGlow.value = withSequence(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
      );

      transformProgress.value = withTiming(1, {
        duration: TIMING.transform,
        easing: Easing.inOut(Easing.cubic)
      });

      glowOpacity.value = withTiming(0.5, { duration: 300 });
    }, TIMING.initial + TIMING.showModel + TIMING.cardAppear + TIMING.cardPulse + TIMING.swapAppear);
    timeouts.push(t4);

    // PHASE 5: Cross-fade transformation (model B → model C)
    const t5 = setTimeout(() => {
      modelBOpacity.value = withTiming(0, {
        duration: TIMING.transform * 0.6
      });
      modelBScale.value = withTiming(0.95, {
        duration: TIMING.transform * 0.6
      });

      cardOpacity.value = withTiming(0, {
        duration: TIMING.transform * 0.7
      });
      cardScale.value = withTiming(1.3, {
        duration: TIMING.transform * 0.7
      });

      swapOpacity.value = withTiming(0, {
        duration: TIMING.transform * 0.5
      });

      // Model C belirir ve KALICI OLARAK GÖRÜNÜR KALIR
      modelCOpacity.value = withDelay(TIMING.transform * 0.3, withTiming(1, {
        duration: TIMING.showResult,
        easing: Easing.out(Easing.cubic)
      }));
      modelCScale.value = withDelay(TIMING.transform * 0.3, withTiming(1, {
        duration: TIMING.showResult,
        easing: Easing.out(Easing.back(1.1))
      }));
    }, TIMING.initial + TIMING.showModel + TIMING.cardAppear + TIMING.cardPulse + TIMING.swapAppear + 200);
    timeouts.push(t5);

    // PHASE 6: Final state - glow soft olur ve KALIR
    const t6 = setTimeout(() => {
      glowOpacity.value = withTiming(0.18, { duration: 400 });
      runOnJS(setHasPlayed)(true);
    }, TIMING.initial + TIMING.showModel + TIMING.cardAppear + TIMING.cardPulse + TIMING.swapAppear + TIMING.transform);
    timeouts.push(t6);

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [hasPlayed]);

  // Start animation once on mount
  useEffect(() => {
    if (!hasPlayed) {
      const initialDelay = setTimeout(() => {
        startAnimation();
      }, 600);

      return () => {
        clearTimeout(initialDelay);
      };
    }
  }, [startAnimation, hasPlayed]);

  // Animated styles
  const modelBStyle = useAnimatedStyle(() => ({
    opacity: modelBOpacity.value,
    transform: [{ scale: modelBScale.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { scale: cardScale.value },
      { rotate: `${cardRotate.value}deg` }
    ],
  }));

  const swapStyle = useAnimatedStyle(() => ({
    opacity: swapOpacity.value,
    transform: [
      { scale: swapScale.value },
      { rotate: `${swapRotate.value}deg` }
    ],
  }));

  const modelCStyle = useAnimatedStyle(() => ({
    opacity: modelCOpacity.value,
    transform: [{ scale: modelCScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const transformRingStyle = useAnimatedStyle(() => {
    const scale = interpolate(transformProgress.value, [0, 0.5, 1], [0.8, 1.2, 0.8]);
    const opacity = interpolate(transformProgress.value, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

    return {
      opacity: opacity * transformGlow.value,
      transform: [{ scale }],
    };
  });

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: transformGlow.value * 0.6,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background glow */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: size + 10,
            height: size + 10,
            borderRadius: size / 2,
          }
        ]}
      />

      {/* Model B - başlangıç (mavi pijama) */}
      <Animated.View
        style={[
          styles.imageContainer,
          modelBStyle,
          {
            width: size,
            height: size,
            borderRadius: size * 0.22,
            zIndex: 1,
          }
        ]}
      >
        <Image
          source={require('@/assets/images/Onboarding-Assets/Model/b.webp')}
          style={styles.image}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Model C - final (beyaz elbise) - SON HALINDE KALIR */}
      <Animated.View
        style={[
          styles.imageContainer,
          modelCStyle,
          {
            width: size,
            height: size,
            borderRadius: size * 0.22,
            zIndex: 2,
          }
        ]}
      >
        <Image
          source={require('@/assets/images/Onboarding-Assets/Model/c.webp')}
          style={styles.image}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Center transformation card (kıyafet kartı) */}
      <Animated.View
        style={[
          styles.centerCard,
          cardStyle,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size * 0.15,
          }
        ]}
      >
        <View style={styles.cardBorder}>
          <Image
            source={require('@/assets/images/Onboarding-Assets/Clothes/b.webp')}
            style={styles.cardImage}
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      {/* Transformation ring effect */}
      <Animated.View
        style={[
          styles.transformRing,
          transformRingStyle,
          {
            width: size + 6,
            height: size + 6,
            borderRadius: (size + 6) / 2,
          }
        ]}
      >
        <LinearGradient
          colors={['#6366F1', 'rgba(99, 102, 241, 0.1)', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ringGradient}
        />
      </Animated.View>

      {/* Shimmer effect */}
      <Animated.View style={[styles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Swap icon (değişim ikonu - ortada) */}
      <Animated.View style={[styles.swapContainer, swapStyle]}>
        <View style={styles.swapBg}>
          <Ionicons name="swap-horizontal" size={size * 0.28} color="#6366F1" />
        </View>
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
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  centerCard: {
    position: 'absolute',
    zIndex: 5,
    overflow: 'hidden',
  },
  cardBorder: {
    flex: 1,
    backgroundColor: Colors.card.primary,
    borderWidth: 2,
    borderColor: '#6366F1',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  transformRing: {
    position: 'absolute',
    zIndex: 4,
  },
  ringGradient: {
    flex: 1,
    borderRadius: 1000,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    pointerEvents: 'none',
  },
  swapContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  swapBg: {
    backgroundColor: Colors.card.primary,
    borderRadius: 20,
    padding: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2.5,
    borderColor: '#6366F1',
  },
});
