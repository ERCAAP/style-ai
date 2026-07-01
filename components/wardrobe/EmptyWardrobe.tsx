// EmptyWardrobe - Bos dolap durumu

import { Button } from '@/components/ui';
import {
  Colors,
  Spacing,
  Typography
} from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface EmptyWardrobeProps {
  onAddPress: () => void;
}

export function EmptyWardrobe({ onAddPress }: EmptyWardrobeProps) {
  const { t } = useTranslation();

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.container}
      pointerEvents="box-none"
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name="shirt-outline"
          size={wp('16%')}
          color={Colors.text.muted}
        />
      </View>

      <Text style={styles.title}>{t('wardrobe.empty.title')}</Text>
      <Text style={styles.subtitle}>{t('wardrobe.empty.subtitle')}</Text>

      <Button
        title={t('wardrobe.empty.button')}
        onPress={onAddPress}
        size="md"
        icon={<Ionicons name="add" size={20} color={Colors.text.white} />}
        iconPosition="left"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    marginTop: -hp('10%'),
  },
  iconContainer: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 3 : 1,
  },
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
});

export default EmptyWardrobe;
