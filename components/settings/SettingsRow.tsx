import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, IconSizes, ContainerSizes } from '@/constants/theme';

type SettingsRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
  variant?: 'default' | 'danger';
  disabled?: boolean;
};

export function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightElement,
  variant = 'default',
  disabled = false,
}: SettingsRowProps) {
  const handlePress = () => {
    if (disabled || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const iconColor = variant === 'danger' ? Colors.accent.error : Colors.accent.primary;

  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled || !onPress}
    >
      <View style={[styles.rowIcon, variant === 'danger' && styles.rowIconDanger]}>
        <Ionicons name={icon} size={IconSizes.sm} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, variant === 'danger' && styles.rowTitleDanger]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {showArrow && !rightElement && onPress && (
        <Ionicons name="chevron-forward" size={IconSizes.sm} color={Colors.text.muted} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowIcon: {
    width: ContainerSizes.sm + 4,
    height: ContainerSizes.sm + 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  rowTitleDanger: {
    color: Colors.accent.error,
  },
  rowSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});
