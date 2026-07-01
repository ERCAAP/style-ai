// AnimatedList - Staggered animation list component

import React from 'react';
import { FlatList, FlatListProps, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  Layout,
} from 'react-native-reanimated';
import { Animations } from '@/constants/theme';

type AnimationDirection = 'up' | 'down' | 'left' | 'right';

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  direction?: AnimationDirection;
  staggerDelay?: number;
  style?: ViewStyle;
}

export function AnimatedListItem({
  children,
  index,
  direction = 'up',
  staggerDelay = 50,
  style,
}: AnimatedListItemProps) {
  const delay = index * staggerDelay;

  const getEnteringAnimation = () => {
    switch (direction) {
      case 'up':
        return FadeInUp.delay(delay).duration(Animations.timing.normal);
      case 'down':
        return FadeInDown.delay(delay).duration(Animations.timing.normal);
      case 'left':
        return FadeInLeft.delay(delay).duration(Animations.timing.normal);
      case 'right':
        return FadeInRight.delay(delay).duration(Animations.timing.normal);
      default:
        return FadeInUp.delay(delay).duration(Animations.timing.normal);
    }
  };

  return (
    <Animated.View
      entering={getEnteringAnimation()}
      layout={Layout.springify()}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

// Animated FlatList with staggered item animation
interface AnimatedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  renderItem: (info: { item: T; index: number }) => React.ReactNode;
  direction?: AnimationDirection;
  staggerDelay?: number;
  itemStyle?: ViewStyle;
}

export function AnimatedFlatList<T>({
  renderItem,
  direction = 'up',
  staggerDelay = 50,
  itemStyle,
  ...props
}: AnimatedFlatListProps<T>) {
  return (
    <FlatList
      {...props}
      renderItem={({ item, index }) => (
        <AnimatedListItem
          index={index}
          direction={direction}
          staggerDelay={staggerDelay}
          style={itemStyle}
        >
          {renderItem({ item, index })}
        </AnimatedListItem>
      )}
    />
  );
}

// Simple animated row for forms/settings
interface AnimatedRowProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  style?: ViewStyle;
}

export function AnimatedRow({
  children,
  index = 0,
  delay,
  style,
}: AnimatedRowProps) {
  const calculatedDelay = delay ?? index * 50;

  return (
    <Animated.View
      entering={FadeInUp.delay(calculatedDelay).duration(Animations.timing.normal)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

// Grid item with staggered animation
interface AnimatedGridItemProps {
  children: React.ReactNode;
  index: number;
  columns?: number;
  staggerDelay?: number;
  style?: ViewStyle;
}

export function AnimatedGridItem({
  children,
  index,
  columns = 2,
  staggerDelay = 50,
  style,
}: AnimatedGridItemProps) {
  // Calculate delay based on row (items in same row animate together)
  const row = Math.floor(index / columns);
  const delay = row * staggerDelay;

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(Animations.timing.normal)}
      layout={Layout.springify()}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export default {
  AnimatedListItem,
  AnimatedFlatList,
  AnimatedRow,
  AnimatedGridItem,
};
