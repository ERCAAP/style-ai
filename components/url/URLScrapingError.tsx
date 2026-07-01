/**
 * URLScrapingError Component
 * URL'den görsel çekilemediğinde kullanıcıya yardım gösterir
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
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
import { useTranslation } from 'react-i18next';

interface URLScrapingErrorProps {
  errorMessage: string;
  onRetry: () => void;
  onManualUpload: () => void;
}

export function URLScrapingError({
  errorMessage,
  onRetry,
  onManualUpload,
}: URLScrapingErrorProps) {
  const { t } = useTranslation();
  const [showTutorial, setShowTutorial] = useState(false);

  const handleShowTutorial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowTutorial(true);
  };

  const handleCloseTutorial = () => {
    Haptics.selectionAsync();
    setShowTutorial(false);
  };

  return (
    <View style={styles.container}>
      {/* Error Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle" size={IconSizes.xl} color={Colors.accent.error} />
      </View>

      {/* Title */}
      <Text style={styles.title}>{t('errors.urlScraping.title')}</Text>

      {/* Error Message */}
      <Text style={styles.errorMessage}>{errorMessage}</Text>

      {/* How to Fix Section */}
      <View style={styles.fixSection}>
        <Text style={styles.fixTitle}>{t('errors.urlScraping.howToFix')}</Text>

        <View style={styles.stepsList}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>{t('errors.urlScraping.step1')}</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>{t('errors.urlScraping.step2')}</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>{t('errors.urlScraping.step3')}</Text>
          </View>
        </View>

        {/* Show Tutorial Button */}
        <TouchableOpacity
          style={styles.tutorialButton}
          onPress={handleShowTutorial}
        >
          <Ionicons name="help-circle-outline" size={IconSizes.sm} color={Colors.accent.info} />
          <Text style={styles.tutorialButtonText}>Gorsel Rehber</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onRetry}
        >
          <Ionicons name="refresh" size={IconSizes.sm} color={Colors.accent.primary} />
          <Text style={styles.secondaryButtonText}>{t('errors.urlScraping.tryAgain')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onManualUpload}
        >
          <Ionicons name="cloud-upload-outline" size={IconSizes.sm} color={Colors.text.white} />
          <Text style={styles.primaryButtonText}>{t('errors.urlScraping.uploadManually')}</Text>
        </TouchableOpacity>
      </View>

      {/* Tutorial Modal */}
      <Modal
        visible={showTutorial}
        transparent
        animationType="fade"
        onRequestClose={handleCloseTutorial}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseTutorial}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nasıl Kaydedilir?</Text>
              <TouchableOpacity onPress={handleCloseTutorial}>
                <Ionicons name="close" size={IconSizes.md} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

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
                    <Ionicons name="hand-left" size={32} color={Colors.text.white} />
                  </View>
                  <Text style={styles.instructionText}>
                    Görsele basılı tutun
                  </Text>
                </View>

                <View style={[styles.instructionBubble, styles.bottomBubble]}>
                  <View style={styles.redCircleHighlight}>
                    <Ionicons name="download" size={24} color={Colors.text.white} />
                  </View>
                  <Text style={styles.instructionText}>
                    "Fotoğraflara Kaydet" seçin
                  </Text>
                </View>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseTutorial}
            >
              <Text style={styles.closeButtonText}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: ContainerSizes.xxl,
    height: ContainerSizes.xxl,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  errorMessage: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  fixSection: {
    width: '100%',
    backgroundColor: Colors.accent.info + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.info,
    marginBottom: Spacing.lg,
  },
  fixTitle: {
    ...Typography.h4,
    color: Colors.accent.info,
    marginBottom: Spacing.md,
  },
  stepsList: {
    gap: Spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...Typography.caption,
    color: Colors.text.white,
    fontWeight: '600',
  },
  stepText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  tutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tutorialButtonText: {
    ...Typography.bodySmall,
    color: Colors.accent.info,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  primaryButton: {
    backgroundColor: Colors.accent.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.accent.primary,
  },
  primaryButtonText: {
    ...Typography.bodySmall,
    color: Colors.text.white,
    fontWeight: '600',
  },
  secondaryButtonText: {
    ...Typography.bodySmall,
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay.darker,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.card.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  tutorialImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
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
    padding: Spacing.lg,
  },
  instructionBubble: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bottomBubble: {
    alignSelf: 'center',
  },
  redCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
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
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
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
    color: Colors.text.white,
    backgroundColor: Colors.overlay.dark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: Colors.accent.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.body,
    color: Colors.text.white,
    fontWeight: '600',
  },
});

export default URLScrapingError;
