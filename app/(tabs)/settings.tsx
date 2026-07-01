import { View, Text, ScrollView, StyleSheet, Alert, Linking, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeContainer, Header, Card } from '@/components/ui';
import { SettingsRow, SettingsSwitch } from '@/components/settings';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuthContext } from '@/contexts';
import { Colors, Typography, Spacing, BorderRadius, Layout, ContainerSizes, IconSizes } from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { MiniPremiumAnimation } from '@/components/animated';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '@/i18n';
import Purchases from 'react-native-purchases';

function SubscriptionCard() {
  const router = useRouter();
  const { isPremium } = useAuthContext();
  const { t } = useTranslation();

  if (isPremium) {
    return (
      <Card style={styles.subscriptionCard} variant="elevated">
        <View style={styles.subscriptionContent}>
          <View style={[styles.subscriptionIcon, styles.premiumIcon]}>
            <MiniPremiumAnimation size={wp('7%')} />
          </View>
          <View style={styles.subscriptionText}>
            <Text style={styles.subscriptionTitle}>{t('settings.subscription.premium.title')}</Text>
            <Text style={styles.subscriptionSubtitle}>{t('settings.subscription.premium.subtitle')}</Text>
          </View>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>{t('settings.subscription.premium.badge')}</Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.subscriptionCard} variant="gradient" onPress={() => router.push('/paywall')}>
      <View style={styles.subscriptionContent}>
        <View style={styles.subscriptionIcon}>
          <MiniPremiumAnimation size={wp('10%')} />
        </View>
        <View style={styles.subscriptionText}>
          <Text style={styles.subscriptionTitle}>{t('settings.subscription.free.title')}</Text>
          <Text style={styles.subscriptionSubtitle}>{t('settings.subscription.free.subtitle')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={IconSizes.md} color={Colors.text.muted} />
      </View>
    </Card>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { isAnonymous, user } = useAuthContext();
  const { t } = useTranslation();
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const {
    settings: notificationSettings,
    isLoading: notificationsLoading,
    permissionStatus,
    toggleNotifications,
  } = useNotifications();

  // Bildirim toggle handler
  const handleToggleNotifications = useCallback(async (enabled: boolean) => {
    try {
      await toggleNotifications(enabled);
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.alerts.notificationError.message'));
    }
  }, [toggleNotifications, t]);

  const handleOpenNotificationSettings = () => {
    Linking.openSettings();
  };

  const handleManageSubscription = () => {
    router.push('/paywall');
  };

  const handleTerms = () => {
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://bohoapp.online/privacy-policy');
  };

  const handleChangeLanguage = async (lang: 'tr' | 'en') => {
    try {
      // AsyncStorage'a kaydet ve i18n'i güncelle (sadece yerel)
      await changeLanguage(lang);
      setIsLanguageModalVisible(false);
    } catch (error) {
      console.error('Language change error:', error);
      Alert.alert(t('common.error'), 'Dil değiştirilirken bir hata oluştu / Error changing language');
    }
  };

  const handleAbout = () => {
    Alert.alert(
      t('settings.about.title', { appName: t('app.name') }),
      t('settings.about.description'),
      [{ text: t('common.ok') }]
    );
  };

  const handleRestorePurchases = async () => {
    try {
      setIsRestoring(true);

      const customerInfo = await Purchases.restorePurchases();

      // Pro entitlement'ı kontrol et
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;

      if (isPro) {
        Alert.alert(
          t('settings.account.restore.success.title'),
          t('settings.account.restore.success.message'),
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(
          t('settings.account.restore.notFound.title'),
          t('settings.account.restore.notFound.message'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error: any) {
      console.error('Restore purchases error:', error);
      Alert.alert(
        t('common.error'),
        t('settings.account.restore.error.message'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeContainer>
      <Header title={t('settings.title')} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription Card */}
        <SubscriptionCard />

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.sections.language')}</Text>
          <Card style={styles.settingsGroup}>
            <SettingsRow
              icon="language-outline"
              title={getCurrentLanguage() === 'tr' ? 'Türkçe' : 'English'}
              subtitle={t('settings.language.subtitle')}
              onPress={() => setIsLanguageModalVisible(true)}
            />
          </Card>
        </View>

        {/* Language Modal */}
        <Modal
          visible={isLanguageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsLanguageModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsLanguageModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('settings.language.modal.title')}</Text>
                <TouchableOpacity onPress={() => setIsLanguageModalVisible(false)}>
                  <Ionicons name="close" size={IconSizes.lg} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => handleChangeLanguage('tr')}
              >
                <View style={styles.languageRow}>
                  <Ionicons
                    name="language-outline"
                    size={IconSizes.md}
                    color={getCurrentLanguage() === 'tr' ? Colors.accent.primary : Colors.text.secondary}
                  />
                  <Text style={[
                    styles.languageText,
                    getCurrentLanguage() === 'tr' && styles.languageTextActive
                  ]}>
                    Türkçe
                  </Text>
                </View>
                {getCurrentLanguage() === 'tr' && (
                  <Ionicons name="checkmark-circle" size={IconSizes.md} color={Colors.accent.primary} />
                )}
              </TouchableOpacity>

              <View style={styles.modalDivider} />

              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => handleChangeLanguage('en')}
              >
                <View style={styles.languageRow}>
                  <Ionicons
                    name="language-outline"
                    size={IconSizes.md}
                    color={getCurrentLanguage() === 'en' ? Colors.accent.primary : Colors.text.secondary}
                  />
                  <Text style={[
                    styles.languageText,
                    getCurrentLanguage() === 'en' && styles.languageTextActive
                  ]}>
                    English
                  </Text>
                </View>
                {getCurrentLanguage() === 'en' && (
                  <Ionicons name="checkmark-circle" size={IconSizes.md} color={Colors.accent.primary} />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.sections.notifications')}</Text>
          <Card style={styles.settingsGroup}>
            {permissionStatus === 'denied' ? (
              <SettingsRow
                icon="notifications-off-outline"
                title={t('settings.notifications.disabled.title')}
                subtitle={t('settings.notifications.disabled.subtitle')}
                onPress={handleOpenNotificationSettings}
              />
            ) : (
              <SettingsSwitch
                icon="notifications-outline"
                title={t('settings.notifications.title')}
                subtitle={t('settings.notifications.subtitle')}
                value={notificationSettings.enabled}
                onValueChange={handleToggleNotifications}
                disabled={notificationsLoading}
              />
            )}
          </Card>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.sections.account')}</Text>
          <Card style={styles.settingsGroup}>
            <SettingsRow
              icon="person-outline"
              title={t('settings.account.info.title')}
              subtitle={isAnonymous ? t('settings.account.info.anonymous') : user?.email || t('settings.account.info.registered')}
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="star-outline"
              title={t('settings.subscription.manage')}
              onPress={handleManageSubscription}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="refresh-outline"
              title={t('settings.account.restore.title')}
              onPress={handleRestorePurchases}
              rightElement={
                isRestoring ? (
                  <ActivityIndicator size="small" color={Colors.accent.primary} />
                ) : undefined
              }
            />
          </Card>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.sections.legal')}</Text>
          <Card style={styles.settingsGroup}>
            <SettingsRow
              icon="document-text-outline"
              title={t('settings.legal.terms')}
              onPress={handleTerms}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="shield-checkmark-outline"
              title={t('settings.legal.privacy')}
              onPress={handlePrivacy}
            />
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.sections.support')}</Text>
          <Card style={styles.settingsGroup}>
            <SettingsRow
              icon="information-circle-outline"
              title={t('settings.support.about')}
              onPress={handleAbout}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="mail-outline"
              title={t('settings.support.contact')}
              subtitle="ercaanp@gmail.com"
              onPress={() => Linking.openURL('mailto:ercaanp@gmail.com')}
            />
          </Card>
        </View>

        {/* Version Info */}
        <Text style={styles.versionText}>{t('settings.version')}</Text>

        {/* Bottom padding for tab bar */}
        <View style={{ height: Layout.tabBarHeight + Spacing.xl }} />
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Layout.screenPadding,
  },
  subscriptionCard: {
    marginBottom: Spacing.md,
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  subscriptionIcon: {
    width: ContainerSizes.lg,
    height: ContainerSizes.lg,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.premium.start + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumIcon: {
    backgroundColor: Colors.premium.start + '20',
  },
  subscriptionText: {
    flex: 1,
  },
  subscriptionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: hp('0.25%'),
  },
  subscriptionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  premiumBadge: {
    backgroundColor: Colors.accent.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  premiumBadgeText: {
    ...Typography.caption,
    color: Colors.accent.success,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  settingsGroup: {
    padding: 0,
    overflow: 'hidden',
  },
  divider: {
    height: hp('0.1%'),
    backgroundColor: Colors.border.light,
    marginLeft: Spacing.base + ContainerSizes.sm + wp('1%') + Spacing.md,
  },
  versionText: {
    ...Typography.caption,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  languageText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  languageTextActive: {
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: wp('85%'),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginHorizontal: Spacing.base,
  },
});
