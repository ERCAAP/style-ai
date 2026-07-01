/**
 * TargetImagesInput Component
 * Çoklu hedef kıyafet görseli ekleme bileşeni (max 10)
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
  ScrollView,
  Clipboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const MAX_IMAGES = 10;

export interface TargetImage {
  id: string;
  uri: string;
  sourceUrl: string;
}

interface TargetImagesInputProps {
  images: TargetImage[];
  onAddImage: (url: string) => Promise<TargetImage | null>;
  onRemoveImage: (id: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function TargetImagesInput({
  images,
  onAddImage,
  onRemoveImage,
  isLoading,
  error,
}: TargetImagesInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const canAddMore = images.length < MAX_IMAGES;

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

  const handleAdd = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !canAddMore) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await onAddImage(inputValue.trim());
    if (result) {
      setInputValue('');
    }
  }, [inputValue, isLoading, canAddMore, onAddImage]);

  const handleRemove = useCallback((id: string) => {
    Alert.alert(
      'Gorseli Kaldir',
      'Bu gorseli kaldirmak istediginize emin misiniz?',
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Kaldir',
          style: 'destructive',
          onPress: () => {
            onRemoveImage(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      ]
    );
  }, [onRemoveImage]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shirt-outline" size={IconSizes.md} color={Colors.secondary.darkGray} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Hedef Kiyafetler</Text>
          <Text style={styles.subtitle}>
            {images.length}/{MAX_IMAGES} gorsel eklendi
          </Text>
        </View>
      </View>

      {/* Eklenen Görseller */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imagesScroll}
          style={styles.imagesContainer}
        >
          {images.map((img, index) => (
            <View key={img.id} style={styles.imageItem}>
              <Image source={{ uri: img.uri }} style={styles.thumbnail} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemove(img.id)}
              >
                <Ionicons name="close" size={14} color={Colors.text.white} />
              </TouchableOpacity>
              <View style={styles.imageIndex}>
                <Text style={styles.imageIndexText}>{index + 1}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Input Area - Sadece daha fazla eklenebilirse göster */}
      {canAddMore && (
        <View style={styles.inputWrapper}>
          <View style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
            error && styles.inputContainerError
          ]}>
            <Ionicons
              name="link"
              size={IconSizes.sm}
              color={isFocused ? Colors.secondary.purple : Colors.text.muted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Kiyafet linkini yapistirin..."
              placeholderTextColor={Colors.text.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={handleAdd}
              editable={!isLoading}
            />
            {inputValue.length > 0 && !isLoading && (
              <TouchableOpacity onPress={() => setInputValue('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={IconSizes.sm} color={Colors.text.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.pasteButton}
              onPress={handlePaste}
              disabled={isLoading}
            >
              <Ionicons name="clipboard-outline" size={IconSizes.sm - 2} color={Colors.secondary.darkGray} />
              <Text style={styles.pasteButtonText}>Yapistir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addButton,
                (!inputValue.trim() || isLoading) && styles.addButtonDisabled,
              ]}
              onPress={handleAdd}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.text.white} />
              ) : (
                <>
                  <Ionicons name="add" size={IconSizes.sm - 2} color={Colors.text.white} />
                  <Text style={styles.addButtonText}>Ekle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Limit uyarısı */}
      {!canAddMore && (
        <View style={styles.limitWarning}>
          <Ionicons name="information-circle" size={IconSizes.xs} color={Colors.accent.warning} />
          <Text style={styles.limitText}>Maksimum {MAX_IMAGES} gorsel ekleyebilirsiniz</Text>
        </View>
      )}

      {/* Status / Error */}
      {isLoading && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={Colors.secondary.darkGray} />
          <Text style={styles.statusText}>Gorsel cekiliyor...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={IconSizes.xs} color={Colors.accent.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Boş durum */}
      {images.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={32} color={Colors.text.muted} />
          <Text style={styles.emptyText}>Henuz gorsel eklenmedi</Text>
          <Text style={styles.emptyHint}>Yukardaki alandan kiyafet linki ekleyin</Text>
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
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: ContainerSizes.lg,
    height: ContainerSizes.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary.darkGraySoft,
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
  imagesContainer: {
    marginBottom: Spacing.md,
  },
  imagesScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  imageItem: {
    width: wp('20%'),
    height: wp('26%'),
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background.secondary,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.overlay.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndex: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.secondary.darkGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndexText: {
    ...Typography.caption,
    color: Colors.text.white,
    fontWeight: '700',
    fontSize: 10,
  },
  inputWrapper: {
    gap: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
  },
  inputContainerFocused: {
    borderColor: Colors.secondary.darkGray,
  },
  inputContainerError: {
    borderColor: Colors.accent.error,
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
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.secondary.darkGray,
    backgroundColor: 'transparent',
  },
  pasteButtonText: {
    ...Typography.bodySmall,
    color: Colors.secondary.purple,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary.darkGray,
  },
  addButtonDisabled: {
    backgroundColor: Colors.text.disabled,
  },
  addButtonText: {
    ...Typography.bodySmall,
    color: Colors.text.white,
    fontWeight: '600',
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.accent.warning + '15',
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  limitText: {
    ...Typography.caption,
    color: Colors.accent.warning,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.accent.error + '15',
    borderRadius: BorderRadius.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.accent.error,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.text.muted,
    marginTop: Spacing.sm,
  },
  emptyHint: {
    ...Typography.caption,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
  },
});

export default TargetImagesInput;
