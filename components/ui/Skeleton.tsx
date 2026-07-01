// Skeleton - Loading placeholder component

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, BorderRadius } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.md,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.ease }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Skeleton variants
interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: string;
  style?: ViewStyle;
}

export function SkeletonText({
  lines = 3,
  lineHeight = 16,
  lastLineWidth = '60%',
  style,
}: SkeletonTextProps) {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          style={styles.textLine}
        />
      ))}
    </View>
  );
}

interface SkeletonCircleProps {
  size?: number;
  style?: ViewStyle;
}

export function SkeletonCircle({ size = 48, style }: SkeletonCircleProps) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Skeleton height={160} borderRadius={BorderRadius.lg} />
      <View style={styles.cardContent}>
        <Skeleton width="80%" height={18} />
        <Skeleton width="50%" height={14} style={styles.cardSubtitle} />
      </View>
    </View>
  );
}

interface SkeletonListProps {
  count?: number;
  itemHeight?: number;
  style?: ViewStyle;
}

export function SkeletonList({ count = 5, itemHeight = 72, style }: SkeletonListProps) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.listItem, { height: itemHeight }]}>
          <SkeletonCircle size={48} />
          <View style={styles.listContent}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="40%" height={12} style={styles.listSubtitle} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Wardrobe grid skeleton
export function SkeletonWardrobeGrid({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.gridItem}>
          <Skeleton height={150} borderRadius={BorderRadius.lg} />
          <View style={styles.gridContent}>
            <Skeleton width="80%" height={14} />
            <Skeleton width="50%" height={12} style={styles.gridSubtitle} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.background.secondary,
  },
  textContainer: {
    gap: 8,
  },
  textLine: {
    marginBottom: 4,
  },
  card: {
    backgroundColor: Colors.card.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 12,
    gap: 8,
  },
  cardSubtitle: {
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  listContent: {
    flex: 1,
    gap: 6,
  },
  listSubtitle: {
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  gridItem: {
    width: '50%',
    padding: 8,
  },
  gridContent: {
    marginTop: 8,
    gap: 4,
  },
  gridSubtitle: {
    marginTop: 2,
  },
});

export default Skeleton;
