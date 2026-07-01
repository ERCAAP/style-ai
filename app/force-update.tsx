import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { getForceUpdateConfig } from '@/services/firebase/remoteConfig';
import { Ionicons } from '@expo/vector-icons';

export default function ForceUpdateScreen() {
  const { t } = useTranslation();
  const config = getForceUpdateConfig();

  const handleUpdate = () => {
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/id6742742442', // Replace with your actual App Store ID
      android: 'https://play.google.com/store/apps/details?id=com.outfit.planner.app',
      default: 'https://bohoapp.online',
    });

    Linking.openURL(storeUrl).catch((err) => {
      console.error('[ForceUpdate] Failed to open store:', err);
    });
  };

  return (
    <LinearGradient
      colors={[Colors.background.start, Colors.background.end]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="arrow-up-circle" size={100} color={Colors.accent.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{config.title}</Text>

        {/* Message */}
        <Text style={styles.message}>{config.message}</Text>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>{t('forceUpdate.currentVersion')}:</Text>
            <Text style={styles.versionValue}>{config.currentVersion}</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>{t('forceUpdate.requiredVersion')}:</Text>
            <Text style={styles.versionValueRequired}>{config.minimumVersion}</Text>
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdate}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.accent.primary, Colors.accent.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.updateButtonGradient}
          >
            <Ionicons name="download" size={24} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.updateButtonText}>{t('forceUpdate.updateButton')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Store Info */}
        <Text style={styles.storeInfo}>
          {t('forceUpdate.storeInfo')} {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  versionInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    maxWidth: 300,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  versionLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  versionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  versionValueRequired: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent.primary,
  },
  updateButton: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  buttonIcon: {
    marginRight: 12,
  },
  updateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storeInfo: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
