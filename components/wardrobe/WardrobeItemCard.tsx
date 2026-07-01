// WardrobeItemCard - Dolap kiyafet karti

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  Shadows,
  CategoryColors,
  Animations,
} from '@/constants/theme';
import { WardrobeItem } from '@/types/wardrobe';

interface WardrobeItemCardProps {
  item: WardrobeItem;
  onPress: () => void;
  onFavoritePress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function WardrobeItemCard({
  item,
  onPress,
  onFavoritePress,
}: WardrobeItemCardProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(Animations.scale.pressed, Animations.spring);
  };

  const handlePressOut = () => {
    scale.value = withSpring(Animations.scale.normal, Animations.spring);
  };

  const categoryColor = CategoryColors[item.category] || Colors.accent.primary;

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Favorite Badge */}
        {item.isFavorite && (
          <View style={styles.favoriteBadge}>
            <Ionicons name="heart" size={14} color={Colors.accent.error} />
          </View>
        )}

        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryText}>
            {t(`wardrobe.categories.${item.category}`)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.metaRow}>
          {/* Color indicator */}
          <View style={styles.colorRow}>
            <View style={[styles.colorDot, { backgroundColor: item.colorHex }]} />
            <Text style={styles.colorName}>{item.color}</Text>
          </View>

          {/* Wear count */}
          {item.wearCount > 0 && (
            <View style={styles.wearCount}>
              <Ionicons name="repeat-outline" size={12} color={Colors.text.muted} />
              <Text style={styles.wearCountText}>{item.wearCount}</Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.card.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: Platform.OS === 'android' ? 1 : 0.5,
    borderColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    ...Shadows.md,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.background.secondary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Shadows.md,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    ...Typography.tag,
    color: Colors.text.white,
    textTransform: 'uppercase',
  },
  content: {
    padding: Spacing.md,
  },
  name: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  colorName: {
    ...Typography.caption,
    color: Colors.text.muted,
  },
  wearCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  wearCountText: {
    ...Typography.caption,
    color: Colors.text.muted,
  },
});

export default WardrobeItemCard;
