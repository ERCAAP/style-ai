/**
 * KeepPhotoModal Component
 * Kullaniciya "Bu fotoğrafı koru?" diye sorar
 * Bottom sheet modal
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  IconSizes,
  ContainerSizes,
} from '@/constants/theme';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Neutral gray colors
const DARK_GRAY = '#4A4A4A';

interface KeepPhotoModalProps {
  visible: boolean;
  onKeep: () => void;
  onSkip: () => void;
  photoUri?: string;
}

export function KeepPhotoModal({
  visible,
  onKeep,
  onSkip,
  photoUri,
}: KeepPhotoModalProps) {
  const { t } = useTranslation();
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleKeep = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onKeep();
  }, [onKeep]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    onSkip();
  }, [onSkip]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleSkip}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Content */}
          <View style={styles.content}>
            {/* Photo Preview */}
            {photoUri && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
              </View>
            )}

            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="bookmark" size={32} color={Colors.accent.primary} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{t('dressChange.keepPhotoModal.title')}</Text>

            {/* Description */}
            <Text style={styles.description}>
              {t('dressChange.keepPhotoModal.description')}
            </Text>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              {/* Keep Button */}
              <TouchableOpacity
                style={[styles.button, styles.keepButton]}
                onPress={handleKeep}
                activeOpacity={0.8}
              >
                <Ionicons name="bookmark" size={20} color={Colors.text.white} />
                <Text style={styles.keepButtonText}>{t('dressChange.keepPhotoModal.keep')}</Text>
              </TouchableOpacity>

              {/* Skip Button */}
              <TouchableOpacity
                style={[styles.button, styles.skipButton]}
                onPress={handleSkip}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>{t('dressChange.keepPhotoModal.skip')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  blurContainer: {
    paddingBottom: Spacing['3xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  handle: {
    width: wp('12%'),
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  photoPreview: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: wp('60%'),
    backgroundColor: Colors.background.secondary,
  },
  iconContainer: {
    width: ContainerSizes['2xl'],
    height: ContainerSizes['2xl'],
    borderRadius: BorderRadius.full,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: '#1F2937',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  buttonsContainer: {
    gap: Spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    minHeight: 52,
  },
  keepButton: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  keepButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  skipButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skipButtonText: {
    ...Typography.body,
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
});
