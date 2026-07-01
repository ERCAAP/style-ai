// OutfitTransformModal - Flat lay'den modele dönüşüm animasyonu
import React, { useEffect } from 'react';
import { Modal, View, StyleSheet, Image, Dimensions, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { ShopOutfit } from '@/constants/shopOutfits';
import { Colors, Shadows } from '@/constants/theme';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface OutfitTransformModalProps {
  visible: boolean;
  outfit: ShopOutfit | null;
  onComplete: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function OutfitTransformModal({ visible, outfit, onComplete }: OutfitTransformModalProps) {
  // Boş model (her zaman Model/a.webp)
  const baseModelImage = require('@/assets/images/Onboarding-Assets/Model/a.webp');

  const baseModelOpacity = useSharedValue(0);
  const baseModelScale = useSharedValue(0.9);

  const flatLayOpacity = useSharedValue(0);
  const flatLayTranslateY = useSharedValue(-200);
  const flatLayScale = useSharedValue(0.3);

  const finalModelOpacity = useSharedValue(0);
  const finalModelScale = useSharedValue(0.95);

  useEffect(() => {
    if (visible && outfit) {
      // Reset
      baseModelOpacity.value = 0;
      baseModelScale.value = 0.9;
      flatLayOpacity.value = 0;
      flatLayTranslateY.value = -200;
      flatLayScale.value = 0.3;
      finalModelOpacity.value = 0;
      finalModelScale.value = 0.95;

      // FAZ 1: Boş model göster (0-500ms)
      baseModelOpacity.value = withTiming(1, { duration: 300 });
      baseModelScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });

      // FAZ 2: Flat lay yukarıdan uçsun (500-1200ms)
      setTimeout(() => {
        flatLayOpacity.value = withTiming(1, { duration: 200 });
        flatLayTranslateY.value = withTiming(0, {
          duration: 700,
          easing: Easing.out(Easing.cubic)
        });
        flatLayScale.value = withSequence(
          withTiming(0.5, { duration: 350 }),
          withTiming(0.4, { duration: 350 })
        );
      }, 500);

      // FAZ 3: Model üzerinde birleşme (1200-1600ms)
      setTimeout(() => {
        flatLayOpacity.value = withTiming(0, { duration: 400 });
        baseModelOpacity.value = withTiming(0, { duration: 400 });
        finalModelOpacity.value = withTiming(1, { duration: 400 });
        finalModelScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
      }, 1200);

      // FAZ 4: Complete (1600ms)
      setTimeout(() => {
        runOnJS(onComplete)();
      }, 1800);
    }
  }, [visible, outfit]);

  const baseModelStyle = useAnimatedStyle(() => ({
    opacity: baseModelOpacity.value,
    transform: [{ scale: baseModelScale.value }],
  }));

  const flatLayStyle = useAnimatedStyle(() => ({
    opacity: flatLayOpacity.value,
    transform: [
      { translateY: flatLayTranslateY.value },
      { scale: flatLayScale.value }
    ],
  }));

  const finalModelStyle = useAnimatedStyle(() => ({
    opacity: finalModelOpacity.value,
    transform: [{ scale: finalModelScale.value }],
  }));

  if (!outfit) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <View style={styles.backdrop} />

        {/* Image Container */}
        <View style={styles.imageContainer}>
          {/* FAZ 1: Boş Model - Model/a.webp */}
          <Animated.View style={[StyleSheet.absoluteFill, baseModelStyle]}>
            <Image
              source={baseModelImage}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>

          {/* FAZ 2: Flat Lay - Yukarıdan uçarak gelen kıyafet */}
          <Animated.View style={[StyleSheet.absoluteFill, flatLayStyle]}>
            <Image
              source={outfit.flatLayImage}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>

          {/* FAZ 3: Final Model - Kıyafetli model */}
          <Animated.View style={[StyleSheet.absoluteFill, finalModelStyle]}>
            <Image
              source={outfit.modelImage}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  imageContainer: {
    width: wp('80%'),
    height: wp('100%'),
    borderRadius: wp('5%'),
    overflow: 'hidden',
    backgroundColor: Colors.card.primary,
    ...Shadows.lg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
