/**
 * FlyingImagesAnimation - Target kıyafetlerin user photo'ya uçuş animasyonu
 * Staggered animation ile her kıyafet sırayla uçar
 */

import React, { useEffect } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

interface FlyingImagesAnimationProps {
  images: string[]; // Target image URIs
  isActive: boolean;
  centerX: number; // User photo merkez X koordinatı
  centerY: number; // User photo merkez Y koordinatı
  onComplete?: () => void;
}

// Her bir uçan kıyafet için component
function FlyingImage({
  uri,
  index,
  totalImages,
  isActive,
  centerX,
  centerY,
  onComplete,
}: {
  uri: string;
  index: number;
  totalImages: number;
  isActive: boolean;
  centerX: number;
  centerY: number;
  onComplete?: () => void;
}) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Başlangıç pozisyonunu hesapla (ekranın farklı köşelerinden)
  const startPositions = [
    { x: -wp('20%'), y: hp('80%') }, // Sol alt
    { x: wp('100%'), y: hp('20%') }, // Sağ üst
    { x: -wp('15%'), y: hp('20%') }, // Sol üst
    { x: wp('105%'), y: hp('75%') }, // Sağ alt
    { x: wp('50%'), y: -hp('10%') }, // Üst orta
    { x: wp('50%'), y: hp('100%') }, // Alt orta
  ];

  const startPos = startPositions[index % startPositions.length];

  useEffect(() => {
    if (isActive) {
      const delay = index * 120; // Her kıyafet 120ms arayla başlar

      // Fade in ve scale up
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) })
      );

      scale.value = withDelay(
        delay,
        withSpring(1, {
          damping: 10,
          stiffness: 100,
        })
      );

      // Uçuş animasyonu
      progress.value = withDelay(
        delay,
        withTiming(
          1,
          {
            duration: 1000,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth easing
          },
          (finished) => {
            'worklet';
            if (finished && index === totalImages - 1 && onComplete) {
              // Son kıyafet tamamlandığında callback çağır - MUST use runOnJS for native safety
              runOnJS(onComplete)();
            }
          }
        )
      );
    }

    // Cleanup on unmount to prevent memory leaks
    return () => {
      'worklet';
      progress.value = 0;
      scale.value = 0;
      opacity.value = 0;
    };
  }, [isActive, index]);

  const animatedStyle = useAnimatedStyle(() => {
    // Bezier curve ile smooth path
    const x = interpolate(
      progress.value,
      [0, 0.5, 1],
      [
        startPos.x,
        startPos.x + (centerX - startPos.x) * 0.7, // Orta nokta (curved)
        centerX,
      ]
    );

    const y = interpolate(
      progress.value,
      [0, 0.5, 1],
      [
        startPos.y,
        startPos.y + (centerY - startPos.y) * 0.3, // Parabolic arc
        centerY,
      ]
    );

    // Uçarken hafif rotation
    const rotation = interpolate(progress.value, [0, 0.5, 1], [0, 15, 0]);

    // Merkeze yaklaştıkça küçül
    const finalScale = interpolate(progress.value, [0, 0.7, 1], [1, 0.8, 0.2]);

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: scale.value * finalScale },
        { rotate: `${rotation}deg` },
      ],
      opacity: opacity.value * interpolate(progress.value, [0, 0.8, 1], [1, 0.7, 0]),
    };
  });

  return (
    <Animated.View style={[styles.flyingImage, animatedStyle]} pointerEvents="none">
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
        fadeDuration={0}
      />
    </Animated.View>
  );
}

export function FlyingImagesAnimation({
  images,
  isActive,
  centerX,
  centerY,
  onComplete,
}: FlyingImagesAnimationProps) {
  if (!isActive || images.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {images.map((uri, index) => (
        <FlyingImage
          key={`flying-${index}`}
          uri={uri}
          index={index}
          totalImages={images.length}
          isActive={isActive}
          centerX={centerX}
          centerY={centerY}
          onComplete={index === images.length - 1 ? onComplete : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flyingImage: {
    position: 'absolute',
    width: wp('15%'),
    height: wp('20%'),
    borderRadius: wp('2%'),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
