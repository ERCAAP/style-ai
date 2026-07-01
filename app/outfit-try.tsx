import { Button, Card, OutfitTransformModal, PhotoPickerModal, SafeContainer, KeepPhotoModal } from '@/components/ui';
import { IMAGE_PICKER_PRESETS } from '@/constants/imageConfig';
import { SHOP_OUTFITS, ShopOutfit } from '@/constants/shopOutfits';
import { AspectRatios, BorderRadius, Colors, ContainerSizes, IconSizes, Layout, Limits, Spacing, Typography } from '@/constants/theme';
import { useAuthContext } from '@/contexts';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useImagePicker as useImagePickerHook } from '@/hooks/useImagePicker';
import { useTargetImages } from '@/hooks/useTargetImages';
import { useURLImage } from '@/hooks/useURLImage';
import { getAssetUri } from '@/utils/assetHelper';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';

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
}: {
  image: { uri: string; fileSize: number };
  onClear: () => void;
  onChangePress: () => void;
}) {
  const { t } = useTranslation();

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

// Shop Outfits Grid - Mağaza kombinleri (Flat lay görselleri)
function ShopOutfitsGrid({
  onSelectOutfit,
  isLoading,
}: {
  onSelectOutfit: (outfit: ShopOutfit) => void;
  isLoading: boolean;
}) {
  return (
    <View style={styles.shopGridContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shopScrollContent}
      >
        {SHOP_OUTFITS.map((outfit) => (
          <TouchableOpacity
            key={outfit.id}
            style={styles.shopOutfitCard}
            onPress={() => onSelectOutfit(outfit)}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <View style={styles.shopOutfitImageContainer}>
              {/* Flat lay görsel */}
              <Image
                source={outfit.flatLayImage}
                style={styles.shopOutfitImage}
                resizeMode="contain"
              />
              <View style={styles.shopOutfitOverlay}>
                <Ionicons name="add-circle" size={32} color={Colors.text.white} />
              </View>
            </View>
            <View style={styles.shopOutfitInfo}>
              <Text style={styles.shopOutfitName}>{outfit.name}</Text>
              <Text style={styles.shopOutfitStyle}>{outfit.style}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Target Images Grid
function TargetImagesGrid({
  images,
  onAddPress,
  onRemove,
  isLoading,
}: {
  images: Array<{ id: string; uri: string }>;
  onAddPress: () => void;
  onRemove: (id: string) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
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
          {t('dressChange.sections.targetOutfits.count', { current: images.length, max: MAX_TARGET_IMAGES })}
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

    </View>
  );
}

export default function DressChangeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isPremium, refreshProfile, tryOnRemaining } = useAuthContext();
  const scrollViewRef = useRef<ScrollView>(null);

  // Modal states
  const [userPhotoModalVisible, setUserPhotoModalVisible] = useState(false);
  const [targetPhotoModalVisible, setTargetPhotoModalVisible] = useState(false);
  const [transformModalVisible, setTransformModalVisible] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<ShopOutfit | null>(null);
  const [keepPhotoModalVisible, setKeepPhotoModalVisible] = useState(false);
  const [pendingUserImage, setPendingUserImage] = useState<{ uri: string; fileSize: number } | null>(null);

  // User photo picker
  const {
    selectedImage: userImage,
    isLoading: userImageLoading,
    error: userImageError,
    pickFromCamera: userPickCamera,
    pickFromGallery: userPickGallery,
    clearImage: clearUserImage,
    setImageDirectly,
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

  // Scroll to bottom when user photo is added
  useEffect(() => {
    if (userImage) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [userImage]);

  // User photo handlers - Custom wrappers to show confirmation modal
  const handleUserCamera = useCallback(async () => {
    setUserPhotoModalVisible(false);

    // Select photo from camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('dressChange.alerts.cameraPermission.title'), t('dressChange.alerts.cameraPermission.message'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS === 'ios',
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Pending state'e at ve onay modalını göster
      setPendingUserImage({
        uri: result.assets[0].uri,
        fileSize: result.assets[0].fileSize || 0,
      });
      setKeepPhotoModalVisible(true);
    }
  }, []);

  const handleUserGallery = useCallback(async () => {
    setUserPhotoModalVisible(false);

    // Select photo from gallery
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('dressChange.alerts.galleryPermission.title'), t('dressChange.alerts.galleryPermission.message'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS === 'ios',
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Pending state'e at ve onay modalını göster
      setPendingUserImage({
        uri: result.assets[0].uri,
        fileSize: result.assets[0].fileSize || 0,
      });
      setKeepPhotoModalVisible(true);
    }
  }, []);

  const handleUserUrl = useCallback(async (url: string): Promise<boolean> => {
    const result = await fetchUserFromUrl(url);
    return result !== null;
  }, [fetchUserFromUrl]);

  // Keep photo modal handlers
  const handleKeepPhoto = useCallback(async () => {
    if (!pendingUserImage) return;

    // Compress and set the image using useImagePicker hook
    try {
      const { compressImage } = await import('@/utils/imageCompression');
      const compressed = await compressImage(pendingUserImage.uri, {
        maxWidth: Limits.maxImageWidth,
        maxHeight: Limits.maxImageHeight,
        quality: 0.8,
      });

      // Set image directly using the hook's setImageDirectly function
      setImageDirectly({
        uri: compressed.uri,
        width: compressed.width,
        height: compressed.height,
        fileSize: compressed.fileSize,
        type: 'gallery',
        originalUri: pendingUserImage.uri,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error compressing image:', error);
      Alert.alert(t('dressChange.alerts.error.title'), t('dressChange.alerts.error.message'));
    }

    setKeepPhotoModalVisible(false);
    setPendingUserImage(null);
  }, [pendingUserImage, setImageDirectly]);

  const handleSkipPhoto = useCallback(() => {
    setKeepPhotoModalVisible(false);
    setPendingUserImage(null);
  }, []);

  // Target photo handlers
  const handleTargetCamera = useCallback(async () => {
    setTargetPhotoModalVisible(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('dressChange.alerts.cameraPermission.title'), t('dressChange.alerts.cameraPermission.message'));
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
  }, [addTargetLocalImage]);

  const handleTargetGallery = useCallback(async () => {
    setTargetPhotoModalVisible(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('dressChange.alerts.galleryPermission.title'), t('dressChange.alerts.galleryPermission.message'));
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
  }, [addTargetLocalImage]);

  const handleTargetUrl = useCallback(async (url: string): Promise<boolean> => {
    const result = await addTargetImage(url);
    return result !== null;
  }, [addTargetImage]);

  // Shop outfit selection handler - Transform animasyonu göster
  const handleSelectShopOutfit = useCallback((outfit: ShopOutfit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOutfit(outfit);
    setTransformModalVisible(true);
  }, []);

  // Transform tamamlandığında model görselini ekle
  const handleTransformComplete = useCallback(async () => {
    setTransformModalVisible(false);

    if (!selectedOutfit) return;

    try {
      // Model görselini local asset'ten URI'ye çevir
      const modelUri = getAssetUri(selectedOutfit.modelImage);

      if (!modelUri) {
        throw new Error('Model görseli URI\'ye çevrilemedi');
      }

      // Model görselini hedef kıyafetlere ekle
      const result = await addTargetLocalImage(modelUri);

      if (result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('✅ Model görseli eklendi:', selectedOutfit.name);
      } else {
        throw new Error('Görsel eklenemedi');
      }
    } catch (error) {
      console.error('❌ Transform complete hatası:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('common.error'), t('dressChange.addError'));
    } finally {
      setSelectedOutfit(null);
    }
  }, [selectedOutfit, addTargetLocalImage]);

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

    if (!isPremium && tryOnRemaining <= 0) {
      router.push('/paywall');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await startAnalysis(userImage.uri, {
        language: 'tr',
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
  }, [userImage, isPremium, tryOnRemaining, startAnalysis, refreshProfile, router]);

  const isReadyToTransform = userImage && targetImages.length > 0;
  const isAnalyzing = analysisStatus !== 'idle' && analysisStatus !== 'completed' && analysisStatus !== 'error';
  const isUserUrlLoading = userUrlStatus === 'fetching' || userUrlStatus === 'downloading';

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeContainer edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('dressChange.title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
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

        <Card style={styles.sectionCard} variant="elevated">
          <TargetImagesGrid
            images={targetImages}
            onAddPress={() => setTargetPhotoModalVisible(true)}
            onRemove={removeTargetImage}
            isLoading={targetLoading}
          />
        </Card>

        {targetError && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color={Colors.accent.error} />
            <Text style={styles.errorText}>{targetError}</Text>
          </View>
        )}

        <View style={{ height: Spacing['5xl'] + Spacing['5xl'] }} />
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
        title={t('photoPickerModal.title')}
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
        title={t('photoPickerModal.addClothing')}
        showUrlOption={true}
        urlLoading={targetLoading}
      />

      {/* Outfit Transform Modal - Flat lay → Model animation */}
      <OutfitTransformModal
        visible={transformModalVisible}
        outfit={selectedOutfit}
        onComplete={handleTransformComplete}
      />

      {/* Keep Photo Confirmation Modal */}
      <KeepPhotoModal
        visible={keepPhotoModalVisible}
        photoUri={pendingUserImage?.uri}
        onKeep={handleKeepPhoto}
        onSkip={handleSkipPhoto}
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
    borderWidth: Platform.OS === 'android' ? 1 : 0.5,
    borderColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    }),
    elevation: Platform.OS === 'android' ? 3 : 0,
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
    borderWidth: Platform.OS === 'android' ? 1.5 : 1.5,
    borderColor: Platform.OS === 'android' ? 'rgba(74, 74, 74, 0.2)' : 'rgba(74, 74, 74, 0.25)',
    borderStyle: 'dashed',
  },
  addPhotoBlur: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  addPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)',
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
    backgroundColor: Platform.OS === 'android' ? '#F5F5F7' : 'rgba(245, 245, 247, 0.9)',
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
    gap: Spacing.xs,
  },
  targetImageItem: {
    width: wp('25%'),
    height: wp('33%'),
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: Platform.OS === 'android' ? 0.5 : 0,
    borderColor: 'rgba(0, 0, 0, 0.04)',
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
    width: wp('25%'),
    height: wp('33%'),
    borderRadius: BorderRadius.md,
    borderWidth: Platform.OS === 'android' ? 1.5 : 1.5,
    borderColor: Platform.OS === 'android' ? 'rgba(74, 74, 74, 0.2)' : 'rgba(74, 74, 74, 0.25)',
    borderStyle: 'dashed',
    backgroundColor: Platform.OS === 'android' ? 'rgba(74, 74, 74, 0.04)' : 'rgba(74, 74, 74, 0.05)',
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
    bottom: Spacing.xl,
    left: Layout.screenPadding,
    right: Layout.screenPadding,
    backgroundColor: Colors.background.start,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  shopGridContainer: {
    paddingVertical: Spacing.base,
  },
  shopScrollContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  shopOutfitCard: {
    width: wp('40%'),
    marginRight: Spacing.sm,
  },
  shopOutfitImageContainer: {
    width: '100%',
    height: wp('55%'),
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.background.secondary,
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
  shopOutfitImage: {
    width: '100%',
    height: '100%',
  },
  shopOutfitOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopOutfitInfo: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  shopOutfitName: {
    ...Typography.bodySmall,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  shopOutfitStyle: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});
