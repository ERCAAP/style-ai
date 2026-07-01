import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeContainer, Header, Button, Card, PhotoPickerModal } from '@/components/ui';
import { useImagePicker as useImagePickerHook } from '@/hooks/useImagePicker';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useTargetImages } from '@/hooks/useTargetImages';
import { useURLImage } from '@/hooks/useURLImage';
import { useAuthContext } from '@/contexts';
import { Colors, Typography, Spacing, BorderRadius, Layout, IconSizes, ContainerSizes, AspectRatios, Limits } from '@/constants/theme';
import { IMAGE_PICKER_PRESETS } from '@/constants/imageConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { i18n } from '@/i18n';

const MAX_TARGET_IMAGES = 10;

// Dark gray color for UI elements
const DARK_GRAY = '#4A4A4A';
const MEDIUM_GRAY = '#6B7280';

// Add Photo Button Component
function AddPhotoButton({
  onPress,
  label = 'Fotograf Ekle',
}: {
  onPress: () => void;
  label?: string;
}) {
  return (
    <TouchableOpacity style={styles.addPhotoButton} onPress={onPress} activeOpacity={0.7}>
      <BlurView intensity={40} tint="light" style={styles.addPhotoBlur}>
        <View style={styles.addPhotoOverlay} />
        <View style={[styles.addPhotoIcon, { backgroundColor: DARK_GRAY + '12' }]}>
          <Ionicons name="add" size={IconSizes.lg} color={DARK_GRAY} />
        </View>
        <Text style={[styles.addPhotoText, { color: DARK_GRAY }]}>{label}</Text>
      </BlurView>
    </TouchableOpacity>
  );
}

// User Photo Display
function UserPhotoDisplay({
  image,
  onClear,
  onChangePress,
  t,
}: {
  image: { uri: string; fileSize: number };
  onClear: () => void;
  onChangePress: () => void;
  t: any;
}) {
  return (
    <View style={styles.photoDisplayContainer}>
      <Image source={{ uri: image.uri }} style={styles.userPhoto} resizeMode="cover" />
      <View style={styles.photoOverlay}>
        <View />
        <TouchableOpacity style={styles.photoClearButton} onPress={onClear}>
          <Ionicons name="close" size={IconSizes.sm} color={Colors.text.white} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.changePhotoButton} onPress={onChangePress}>
        <Ionicons name="camera" size={IconSizes.sm - 2} color={DARK_GRAY} />
        <Text style={[styles.changePhotoText, { color: DARK_GRAY }]}>
          {t('dressChange.sections.userPhoto.changeButton')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Target Images Grid
function TargetImagesGrid({
  images,
  onAddPress,
  onRemove,
  isLoading,
  t,
}: {
  images: Array<{ id: string; uri: string }>;
  onAddPress: () => void;
  onRemove: (id: string) => void;
  isLoading: boolean;
  t: any;
}) {
  const canAddMore = images.length < MAX_TARGET_IMAGES;

  const handleRemove = (id: string) => {
    Alert.alert(
      t('dressChange.sections.targetOutfits.removeConfirm.title'),
      t('dressChange.sections.targetOutfits.removeConfirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('dressChange.sections.targetOutfits.removeConfirm.remove'),
          style: 'destructive',
          onPress: () => {
            onRemove(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.targetGridContainer}>
      {/* Header */}
      <View style={styles.targetHeader}>
        <Text style={styles.targetCount}>
          {t('dressChange.sections.targetOutfits.count', {
            current: images.length,
            max: MAX_TARGET_IMAGES,
          })}
        </Text>
      </View>

      {/* Grid */}
      <View style={styles.targetGrid}>
        {/* Added Images */}
        {images.map((img, index) => (
          <View key={img.id} style={styles.targetImageItem}>
            <Image source={{ uri: img.uri }} style={styles.targetThumbnail} resizeMode="cover" />
            <TouchableOpacity style={styles.targetRemoveButton} onPress={() => handleRemove(img.id)}>
              <Ionicons name="close" size={12} color={Colors.text.white} />
            </TouchableOpacity>
            <View style={styles.targetIndexBadge}>
              <Text style={styles.targetIndexText}>{index + 1}</Text>
            </View>
          </View>
        ))}

        {/* Add Button */}
        {canAddMore && (
          <TouchableOpacity style={styles.targetAddButton} onPress={onAddPress} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={DARK_GRAY} />
            ) : (
              <>
                <Ionicons name="add" size={IconSizes.md} color={DARK_GRAY} />
                <Text style={styles.targetAddText}>{t('dressChange.sections.targetOutfits.addButton')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Empty State */}
      {images.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <Ionicons name="shirt-outline" size={32} color={Colors.text.muted} />
          <Text style={styles.emptyText}>{t('dressChange.sections.targetOutfits.empty')}</Text>
        </View>
      )}
    </View>
  );
}

export default function DressChangeScreen() {
  const router = useRouter();
  const { isPremium, refreshProfile } = useAuthContext();
  const { t } = useTranslation();

  // Modal states
  const [userPhotoModalVisible, setUserPhotoModalVisible] = useState(false);
  const [targetPhotoModalVisible, setTargetPhotoModalVisible] = useState(false);

  // User photo picker
  const {
    selectedImage: userImage,
    isLoading: userImageLoading,
    error: userImageError,
    pickFromCamera: userPickCamera,
    pickFromGallery: userPickGallery,
    clearImage: clearUserImage,
  } = useImagePickerHook({
    maxWidth: Limits.maxImageWidth,
    maxHeight: Limits.maxImageHeight,
    ...IMAGE_PICKER_PRESETS.portrait,
  });

  // URL image hook for user photo
  const {
    fetchFromUrl: fetchUserFromUrl,
    status: userUrlStatus,
    clear: clearUserUrl,
  } = useURLImage();

  // Target images
  const {
    images: targetImages,
    isLoading: targetLoading,
    error: targetError,
    addImage: addTargetImage,
    addLocalImage: addTargetLocalImage,
    removeImage: removeTargetImage,
  } = useTargetImages();

  // Analysis hook
  const {
    status: analysisStatus,
    error: analysisError,
    startAnalysis,
  } = useAnalysis();

  // User photo handlers
  const handleUserCamera = useCallback(() => {
    userPickCamera();
  }, [userPickCamera]);

  const handleUserGallery = useCallback(() => {
    userPickGallery();
  }, [userPickGallery]);

  const handleUserUrl = useCallback(async (url: string): Promise<boolean> => {
    const result = await fetchUserFromUrl(url);
    return result !== null;
  }, [fetchUserFromUrl]);

  // Target photo handlers
  const handleTargetCamera = useCallback(async () => {
    setTargetPhotoModalVisible(false);

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
      addTargetLocalImage(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [addTargetLocalImage, t]);

  const handleTargetGallery = useCallback(async () => {
    setTargetPhotoModalVisible(false);

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
      addTargetLocalImage(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [addTargetLocalImage, t]);

  const handleTargetUrl = useCallback(async (url: string): Promise<boolean> => {
    const result = await addTargetImage(url);
    return result !== null;
  }, [addTargetImage]);

  // Transform handler
  const handleTransform = useCallback(() => {
    if (!userImage || targetImages.length === 0) return;

    if (!isPremium) {
      router.push('/paywall');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    router.push({
      pathname: '/processing',
      params: {
        userImageUri: userImage.uri,
        targetImageUris: JSON.stringify(targetImages.map(img => img.uri)),
      },
    });
  }, [userImage, targetImages, isPremium, router]);

  // Analysis handler
  const handleAnalysis = useCallback(async () => {
    if (!userImage) return;

    if (!isPremium) {
      router.push('/paywall');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await startAnalysis(userImage.uri, {
        language: (i18n.language === 'tr' || i18n.language === 'en') ? i18n.language as 'tr' | 'en' : 'tr',
        detailLevel: 'detailed',
      });

      if (result) {
        await refreshProfile();
        router.push({
          pathname: '/analysis-result',
          params: { analysis: JSON.stringify(result) },
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [userImage, isPremium, startAnalysis, refreshProfile, router]);

  const isReadyToTransform = userImage && targetImages.length > 0;
  const isAnalyzing = analysisStatus !== 'idle' && analysisStatus !== 'completed' && analysisStatus !== 'error';
  const isUserUrlLoading = userUrlStatus === 'fetching' || userUrlStatus === 'downloading';

  return (
    <SafeContainer>
      <Header title={t('dressChange.title')} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: User Photo */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionNumber, { backgroundColor: DARK_GRAY }]}>
            <Text style={styles.sectionNumberText}>1</Text>
          </View>
          <View style={styles.sectionTextContainer}>
            <Text style={styles.sectionTitle}>{t('dressChange.sections.userPhoto.title')}</Text>
            <Text style={styles.sectionSubtitle}>{t('dressChange.sections.userPhoto.subtitle')}</Text>
          </View>
        </View>

        <Card style={styles.sectionCard} variant="elevated">
          {userImageLoading || isUserUrlLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.accent.primary} />
              <Text style={styles.loadingText}>{t('dressChange.loading')}</Text>
            </View>
          ) : userImage ? (
            <UserPhotoDisplay
              image={userImage}
              onClear={clearUserImage}
              onChangePress={() => setUserPhotoModalVisible(true)}
              t={t}
            />
          ) : (
            <View style={styles.emptyPhotoContainer}>
              <AddPhotoButton
                onPress={() => setUserPhotoModalVisible(true)}
                label={t('dressChange.sections.userPhoto.addButton')}
              />
            </View>
          )}
        </Card>

        {userImageError && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color={Colors.accent.error} />
            <Text style={styles.errorText}>{userImageError}</Text>
          </View>
        )}

        {/* Section 2: Target Outfits */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <View style={[styles.sectionNumber, { backgroundColor: DARK_GRAY }]}>
            <Text style={styles.sectionNumberText}>2</Text>
          </View>
          <View style={styles.sectionTextContainer}>
            <Text style={styles.sectionTitle}>{t('dressChange.sections.targetOutfits.title')}</Text>
            <Text style={styles.sectionSubtitle}>{t('dressChange.sections.targetOutfits.subtitle')}</Text>
          </View>
        </View>

        <Card style={[styles.sectionCard, styles.targetCard]} variant="elevated">
          <TargetImagesGrid
            images={targetImages}
            onAddPress={() => setTargetPhotoModalVisible(true)}
            onRemove={removeTargetImage}
            isLoading={targetLoading}
            t={t}
          />
        </Card>

        {targetError && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color={Colors.accent.error} />
            <Text style={styles.errorText}>{targetError}</Text>
          </View>
        )}

        {/* Analysis CTA */}
        <Card
          style={[styles.analysisCta, !userImage && styles.analysisCtaDisabled]}
          variant="gradient"
          onPress={userImage && !isAnalyzing ? handleAnalysis : undefined}
        >
          <View style={styles.analysisCtaContent}>
            <View style={[styles.analysisCtaIcon, isAnalyzing && styles.analysisCtaIconActive]}>
              {isAnalyzing ? (
                <ActivityIndicator size="small" color={Colors.accent.primary} />
              ) : (
                <Ionicons name="sparkles" size={24} color={Colors.accent.primary} />
              )}
            </View>
            <View style={styles.analysisCtaText}>
              <Text style={styles.analysisCtaTitle}>
                {isAnalyzing ? t('dressChange.analysis.titleActive') : t('dressChange.analysis.title')}
              </Text>
              <Text style={styles.analysisCtaSubtitle}>
                {userImage
                  ? isAnalyzing
                    ? t('dressChange.analysis.subtitleActive')
                    : t('dressChange.analysis.subtitle')
                  : t('dressChange.analysis.subtitleDisabled')}
              </Text>
            </View>
            {userImage && !isAnalyzing && (
              <Ionicons name="arrow-forward-circle" size={28} color={Colors.accent.primary} />
            )}
          </View>
        </Card>

        <View style={{ height: Layout.tabBarHeight + Spacing['5xl'] + Spacing['3xl'] }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Button
          title={t('dressChange.actions.tryOn')}
          onPress={handleTransform}
          disabled={!isReadyToTransform || isAnalyzing || targetLoading}
          fullWidth
          size="lg"
          icon={
            <Ionicons
              name="shirt"
              size={IconSizes.sm}
              color={isReadyToTransform && !isAnalyzing && !targetLoading ? Colors.text.white : Colors.text.disabled}
            />
          }
        />
        {!isReadyToTransform && (
          <Text style={styles.helperText}>
            {!userImage && targetImages.length === 0
              ? t('dressChange.actions.helperText.both')
              : !userImage
              ? t('dressChange.actions.helperText.userPhoto')
              : t('dressChange.actions.helperText.targetOutfits')}
          </Text>
        )}
      </View>

      {/* User Photo Modal */}
      <PhotoPickerModal
        visible={userPhotoModalVisible}
        onClose={() => setUserPhotoModalVisible(false)}
        onCameraPress={handleUserCamera}
        onGalleryPress={handleUserGallery}
        onUrlSubmit={handleUserUrl}
        title={t('dressChange.sections.userPhoto.addButton')}
        showUrlOption={true}
        urlLoading={isUserUrlLoading}
      />

      {/* Target Photo Modal */}
      <PhotoPickerModal
        visible={targetPhotoModalVisible}
        onClose={() => setTargetPhotoModalVisible(false)}
        onCameraPress={handleTargetCamera}
        onGalleryPress={handleTargetGallery}
        onUrlSubmit={handleTargetUrl}
        title={t('dressChange.sections.targetOutfits.addButton')}
        showUrlOption={true}
        urlLoading={targetLoading}
      />
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Layout.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionNumber: {
    width: ContainerSizes.sm,
    height: ContainerSizes.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    ...Typography.body,
    color: Colors.text.white,
    fontWeight: '700',
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  sectionCard: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
    borderRadius: wp('5%'),
    borderWidth: wp('0.4%'),
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(245, 245, 247, 0.6)',
  },
  targetCard: {
    backgroundColor: 'rgba(245, 245, 247, 0.6)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptyPhotoContainer: {
    padding: Spacing.xl,
  },
  addPhotoButton: {
    borderRadius: wp('4%'),
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(74, 74, 74, 0.25)',
    borderStyle: 'dashed',
  },
  addPhotoBlur: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  addPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  addPhotoIcon: {
    width: ContainerSizes.xl,
    height: ContainerSizes.xl,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  addPhotoText: {
    ...Typography.body,
    fontWeight: '600',
  },
  photoDisplayContainer: {
    position: 'relative',
  },
  userPhoto: {
    width: '100%',
    aspectRatio: AspectRatios.portrait,
  },
  photoOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoClearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(245, 245, 247, 0.9)',
  },
  changePhotoText: {
    ...Typography.bodySmall,
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  targetGridContainer: {
    padding: Spacing.base,
  },
  targetHeader: {
    marginBottom: Spacing.md,
  },
  targetCount: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  targetImageItem: {
    width: wp('27%'),
    height: wp('35%'),
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  targetThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background.secondary,
  },
  targetRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetIndexBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4A4A4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetIndexText: {
    ...Typography.caption,
    color: Colors.text.white,
    fontWeight: '700',
    fontSize: 10,
  },
  targetAddButton: {
    width: wp('27%'),
    height: wp('35%'),
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(74, 74, 74, 0.25)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(74, 74, 74, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetAddText: {
    ...Typography.caption,
    color: '#4A4A4A',
    fontWeight: '600',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.text.muted,
    marginTop: Spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.error + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.accent.error,
    flex: 1,
  },
  analysisCta: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: wp('5%'),
    borderWidth: wp('0.4%'),
    borderColor: 'rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  analysisCtaDisabled: {
    opacity: 0.5,
    borderColor: 'rgba(200, 200, 200, 0.3)',
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
  },
  analysisCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  analysisCtaIcon: {
    width: ContainerSizes.lg,
    height: ContainerSizes.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisCtaIconActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  analysisCtaText: {
    flex: 1,
  },
  analysisCtaTitle: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  analysisCtaSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  bottomAction: {
    position: 'absolute',
    bottom: Layout.tabBarHeight + Spacing.md,
    left: Layout.screenPadding,
    right: Layout.screenPadding,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
