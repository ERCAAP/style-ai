/**
 * URLInput Component
 * Kullanıcının ürün URL'si yapıştırması için bileşen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Clipboard,
  Platform,
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
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { URLImageStatus, URLImage } from '@/hooks/useURLImage';
import { ScrapedImage } from '@/services/urlScraper';

interface URLInputProps {
  onFetch: (url: string) => Promise<URLImage | null>;
  onClear: () => void;
  status: URLImageStatus;
  error: string | null;
  urlImage: URLImage | null;
  allImages?: ScrapedImage[];
  onSelectAlternative?: (image: ScrapedImage) => void;
  onManualUpload?: () => void;
  onShowTutorial?: () => void; // Yeni: Parent modal'ı kapatıp tutorial gösterir
}

export function URLInput({
  onFetch,
  onClear,
  status,
  error,
  urlImage,
  allImages = [],
  onSelectAlternative,
  onManualUpload,
  onShowTutorial,
}: URLInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const isLoading = status === 'fetching' || status === 'downloading' || status === 'validating';

  // Check if error is scraping related (blocked/403)
  const isScrapingError = error && (
    error.includes('engelledi') ||
    error.includes('engelliy') ||
    error.includes('blocked') ||
    error.includes('Görsel Adresini Kopyala') ||
    error.includes('Save to Photos')
  );

  const handleShowTutorialClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Parent component'e haber ver (modal'ı kapatıp tutorial göstermesi için)
    if (onShowTutorial) {
      onShowTutorial();
    }
  };

  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getString();
      if (text) {
        setInputValue(text);
        Haptics.selectionAsync();
      }
    } catch (err) {
      console.error('Paste error:', err);
    }
  }, []);

  const handleFetch = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onFetch(inputValue.trim());
  }, [inputValue, isLoading, onFetch]);

  const handleClear = useCallback(() => {
    setInputValue('');
    onClear();
    Haptics.selectionAsync();
  }, [onClear]);

  // Görsel seçilmiş durumu
  if (urlImage) {
    return (
      <View style={styles.resultContainer}>
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: urlImage.uri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.clearImageButton} onPress={handleClear}>
            <Ionicons name="close" size={IconSizes.sm} color={Colors.text.white} />
          </TouchableOpacity>
          <View style={styles.sourceTag}>
            <Ionicons name="link" size={12} color={Colors.accent.primary} />
            <Text style={styles.sourceText} numberOfLines={1}>URL'den</Text>
          </View>
        </View>

        {/* Alternatif görseller */}
        {allImages.length > 1 && onSelectAlternative && (
          <View style={styles.alternativesSection}>
            <Text style={styles.alternativesTitle}>Diger Gorseller ({allImages.length - 1})</Text>
            <View style={styles.alternativesRow}>
              {allImages.slice(1, 5).map((img, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.alternativeItem}
                  onPress={() => onSelectAlternative(img)}
                >
                  <Image
                    source={{ uri: img.url }}
                    style={styles.alternativeImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="link" size={IconSizes.md} color={Colors.accent.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>URL'den Gorsel Ekle</Text>
          <Text style={styles.subtitle}>Urun linki veya direkt gorsel URL'si</Text>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={IconSizes.sm} color={Colors.accent.info} />
        <Text style={styles.infoText}>
          <Text style={styles.infoBold}>İpucu:</Text> Bazı siteler görseli engelleyebilir. Bu durumda görsele sağ tıklayıp "Görsel Adresini Kopyala" yapın ve buraya yapıştırın.
        </Text>
      </View>

      {/* Input Area */}
      <View style={styles.inputWrapper}>
        <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused, error && styles.inputContainerError]}>
          <Ionicons
            name="globe-outline"
            size={IconSizes.sm}
            color={isFocused ? Colors.accent.primary : Colors.text.muted}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Urun linkini buraya yapistirin..."
            placeholderTextColor={Colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleFetch}
            editable={!isLoading}
          />
          {inputValue.length > 0 && !isLoading && (
            <TouchableOpacity onPress={() => setInputValue('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={IconSizes.sm} color={Colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Simple Error Message Below Input */}
        {error && (
          <View style={styles.errorRow}>
            <Text style={styles.simpleError}>Gorsel yuklenemedi</Text>
            {isScrapingError && (
              <TouchableOpacity onPress={handleShowTutorialClick} style={styles.howToButton}>
                <Ionicons name="help-circle-outline" size={16} color={Colors.accent.info} />
                <Text style={styles.howToButtonText}>Nasil Yuklerim?</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.pasteButton}
            onPress={handlePaste}
            disabled={isLoading}
          >
            <Ionicons name="clipboard-outline" size={IconSizes.sm - 2} color={Colors.accent.primary} />
            <Text style={styles.pasteButtonText}>Yapistir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.fetchButton,
              (!inputValue.trim() || isLoading) && styles.fetchButtonDisabled,
            ]}
            onPress={handleFetch}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.text.white} />
            ) : (
              <>
                <Ionicons name="download-outline" size={IconSizes.sm - 2} color={Colors.text.white} />
                <Text style={styles.fetchButtonText}>Gorseli Cek</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Status */}
      {isLoading && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={Colors.accent.primary} />
          <Text style={styles.statusText}>
            {status === 'fetching' ? 'Sayfa okunuyor...' : 'Gorsel indiriliyor...'}
          </Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.info + '10',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.info,
    marginBottom: Spacing.lg,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 16,
  },
  infoBold: {
    fontWeight: '600',
    color: Colors.accent.info,
  },
  iconContainer: {
    width: ContainerSizes.lg,
    height: ContainerSizes.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  inputWrapper: {
    gap: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
  },
  inputContainerFocused: {
    borderColor: Colors.accent.primary,
  },
  inputContainerError: {
    borderColor: Colors.accent.error,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -Spacing.sm,
  },
  simpleError: {
    ...Typography.caption,
    color: Colors.accent.error,
    marginLeft: Spacing.xs,
  },
  howToButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: Spacing.xs,
  },
  howToButtonText: {
    ...Typography.caption,
    color: Colors.accent.info,
    fontWeight: '600',
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pasteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent.primary,
    backgroundColor: 'transparent',
  },
  pasteButtonText: {
    ...Typography.bodySmall,
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  fetchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent.primary,
  },
  fetchButtonDisabled: {
    backgroundColor: Colors.text.disabled,
  },
  fetchButtonText: {
    ...Typography.bodySmall,
    color: Colors.text.white,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statusText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  // Result Container Styles
  resultContainer: {
    padding: Spacing.base,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: Colors.background.secondary,
  },
  clearImageButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: ContainerSizes.sm,
    height: ContainerSizes.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.overlay.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTag: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.card.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  sourceText: {
    ...Typography.caption,
    color: Colors.accent.primary,
    fontWeight: '500',
  },
  alternativesSection: {
    marginTop: Spacing.md,
  },
  alternativesTitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  alternativesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  alternativeItem: {
    width: ContainerSizes.xl,
    height: ContainerSizes.xl,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  alternativeImage: {
    width: '100%',
    height: '100%',
  },
  // Tutorial Card Styles
  tutorialCard: {
    backgroundColor: Colors.card.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  stepsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
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
  tutorialActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tutorialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  primaryTutorialButton: {
    backgroundColor: Colors.accent.primary,
  },
  secondaryTutorialButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.accent.primary,
  },
  primaryTutorialButtonText: {
    ...Typography.bodySmall,
    color: Colors.text.white,
    fontWeight: '600',
  },
  secondaryTutorialButtonText: {
    ...Typography.bodySmall,
    color: Colors.accent.primary,
    fontWeight: '600',
  },
});

export default URLInput;
