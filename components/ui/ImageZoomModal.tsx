/**
 * ImageZoomModal Component
 * Full-screen image viewer with pinch-to-zoom capability
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Colors, IconSizes, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageZoomModalProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

export function ImageZoomModal({ visible, imageUrl, onClose }: ImageZoomModalProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Reset zoom on close
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    focalX.value = withTiming(0);
    focalY.value = withTiming(0);
    onClose();
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      'worklet';
      // Save current position at start of pan
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      // Only allow panning when zoomed in
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      'worklet';
      // Snap back if zoomed out
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      // Calculate new scale (min 1x, max 4x)
      const newScale = Math.min(Math.max(savedScale.value * event.scale, 1), 4);
      scale.value = newScale;
    })
    .onEnd(() => {
      // If zoomed out beyond minimum, reset to 1x
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        focalX.value = withSpring(0);
        focalY.value = withSpring(0);
      } else {
        savedScale.value = scale.value;
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + focalX.value * (1 - 1 / scale.value) },
      { translateY: translateY.value + focalY.value * (1 - 1 / scale.value) },
      { scale: scale.value },
    ],
  }));

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      'worklet';
      if (scale.value > 1) {
        // Zoom out
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        focalX.value = withSpring(0);
        focalY.value = withSpring(0);
      } else {
        // Zoom in to 2x
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(pinchGesture, panGesture),
    doubleTapGesture
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.container}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        {/* Close Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <BlurView intensity={20} tint="dark" style={styles.closeButtonBlur}>
              <Ionicons name="close" size={IconSizes.lg} color={Colors.text.white} />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Zoomable Image */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={styles.imageWrapper}>
            <Animated.Image
              source={{ uri: imageUrl }}
              style={[styles.image, animatedStyle]}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>

        {/* Zoom hint */}
        <View style={styles.hintContainer}>
          <BlurView intensity={20} tint="dark" style={styles.hintBlur}>
            <Ionicons name="move-outline" size={16} color={Colors.text.white} />
            <Animated.Text style={styles.hintText}>
              {t('common.imageZoomHint')}
            </Animated.Text>
          </BlurView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  header: {
    position: 'absolute',
    top: 50,
    right: Spacing.base,
    zIndex: 10,
  },
  closeButton: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  closeButtonBlur: {
    padding: Spacing.sm,
    borderRadius: 100,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    opacity: 0.8,
  },
  hintBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  hintText: {
    color: Colors.text.white,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ImageZoomModal;
