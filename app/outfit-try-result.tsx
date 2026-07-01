/**
 * Outfit Try-On Result Screen
 * Displays the generated image from P-IMAGE API
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeContainer, Button, ImageZoomModal } from '@/components/ui';
import { Colors, Typography, Spacing, BorderRadius, IconSizes, Shadows } from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { useTryOnHistory } from '@/hooks';
import { useReferral } from '@/contexts';
import { useTranslation } from 'react-i18next';

export default function OutfitTryResultScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { saveResult } = useTryOnHistory();
  const { trackAnalysis } = useReferral();

  const resultImageUrl = params.imageUrl as string;
  const userImageUri = params.userImageUri as string;
  const targetImageUris = params.targetImageUris
    ? JSON.parse(params.targetImageUris as string)
    : [];
  const predictionId = params.predictionId as string;

  const [isSaving, setIsSaving] = useState(false);
  const [isSavedToHistory, setIsSavedToHistory] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | undefined>(undefined);
  const [showZoomModal, setShowZoomModal] = useState(false);

  // Get image dimensions for aspect ratio
  useEffect(() => {
    if (resultImageUrl) {
      Image.getSize(
        resultImageUrl,
        (width, height) => {
          setImageAspectRatio(width / height);
        },
        (error) => {
          console.error('Error getting image size:', error);
          // Fallback to a default portrait ratio
          setImageAspectRatio(3 / 4);
        }
      );
    }
  }, [resultImageUrl]);

  // Auto-save to history on mount
  useEffect(() => {
    if (resultImageUrl && !isSavedToHistory) {
      saveToHistory();
    }
  }, [resultImageUrl, isSavedToHistory]);

  // Track outfit try-on completion
  useEffect(() => {
    const trackCompletion = async () => {
      try {
        await trackAnalysis('outfit_try_on');
        console.log('✅ Outfit try-on completed and tracked');
      } catch (error) {
        console.warn('Failed to track outfit try-on:', error);
      }
    };

    if (resultImageUrl) {
      trackCompletion();
    }
  }, [resultImageUrl, trackAnalysis]);

  const saveToHistory = async () => {
    try {
      await saveResult({
        resultImageUrl,
        userImageUri,
        clothingImages: targetImageUris,
        predictionId,
      });
      setIsSavedToHistory(true);
      console.log('Result auto-saved to history');
    } catch (error) {
      console.error('Auto-save to history failed:', error);
      // Fail silently - don't disrupt user experience
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleTryAgain = () => {
    router.back();
  };

  const handleImagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowZoomModal(true);
  };

  const handleSaveToGallery = async () => {
    if (!resultImageUrl) return;

    try {
      setIsSaving(true);

      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('outfitTryResult.alerts.permissionRequired.title'),
          t('outfitTryResult.alerts.permissionRequired.message'),
          [{ text: t('common.ok') }]
        );
        return;
      }

      // Download image
      const fileUri = `${FileSystem.cacheDirectory}outfit-try-on-result.jpg`;
      const downloadResult = await FileSystem.downloadAsync(resultImageUrl, fileUri);

      // Save to gallery
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        t('outfitTryResult.alerts.saveSuccess.title'),
        t('outfitTryResult.alerts.saveSuccess.message'),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(
        t('outfitTryResult.alerts.saveError.title'),
        t('outfitTryResult.alerts.saveError.message'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!resultImageUrl) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await Share.share({
        message: t('outfitTryResult.shareMessage'),
        url: resultImageUrl,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (!resultImageUrl) {
    return (
      <SafeContainer edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color={Colors.accent.error} />
          <Text style={styles.errorText}>{t('outfitTryResult.error.imageNotFound')}</Text>
          <Button title={t('outfitTryResult.backButton')} onPress={handleBack} />
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('outfitTryResult.title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Result Image */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleImagePress}
          style={[styles.imageContainer, imageAspectRatio ? { aspectRatio: imageAspectRatio } : null]}
        >
          <Image
            source={{ uri: resultImageUrl }}
            style={styles.resultImage}
            resizeMode="contain"
          />
          {/* Zoom hint overlay */}
          <View style={styles.zoomHintOverlay}>
            <View style={styles.zoomHintBadge}>
              <Ionicons name="expand-outline" size={16} color={Colors.text.white} />
              <Text style={styles.zoomHintText}>{t('outfitTryResult.zoomHint')}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonOutline]}
            onPress={handleSaveToGallery}
            disabled={isSaving}
          >
            <Ionicons
              name="download-outline"
              size={IconSizes.md}
              color={Colors.text.secondary}
            />
            <Text style={[styles.actionButtonText, styles.actionButtonTextOutline]}>
              {isSaving ? t('outfitTryResult.actions.saving') : t('outfitTryResult.actions.saveToGallery')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonOutline]}
            onPress={handleShare}
          >
            <Ionicons
              name="share-social-outline"
              size={IconSizes.md}
              color={Colors.text.secondary}
            />
            <Text style={[styles.actionButtonText, styles.actionButtonTextOutline]}>
              {t('outfitTryResult.actions.share')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Try Again Button */}
        <Button
          title={t('outfitTryResult.actions.tryAgain')}
          onPress={handleTryAgain}
          variant="secondary"
          fullWidth
        />
      </View>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        visible={showZoomModal}
        imageUrl={resultImageUrl}
        onClose={() => setShowZoomModal(false)}
      />
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
    padding: Spacing.base,
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    maxHeight: hp('55%'),
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.md,
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  zoomHintOverlay: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
  },
  zoomHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
  },
  zoomHintText: {
    color: Colors.text.white,
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.secondary.mediumGray,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.secondary.mediumGray,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    color: Colors.text.white,
    fontWeight: '600',
  },
  actionButtonTextOutline: {
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  errorText: {
    ...Typography.h3,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
