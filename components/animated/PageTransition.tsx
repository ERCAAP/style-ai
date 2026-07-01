// PageTransition - Screen transition wrapper component

import React from 'react';
import { StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  SlideInUp,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
  FadeInUp,
  FadeOutDown,
} from 'react-native-reanimated';
import { Animations } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TransitionType =
  | 'fade'
  | 'slideRight'
  | 'slideLeft'
  | 'slideUp'
  | 'zoom'
  | 'fadeUp'
  | 'none';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  style?: ViewStyle;
  duration?: number;
}

export function PageTransition({
  children,
  type = 'fadeUp',
  style,
  duration = Animations.timing.normal,
}: PageTransitionProps) {
  const getAnimations = () => {
    switch (type) {
      case 'fade':
        return {
          entering: FadeIn.duration(duration),
          exiting: FadeOut.duration(duration),
        };
      case 'slideRight':
        return {
          entering: SlideInRight.duration(duration),
          exiting: SlideOutLeft.duration(duration),
        };
      case 'slideLeft':
        return {
          entering: SlideInLeft.duration(duration),
          exiting: SlideOutRight.duration(duration),
        };
      case 'slideUp':
        return {
          entering: SlideInUp.duration(duration),
          exiting: SlideOutDown.duration(duration),
        };
      case 'zoom':
        return {
          entering: ZoomIn.duration(duration),
          exiting: ZoomOut.duration(duration),
        };
      case 'fadeUp':
        return {
          entering: FadeInUp.duration(duration),
          exiting: FadeOutDown.duration(duration),
        };
      case 'none':
        return {
          entering: undefined,
          exiting: undefined,
        };
      default:
        return {
          entering: FadeInUp.duration(duration),
          exiting: FadeOutDown.duration(duration),
        };
    }
  };

  const { entering, exiting } = getAnimations();

  if (type === 'none') {
    return <Animated.View style={[styles.container, style]}>{children}</Animated.View>;
  }

  return (
    <Animated.View
      entering={entering}
      exiting={exiting}
      style={[styles.container, style]}
    >
      {children}
    </Animated.View>
  );
}

// Modal transition wrapper
interface ModalTransitionProps {
  children: React.ReactNode;
  visible: boolean;
  style?: ViewStyle;
}

export function ModalTransition({
  children,
  visible,
  style,
}: ModalTransitionProps) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(Animations.timing.fast)}
      exiting={FadeOut.duration(Animations.timing.fast)}
      style={[styles.modalContainer, style]}
    >
      <Animated.View
        entering={SlideInUp.duration(Animations.timing.normal)}
        exiting={SlideOutDown.duration(Animations.timing.normal)}
        style={styles.modalContent}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

// Screen content wrapper with delayed content animation
interface ScreenContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
}

export function ScreenContent({
  children,
  style,
  delay = 100,
}: ScreenContentProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(Animations.timing.normal)}
      style={[styles.container, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
  },
});

export default PageTransition;
