// Analysis Purpose Modal
// Analiz amacını seçmek için modal

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export interface AnalysisPurpose {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const ANALYSIS_PURPOSES: AnalysisPurpose[] = [
  {
    id: 'general',
    label: 'Genel Değerlendirme',
    icon: 'star-outline',
    description: 'Kıyafetimin bana uygun olup olmadığını değerlendir',
  },
  {
    id: 'dinner',
    label: 'Akşam Yemeği',
    icon: 'restaurant-outline',
    description: 'Akşam yemeği için uygun mu?',
  },
  {
    id: 'wedding',
    label: 'Düğün',
    icon: 'flower-outline',
    description: 'Düğün için uygun mu?',
  },
  {
    id: 'engagement',
    label: 'Nişan',
    icon: 'heart-outline',
    description: 'Nişan için uygun mu?',
  },
  {
    id: 'party',
    label: 'Parti / Balo',
    icon: 'musical-notes-outline',
    description: 'Parti veya balo için uygun mu?',
  },
  {
    id: 'business',
    label: 'İş Toplantısı',
    icon: 'briefcase-outline',
    description: 'İş ortamı için uygun mu?',
  },
  {
    id: 'casual',
    label: 'Günlük Kullanım',
    icon: 'cafe-outline',
    description: 'Günlük kullanım için nasıl?',
  },
  {
    id: 'date',
    label: 'Randevu',
    icon: 'rose-outline',
    description: 'Romantik randevu için uygun mu?',
  },
];

interface AnalysisPurposeModalProps {
  visible: boolean;
  selectedPurposes: string[];
  onClose: () => void;
  onConfirm: (purposes: string[]) => void;
  onTogglePurpose: (purposeId: string) => void;
}

export function AnalysisPurposeModal({
  visible,
  selectedPurposes,
  onClose,
  onConfirm,
  onTogglePurpose,
}: AnalysisPurposeModalProps) {
  const handleConfirm = () => {
    if (selectedPurposes.length === 0) {
      // En az bir seçenek seçilmeli
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(selectedPurposes);
  };

  const handlePurposePress = (purposeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTogglePurpose(purposeId);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      <View style={styles.container}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="options-outline" size={24} color={Colors.accent.primary} />
            </View>
            <Text style={styles.title}>Analiz Amacı Seçin</Text>
            <Text style={styles.subtitle}>
              Kıyafetinizi hangi amaç için değerlendirmemi istersiniz?
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>

          {/* Purposes List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {ANALYSIS_PURPOSES.map((purpose) => {
              const isSelected = selectedPurposes.includes(purpose.id);
              return (
                <TouchableOpacity
                  key={purpose.id}
                  style={[styles.purposeItem, isSelected && styles.purposeItemSelected]}
                  onPress={() => handlePurposePress(purpose.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.purposeIconContainer}>
                    <Ionicons
                      name={purpose.icon as any}
                      size={24}
                      color={isSelected ? Colors.accent.primary : Colors.text.muted}
                    />
                  </View>
                  <View style={styles.purposeInfo}>
                    <Text style={[styles.purposeLabel, isSelected && styles.purposeLabelSelected]}>
                      {purpose.label}
                    </Text>
                    <Text style={styles.purposeDescription}>{purpose.description}</Text>
                  </View>
                  <View
                    style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color={Colors.text.white} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.selectedCount}>
              {selectedPurposes.length} seçenek seçildi
            </Text>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                selectedPurposes.length === 0 && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={selectedPurposes.length === 0}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color={Colors.text.white} />
              <Text style={styles.confirmButtonText}>Analiz Et</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card.primary,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: hp('80%'),
    ...Shadows.xl,
  },
  header: {
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    position: 'relative',
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    maxHeight: hp('45%'),
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  purposeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  purposeItemSelected: {
    backgroundColor: Colors.accent.primarySoft,
    borderColor: Colors.accent.primary,
  },
  purposeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purposeInfo: {
    flex: 1,
  },
  purposeLabel: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  purposeLabelSelected: {
    color: Colors.accent.primary,
  },
  purposeDescription: {
    ...Typography.caption,
    color: Colors.text.muted,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    gap: Spacing.md,
  },
  selectedCount: {
    ...Typography.caption,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.border.medium,
    opacity: 0.5,
  },
  confirmButtonText: {
    ...Typography.button,
    color: Colors.text.white,
    fontWeight: '600',
  },
});
