// AnalysisResultModal - AI analiz sonuçlarını gösteren yumuşak köşeli modal
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { LinearGradient } from 'expo-linear-gradient';

interface AnalysisResultModalProps {
  visible: boolean;
  results: Array<{
    icon?: string;
    label: string;
    value: string | number;
  }>;
  delay?: number;
}

export function AnalysisResultModal({ visible, results, delay = 0 }: AnalysisResultModalProps) {
  const { t } = useTranslation();
  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(30);
  const modalScale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      // Modal animasyonu - yumuşak bir şekilde aşağıdan yukarı
      modalOpacity.value = withDelay(
        delay,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
      );
      modalTranslateY.value = withDelay(
        delay,
        withSpring(0, {
          damping: 15,
          stiffness: 100,
        })
      );
      modalScale.value = withDelay(
        delay,
        withSpring(1, {
          damping: 12,
          stiffness: 150,
        })
      );
    } else {
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalTranslateY.value = withTiming(30, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible, delay]);

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { translateY: modalTranslateY.value },
      { scale: modalScale.value },
    ],
  }));

  if (!visible && modalOpacity.value === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.modalContainer, modalStyle]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.modalGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>✨</Text>
          </View>
          <Text style={styles.headerTitle}>{t('onboarding.demo.resultsTitle')}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Results */}
        <View style={styles.resultsContainer}>
          {results.map((result, index) => (
            <ResultItem
              key={result.label}
              icon={result.icon}
              label={result.label}
              value={result.value}
              delay={delay + 200 + index * 100}
              visible={visible}
            />
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

interface ResultItemProps {
  icon?: string;
  label: string;
  value: string | number;
  delay: number;
  visible: boolean;
}

function ResultItem({ icon, label, value, delay, visible }: ResultItemProps) {
  const itemOpacity = useSharedValue(0);
  const itemTranslateX = useSharedValue(-20);

  useEffect(() => {
    if (visible) {
      itemOpacity.value = withDelay(
        delay,
        withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) })
      );
      itemTranslateX.value = withDelay(
        delay,
        withSpring(0, {
          damping: 15,
          stiffness: 120,
        })
      );
    } else {
      itemOpacity.value = withTiming(0, { duration: 150 });
      itemTranslateX.value = withTiming(-20, { duration: 150 });
    }
  }, [visible, delay]);

  const itemStyle = useAnimatedStyle(() => ({
    opacity: itemOpacity.value,
    transform: [{ translateX: itemTranslateX.value }],
  }));

  const isPercentage = typeof value === 'number';
  const displayValue = isPercentage ? `${value}%` : value;

  return (
    <Animated.View style={[styles.resultItem, itemStyle]}>
      {icon && <Text style={styles.resultIcon}>{icon}</Text>}
      <Text style={styles.resultLabel}>{label}</Text>
      <View style={styles.resultValueContainer}>
        {isPercentage && (
          <View style={[styles.scoreBar, { width: `${value}%` }]} />
        )}
        <Text style={[styles.resultValue, isPercentage && styles.resultValuePercentage]}>
          {displayValue}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    bottom: -wp('10%'),
    width: wp('70%'),
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.lg,
  },
  modalGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(112, 71, 235, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(112, 71, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  iconText: {
    fontSize: 18,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(112, 71, 235, 0.1)',
    marginBottom: Spacing.md,
  },
  resultsContainer: {
    gap: Spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  resultLabel: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
    fontSize: 13,
  },
  resultValueContainer: {
    position: 'relative',
    minWidth: 50,
    alignItems: 'flex-end',
  },
  scoreBar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(112, 71, 235, 0.08)',
    borderRadius: BorderRadius.sm,
  },
  resultValue: {
    ...Typography.bodySmall,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 13,
    paddingHorizontal: Spacing.xs,
  },
  resultValuePercentage: {
    color: Colors.accent.primary,
  },
});
