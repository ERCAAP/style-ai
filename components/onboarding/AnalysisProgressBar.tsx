// AnalysisProgressBar - AI analiz sırasında gösterilen animasyonlu progress bar
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface AnalysisProgressBarProps {
  isActive: boolean;
  width?: number;
}

export function AnalysisProgressBar({ isActive, width = wp('55%') }: AnalysisProgressBarProps) {
  const progressPosition = useSharedValue(0);
  const progressOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Fade in
      progressOpacity.value = withTiming(1, { duration: 300 });

      // Git-gel animasyonu
      progressPosition.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Sonsuz tekrar
        false
      );
    } else {
      // Fade out
      progressOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isActive]);

  const progressBarStyle = useAnimatedStyle(() => {
    const translateX = progressPosition.value * (width - 60); // 60 = bar genişliği

    return {
      transform: [{ translateX }],
      opacity: progressOpacity.value,
    };
  });

  const containerStyle = useAnimatedStyle(() => ({
    opacity: progressOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle, { width }]}>
      <View style={styles.track} />
      <Animated.View style={[styles.bar, progressBarStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 4,
    borderRadius: 2,
    overflow: 'visible',
    position: 'relative',
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 2,
  },
  bar: {
    position: 'absolute',
    height: 4,
    width: 60,
    borderRadius: 2,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 2,
  },
});
