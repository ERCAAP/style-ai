/**
 * PhotoPickerModal Component
 * Bottom sheet modal - Camera, Gallery, URL options
 * Glassmorphism style
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  IconSizes,
  ContainerSizes,
} from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Neutral gray colors
const DARK_GRAY = '#4A4A4A';
const MEDIUM_GRAY = '#6B7280';

interface PhotoPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onCameraPress: () => void;
  onGalleryPress: () => void;
  onUrlSubmit?: (url: string) => Promise<boolean>;
  title?: string;
  showUrlOption?: boolean;
  urlLoading?: boolean;
}

export function PhotoPickerModal({
  visible,
  onClose,
  onCameraPress,
  onGalleryPress,
  onUrlSubmit,
  title,
  showUrlOption = true,
  urlLoading = false,
}: PhotoPickerModalProps) {
  const { t } = useTranslation();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const tutorialSlideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 9,
      }).start();
    } else {
      // Close immediately - no animation!
      slideAnim.setValue(SCREEN_HEIGHT);
      // Reset state when closing
      setShowUrlInput(false);
      setUrlValue('');
      setUrlError(null);
    }
  }, [visible, slideAnim]);

  useEffect(() => {
    if (showTutorial) {
      Animated.spring(tutorialSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 9,
      }).start();
    } else {
      tutorialSlideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [showTutorial, tutorialSlideAnim]);

  const handleClose = useCallback(() => {
    Haptics.selectionAsync();
    onClose();
  }, [onClose]);

  const handleCameraPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Don't close modal - parent component will close and immediately open camera
    onCameraPress();
  }, [onCameraPress]);

  const handleGalleryPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Don't close modal - parent component will close and immediately open gallery
    onGalleryPress();
  }, [onGalleryPress]);

  const handleUrlOptionPress = useCallback(() => {
    Haptics.selectionAsync();
    setShowUrlInput(true);
  }, []);

  const handleUrlSubmit = useCallback(async () => {
    if (!urlValue.trim() || !onUrlSubmit || urlLoading) return;

    setUrlError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const success = await onUrlSubmit(urlValue.trim());
    if (success) {
      setUrlValue('');
      setShowUrlInput(false);
      onClose();
    } else {
      setUrlError(t('errors.urlScraping.title'));
    }
  }, [urlValue, onUrlSubmit, urlLoading, onClose, t]);

  const handleShowTutorial = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Close the main modal first
    onClose();
    // Then show tutorial after a brief delay
    setTimeout(() => {
      setShowTutorial(true);
    }, 300);
  }, [onClose]);

  const handleCloseTutorial = useCallback(() => {
    Haptics.selectionAsync();
    setShowTutorial(false);
  }, []);

  // PERFORMANCE: Don't render if modal is not visible
  if (!visible && !showTutorial) return null;

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <BlurView intensity={80} tint="light" style={styles.blurContainer}>
            <View style={styles.glassOverlay} />

            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {showUrlInput ? t('photoPickerModal.urlTitle') : (title || t('photoPickerModal.title'))}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={IconSizes.md} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {!showUrlInput ? (
              /* Options */
              <View style={styles.optionsContainer}>
                {/* Camera */}
                <TouchableOpacity style={styles.optionButton} onPress={handleCameraPress}>
                  <View style={[styles.optionIcon, { backgroundColor: 'rgba(74, 74, 74, 0.12)' }]}>
                    <Ionicons name="camera" size={IconSizes.lg} color={DARK_GRAY} />
                  </View>
                  <Text style={styles.optionText}>{t('photoPickerModal.camera')}</Text>
                  <Text style={styles.optionHint}>{t('photoPickerModal.cameraHint')}</Text>
                </TouchableOpacity>

                {/* Gallery */}
                <TouchableOpacity style={styles.optionButton} onPress={handleGalleryPress}>
                  <View style={[styles.optionIcon, { backgroundColor: 'rgba(74, 74, 74, 0.12)' }]}>
                    <Ionicons name="images" size={IconSizes.lg} color={DARK_GRAY} />
                  </View>
                  <Text style={styles.optionText}>{t('photoPickerModal.gallery')}</Text>
                  <Text style={styles.optionHint}>{t('photoPickerModal.galleryHint')}</Text>
                </TouchableOpacity>

                {/* URL */}
                {showUrlOption && onUrlSubmit && (
                  <TouchableOpacity style={styles.optionButton} onPress={handleUrlOptionPress}>
                    <View style={[styles.optionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                      <Ionicons name="link" size={IconSizes.lg} color="#10B981" />
                    </View>
                    <Text style={styles.optionText}>{t('photoPickerModal.url')}</Text>
                    <Text style={styles.optionHint}>{t('photoPickerModal.urlHint')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              /* URL Input */
              <View style={styles.urlContainer}>
                <View style={[styles.urlInputWrapper, urlError && styles.urlInputError]}>
                  <Ionicons
                    name="link"
                    size={IconSizes.sm}
                    color={Colors.text.muted}
                    style={styles.urlIcon}
                  />
                  <TextInput
                    style={styles.urlInput}
                    value={urlValue}
                    onChangeText={setUrlValue}
                    placeholder={t('photoPickerModal.urlPlaceholder')}
                    placeholderTextColor={Colors.text.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    returnKeyType="go"
                    onSubmitEditing={handleUrlSubmit}
                    editable={!urlLoading}
                    autoFocus
                  />
                  {urlValue.length > 0 && !urlLoading && (
                    <TouchableOpacity onPress={() => setUrlValue('')}>
                      <Ionicons name="close-circle" size={IconSizes.sm} color={Colors.text.muted} />
                    </TouchableOpacity>
                  )}
                </View>

                {urlError && (
                  <View style={styles.errorRow}>
                    <Text style={styles.urlErrorText}>{urlError}</Text>
                    <TouchableOpacity onPress={handleShowTutorial} style={styles.howToButton}>
                      <Ionicons name="help-circle-outline" size={16} color={Colors.accent.info} />
                      <Text style={styles.howToButtonText}>{t('errors.urlScraping.howToFix')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.urlActions}>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      styles.submitButtonFull,
                      (!urlValue.trim() || urlLoading) && styles.submitButtonDisabled
                    ]}
                    onPress={handleUrlSubmit}
                    disabled={!urlValue.trim() || urlLoading}
                  >
                    {urlLoading ? (
                      <ActivityIndicator size="small" color={Colors.text.white} />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={IconSizes.sm - 2} color={Colors.text.white} />
                        <Text style={styles.submitButtonText}>{t('photoPickerModal.add')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Bottom safe area */}
            <View style={styles.safeArea} />
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>

      {/* Tutorial Modal */}
      <Modal
        visible={showTutorial}
        transparent
        animationType="none"
        onRequestClose={handleCloseTutorial}
      >
        <Pressable style={styles.modalContainer} onPress={handleCloseTutorial}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        <Animated.View
          style={[
            styles.tutorialModal,
            { transform: [{ translateY: tutorialSlideAnim }] }
          ]}
        >
          {/* Header - Fixed at top */}
          <View style={styles.tutorialHeader}>
            <Text style={styles.tutorialTitle}>{t('errors.urlScraping.tutorialTitle')}</Text>
            <TouchableOpacity onPress={handleCloseTutorial} style={styles.tutorialCloseIcon}>
              <Ionicons name="close" size={IconSizes.md} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.tutorialScrollView}
            contentContainerStyle={styles.tutorialScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Tutorial Image */}
            <View style={styles.tutorialImageContainer}>
              <Image
                source={require('@/assets/images/Onboarding-Assets/Clothes/a.webp')}
                style={styles.tutorialImage}
                resizeMode="contain"
              />

              {/* Overlay with Instructions */}
              <View style={styles.overlayInstructions}>
                <View style={styles.instructionBubble}>
                  <View style={styles.redCircle}>
                    <Ionicons name="hand-left" size={wp('8%')} color={Colors.text.white} />
                  </View>
                  <Text style={styles.instructionText}>
                    {t('errors.urlScraping.step1')}
                  </Text>
                </View>

                <View style={[styles.instructionBubble, styles.bottomBubble]}>
                  <View style={styles.redCircleHighlight}>
                    <Ionicons name="download" size={wp('6%')} color={Colors.text.white} />
                  </View>
                  <Text style={styles.instructionText}>
                    {t('errors.urlScraping.step2')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Gallery Info */}
            <View style={styles.galleryInfoContainer}>
              <View style={styles.galleryInfoIcon}>
                <Ionicons name="images" size={IconSizes.sm} color={Colors.accent.info} />
              </View>
              <Text style={styles.galleryInfoText}>
                {t('errors.urlScraping.galleryInfo')}
              </Text>
            </View>
          </ScrollView>

          {/* Close Button - Fixed at bottom */}
          <View style={styles.tutorialFooter}>
            <TouchableOpacity
              style={styles.tutorialCloseButton}
              onPress={handleCloseTutorial}
            >
              <Text style={styles.tutorialCloseButtonText}>{t('errors.urlScraping.gotIt')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomSheet: {
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    overflow: 'hidden',
    maxHeight: hp('60%'),
  },
  blurContainer: {
    overflow: 'hidden',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 247, 0.85)',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: wp('10%'),
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    position: 'relative',
  },
  title: {
    ...Typography.h3,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.base,
    padding: Spacing.xs,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  optionIcon: {
    width: ContainerSizes.xl,
    height: ContainerSizes.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  optionText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionHint: {
    ...Typography.caption,
    color: Colors.text.muted,
  },
  urlContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  urlInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: Spacing.md,
  },
  urlInputError: {
    borderColor: Colors.accent.error,
  },
  urlIcon: {
    marginRight: Spacing.sm,
  },
  urlInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  urlErrorText: {
    ...Typography.caption,
    color: Colors.accent.error,
    flex: 1,
  },
  howToButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.accent.info + '15',
    borderRadius: BorderRadius.md,
  },
  howToButtonText: {
    ...Typography.caption,
    color: Colors.accent.info,
    fontWeight: '600',
  },
  urlActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent.primary,
  },
  submitButtonFull: {
    flex: 1,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  submitButtonText: {
    ...Typography.bodySmall,
    color: Colors.text.white,
    fontWeight: '600',
  },
  safeArea: {
    height: hp('4%'),
  },
  // Tutorial Modal Styles
  tutorialModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card.primary,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    maxHeight: hp('85%'),
  },
  tutorialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  tutorialCloseIcon: {
    padding: Spacing.xs,
  },
  tutorialTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontSize: wp('5%'),
  },
  tutorialScrollView: {
    flex: 1,
  },
  tutorialScrollContent: {
    padding: wp('5%'),
    paddingBottom: hp('2%'),
  },
  tutorialImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.75,
    maxHeight: hp('45%'),
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: hp('2%'),
  },
  tutorialImage: {
    width: '100%',
    height: '100%',
  },
  overlayInstructions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: wp('4%'),
  },
  instructionBubble: {
    alignItems: 'center',
    gap: hp('1%'),
  },
  bottomBubble: {
    alignSelf: 'center',
  },
  redCircle: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: Colors.accent.error,
    borderWidth: 4,
    borderColor: Colors.text.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  redCircleHighlight: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    backgroundColor: Colors.accent.error,
    borderWidth: 3,
    borderColor: Colors.text.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionText: {
    ...Typography.bodySmall,
    fontSize: wp('3.5%'),
    color: Colors.text.white,
    backgroundColor: Colors.overlay.dark,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: BorderRadius.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  galleryInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.info + '10',
    borderRadius: BorderRadius.lg,
    padding: wp('3.5%'),
    gap: wp('3%'),
  },
  galleryInfoIcon: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent.info + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryInfoText: {
    ...Typography.body,
    fontSize: wp('3.8%'),
    color: Colors.text.primary,
    flex: 1,
    lineHeight: wp('5.5%'),
  },
  tutorialFooter: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('2.5%'),
    borderTopWidth: 1,
    borderTopColor: Colors.background.secondary,
    backgroundColor: Colors.card.primary,
  },
  tutorialCloseButton: {
    backgroundColor: Colors.accent.primary,
    paddingVertical: hp('1.8%'),
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  tutorialCloseButtonText: {
    ...Typography.body,
    fontSize: wp('4.2%'),
    color: Colors.text.white,
    fontWeight: '600',
  },
});

export default PhotoPickerModal;
