import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeContainer, Button } from '@/components/ui';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

type ViewMode = 'after' | 'before';

export default function ResultScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('after');
  const { t } = useTranslation();

  const handleClose = () => {
    router.replace('/(tabs)');
  };

  const handleToggleView = (mode: ViewMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(mode);
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Ileride MediaLibrary ile kaydetme
    Alert.alert('Kaydedildi!', 'Gorsel galerinize kaydedildi.');
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: t('analysis.share.result', { appName: t('app.name') }),
        // url: resultImageUrl, // Ileride gercek URL
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleTryAgain = () => {
    router.replace('/(tabs)/dress-change');
  };

  return (
    <SafeContainer edges={['top', 'bottom']}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={28} color={Colors.text.primary} />
      </TouchableOpacity>

      <View style={styles.container}>
        {/* Result Header */}
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={32} color={Colors.accent.success} />
          <Text style={styles.headerTitle}>Donusum Tamamlandi!</Text>
        </View>

        {/* Result Image */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name={viewMode === 'after' ? 'sparkles' : 'person'}
              size={80}
              color={viewMode === 'after' ? Colors.accent.primary : Colors.text.muted}
            />
            <Text style={styles.imagePlaceholderText}>
              {viewMode === 'after' ? 'Sonuc Gorsel' : 'Orijinal Gorsel'}
            </Text>
          </View>
        </View>

        {/* Before/After Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'before' && styles.toggleButtonActive]}
            onPress={() => handleToggleView('before')}
          >
            <Text style={[styles.toggleText, viewMode === 'before' && styles.toggleTextActive]}>
              Onceki
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'after' && styles.toggleButtonActive]}
            onPress={() => handleToggleView('after')}
          >
            <Text style={[styles.toggleText, viewMode === 'after' && styles.toggleTextActive]}>
              Sonraki
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <View style={styles.actionIcon}>
              <Ionicons name="download-outline" size={24} color={Colors.accent.primary} />
            </View>
            <Text style={styles.actionText}>Kaydet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <View style={styles.actionIcon}>
              <Ionicons name="share-outline" size={24} color={Colors.accent.primary} />
            </View>
            <Text style={styles.actionText}>Paylas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleTryAgain}>
            <View style={styles.actionIcon}>
              <Ionicons name="refresh-outline" size={24} color={Colors.accent.primary} />
            </View>
            <Text style={styles.actionText}>Tekrar</Text>
          </TouchableOpacity>
        </View>

        {/* Home Button */}
        <View style={styles.homeButtonContainer}>
          <Button
            title="Ana Sayfaya Don"
            onPress={handleClose}
            variant="secondary"
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
    zIndex: 10,
    padding: Spacing.sm,
  },
  container: {
    flex: 1,
    padding: Layout.screenPadding,
    paddingTop: Spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  imageContainer: {
    flex: 1,
    marginBottom: Spacing.xl,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  imagePlaceholderText: {
    ...Typography.body,
    color: Colors.text.muted,
    marginTop: Spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.accent.primary,
    ...Shadows.sm,
  },
  toggleText: {
    ...Typography.bodySmall,
    color: Colors.text.muted,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: Colors.text.white,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  homeButtonContainer: {
    marginBottom: Spacing.xl,
  },
});
