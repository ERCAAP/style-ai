import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '@/constants/theme';
import { MiniPremiumAnimation } from '@/components/animated';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
  onBackPress?: () => void;
  transparent?: boolean;
}

export function Header({
  title,
  showBack = false,
  showLogo = false,
  rightAction,
  onBackPress,
  transparent = false,
}: HeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.header, transparent && styles.transparent]}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color={Colors.text.primary} />
          </TouchableOpacity>
        )}
        {showLogo && (
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>{t('app.name')}</Text>
          </View>
        )}
      </View>

      {title && !showLogo && (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      )}

      <View style={styles.rightSection}>
        {rightAction}
      </View>
    </View>
  );
}

// Premium Badge component (header'da kullanilacak)
export function PremiumBadge({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.premiumBadge}
      activeOpacity={0.8}
    >
      <MiniPremiumAnimation size={wp('8%')} />
      <Text style={styles.premiumText}>PRO</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    backgroundColor: 'transparent',
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    color: Colors.text.primary,
    flex: 2,
    textAlign: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    ...Typography.h2,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  logoTextAccent: {
    ...Typography.h2,
    color: Colors.accent.primary,
    fontWeight: '700',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumText: {
    ...Typography.tag,
    color: Colors.premium.start,
    fontWeight: '700',
  },
});
