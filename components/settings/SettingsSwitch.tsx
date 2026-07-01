import { View, Text, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, IconSizes, ContainerSizes } from '@/constants/theme';

type SettingsSwitchProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function SettingsSwitch({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
}: SettingsSwitchProps) {
  const handleChange = (newValue: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(newValue);
  };

  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={IconSizes.sm} color={Colors.accent.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        trackColor={{
          false: Colors.border.light,
          true: Colors.accent.primary + '60',
        }}
        thumbColor={value ? Colors.accent.primary : Colors.text.muted}
        ios_backgroundColor={Colors.border.light}
      />
    </View>
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
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  rowSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});
