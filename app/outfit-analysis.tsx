// Outfit Analysis Screen
// Kiyafet analizi yapmak icin kullanilan sayfa

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeContainer, Button, PhotoPickerModal, AnalysisPurposeModal } from '@/components/ui';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useAuthContext } from '@/contexts';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Layout,
  IconSizes,
} from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';

const DARK_GRAY = '#4A4A4A';

export default function OutfitAnalysisScreen() {
  const router = useRouter();
  const { user, deviceId, isPremium, userPreferences, profile } = useAuthContext();
  const { startAnalysis, isAnalyzing, progress, progressText, error, reset } = useAnalysis();
  const { t } = useTranslation();

  const [selectedImage, setSelectedImage] = useState<{ uri: string } | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>(['general']);

  const handleBack = () => {
    router.back();
  };

  const handleCameraPress = useCallback(async () => {
    // Modal'ı HEMEN kapat
    setShowPhotoPicker(false);

    // İzin kontrolü - hızlı
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('dressChange.alerts.cameraPermission.title'),
        t('dressChange.alerts.cameraPermission.message')
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS === 'ios',
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage({ uri: result.assets[0].uri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const handleGalleryPress = useCallback(async () => {
    // Modal'ı HEMEN kapat
    setShowPhotoPicker(false);

    // İzin kontrolü - hızlı
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('dressChange.alerts.galleryPermission.title'),
        t('dressChange.alerts.galleryPermission.message')
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS === 'ios',
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage({ uri: result.assets[0].uri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const handleClearImage = () => {
    setSelectedImage(null);
    reset();
  };

  const handleStartAnalysis = () => {
    if (!selectedImage) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Amaç seçim modalını aç
    setShowPurposeModal(true);
  };

  const handlePurposeConfirm = (purposes: string[]) => {
    setShowPurposeModal(false);

    // Güvenlik kontrolü - selectedImage null ise geri dön
    if (!selectedImage?.uri) {
      Alert.alert(
        t('outfitAnalysis.alerts.error.title'),
        t('outfitAnalysis.alerts.error.missingPhoto')
      );
      return;
    }

    // Ucretsiz kullanicilar paywall'a yonlendirilir
    if (!isPremium) {
      router.push('/paywall');
      return;
    }

    // Animasyon ekranına geç - analyzing ekranı kendi analizini yapacak
    router.push({
      pathname: '/analyzing',
      params: {
        imageUri: selectedImage.uri,
        purposes: JSON.stringify(purposes),
      },
    });
  };

  const handleTogglePurpose = (purposeId: string) => {
    setSelectedPurposes((prev) => {
      if (prev.includes(purposeId)) {
        // En az bir seçenek kalmalı
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== purposeId);
      }
      return [...prev, purposeId];
    });
  };

  return (
    <SafeContainer edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('outfitAnalysis.title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Text */}
        <Text style={styles.infoText}>
          {t('outfitAnalysis.subtitle')}
        </Text>

        {/* Image Picker Area */}
        {!selectedImage ? (
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={() => setShowPhotoPicker(true)}
            activeOpacity={0.8}
          >
            <BlurView intensity={40} tint="light" style={styles.imagePickerBlur}>
              <View style={styles.imagePickerGlass} />
              <View style={styles.imagePickerContent}>
                <View style={styles.imagePickerIcon}>
                  <Ionicons name="camera-outline" size={48} color={Colors.text.muted} />
                </View>
                <Text style={styles.imagePickerText}>{t('outfitAnalysis.imagePicker.title')}</Text>
                <Text style={styles.imagePickerSubtext}>
                  {t('outfitAnalysis.imagePicker.subtitle')}
                </Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        ) : (
          <View style={styles.selectedImageContainer}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.selectedImage}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.clearButton} onPress={handleClearImage}>
              <Ionicons name="close-circle" size={32} color={Colors.text.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => setShowPhotoPicker(true)}
            >
              <Ionicons name="camera" size={16} color={DARK_GRAY} />
              <Text style={styles.changeButtonText}>{t('outfitAnalysis.imagePicker.changeButton')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress */}
        {isAnalyzing && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color={Colors.accent.primary} />
            <Text style={styles.progressText}>{progressText}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
        )}

        {/* Error */}
        {error && !isAnalyzing && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color={Colors.accent.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <Button
          title={isAnalyzing ? t('outfitAnalysis.actions.analyzing') : t('outfitAnalysis.actions.analyze')}
          onPress={handleStartAnalysis}
          fullWidth
          size="lg"
          disabled={!selectedImage || isAnalyzing}
          icon={
            !isAnalyzing ? (
              <Ionicons name="sparkles" size={20} color={Colors.text.white} />
            ) : undefined
          }
        />
      </View>

      {/* Photo Picker Modal */}
      <PhotoPickerModal
        visible={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
        title={t('outfitAnalysis.photoPickerModal.title')}
      />

      {/* Analysis Purpose Modal */}
      <AnalysisPurposeModal
        visible={showPurposeModal}
        selectedPurposes={selectedPurposes}
        onClose={() => setShowPurposeModal(false)}
        onConfirm={handlePurposeConfirm}
        onTogglePurpose={handleTogglePurpose}
      />
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    height: Layout.headerHeight,
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
  },
  contentContainer: {
    padding: Layout.screenPadding,
  },
  infoText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: wp('5%'),
    overflow: 'hidden',
    borderWidth: Platform.OS === 'android' ? 1.5 : 1.5,
    borderColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.08)' : Colors.border.light,
    borderStyle: 'dashed',
  },
  imagePickerBlur: {
    flex: 1,
  },
  imagePickerGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)',
  },
  imagePickerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  imagePickerIcon: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    }),
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  imagePickerText: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  imagePickerSubtext: {
    ...Typography.bodySmall,
    color: Colors.text.muted,
  },
  selectedImageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: wp('5%'),
    overflow: 'hidden',
    position: 'relative',
    borderWidth: Platform.OS === 'android' ? 0.5 : 0,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    }),
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  clearButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  changeButton: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: Platform.OS === 'android' ? 0.5 : 0,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  changeButtonText: {
    ...Typography.bodySmall,
    color: '#4A4A4A',
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  progressText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  progressBar: {
    width: '100%',
    height: hp('0.8%'),
    backgroundColor: Colors.background.secondary,
    borderRadius: hp('0.4%'),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
  },
  progressPercent: {
    ...Typography.bodySmall,
    color: Colors.text.muted,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.md,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.accent.error,
    flex: 1,
  },
  bottomContainer: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  remainingText: {
    ...Typography.caption,
    color: Colors.text.muted,
    textAlign: 'center',
  },
});
