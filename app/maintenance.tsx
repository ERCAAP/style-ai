import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { getMaintenanceConfig, refreshRemoteConfig } from '@/services/firebase/remoteConfig';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';

export default function MaintenanceScreen() {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const config = getMaintenanceConfig();

  const handleRetry = async () => {
    setIsRefreshing(true);
    try {
      // Refresh remote config to check if maintenance is over
      await refreshRemoteConfig();
      const updatedConfig = getMaintenanceConfig();

      if (!updatedConfig.enabled) {
        // Maintenance is over, navigate to home
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('[Maintenance] Retry failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.background.start, Colors.background.end]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="construct" size={100} color={Colors.accent.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{config.title}</Text>

        {/* Message */}
        <Text style={styles.message}>{config.message}</Text>

        {/* Animated Dots */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>

        {/* Retry Button */}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          disabled={isRefreshing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.accent.primary, Colors.accent.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.retryButtonGradient}
          >
            {isRefreshing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="refresh" size={24} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          {t('maintenance.notification')}
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
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent.primary,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  retryButton: {
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
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  buttonIcon: {
    marginRight: 12,
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
