import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '@/constants/theme';

type ProgressBarProps = {
  progress: number; // 0-100
  height?: number;
  trackColor?: string;
  fillColor?: string;
};

export function ProgressBar({
  progress,
  height = 6,
  trackColor = Colors.background.secondary,
  fillColor = Colors.accent.primary,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: fillColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
});
