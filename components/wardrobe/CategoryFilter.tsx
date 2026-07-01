// CategoryFilter - Kategori filtre bari

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Animations,
} from '@/constants/theme';
import { ClothingCategory, WardrobeStats } from '@/types/wardrobe';

interface CategoryFilterProps {
  selectedCategory: ClothingCategory | null;
  stats: WardrobeStats | null;
  onSelect: (category: ClothingCategory | null) => void;
}

const CATEGORIES: Array<{ key: ClothingCategory | 'all'; icon: string }> = [
  { key: 'all', icon: 'grid-outline' },
  { key: 'tops', icon: 'shirt-outline' },
  { key: 'bottoms', icon: 'cut-outline' },
  { key: 'shoes', icon: 'footsteps-outline' },
  { key: 'accessories', icon: 'watch-outline' },
  { key: 'outerwear', icon: 'snow-outline' },
  { key: 'dresses', icon: 'woman-outline' },
];

interface CategoryChipProps {
  categoryKey: ClothingCategory | 'all';
  icon: string;
  count?: number;
  isSelected: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CategoryChip({ categoryKey, icon, count, isSelected, onPress }: CategoryChipProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, Animations.spring);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animations.spring);
  };

  return (
    <AnimatedPressable
      style={[
        styles.chip,
        isSelected && styles.chipSelected,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <BlurView intensity={isSelected ? 60 : 40} tint="light" style={styles.chipBlur}>
        <View style={[styles.chipGlass, isSelected && styles.chipGlassSelected]} />
        <View style={styles.chipHighlight} />
        <View style={styles.chipContent}>
          <Ionicons
            name={icon as any}
            size={20}
            color={isSelected ? Colors.text.primary : Colors.text.secondary}
          />
          <Text
            style={[
              styles.chipText,
              isSelected && styles.chipTextSelected,
            ]}
            numberOfLines={1}
          >
            {t(`wardrobe.categories.${categoryKey}`)}
          </Text>
        </View>
      </BlurView>
    </AnimatedPressable>
  );
}

export function CategoryFilter({ selectedCategory, stats, onSelect }: CategoryFilterProps) {
  const getCount = (key: ClothingCategory | 'all'): number | undefined => {
    if (!stats) return undefined;
    if (key === 'all') return stats.total;
    return stats.byCategory[key];
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {CATEGORIES.map(({ key, icon }) => (
        <CategoryChip
          key={key}
          categoryKey={key}
          icon={icon}
          count={getCount(key)}
          isSelected={key === 'all' ? selectedCategory === null : selectedCategory === key}
          onPress={() => onSelect(key === 'all' ? null : key)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    zIndex: 1000,
  },
  container: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: 0,
    gap: Spacing.sm,
  },
  chip: {
    width: 78,
    height: 78,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: Platform.OS === 'android' ? 1 : 0.5,
    borderColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chipSelected: {
    borderWidth: Platform.OS === 'android' ? 1.5 : 0.5,
    borderColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  chipBlur: {
    flex: 1,
    overflow: 'hidden',
  },
  chipGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.75)',
  },
  chipGlassSelected: {
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.95)',
  },
  chipHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 0.5,
  },
  chipContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  chipText: {
    ...Typography.caption,
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 10,
    color: Colors.text.secondary,
  },
  chipTextSelected: {
    fontWeight: '600',
    color: Colors.text.primary,
  },
});

export default CategoryFilter;
