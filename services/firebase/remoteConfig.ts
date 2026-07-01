import { getRemoteConfig, fetchAndActivate, getValue, RemoteConfig } from 'firebase/remote-config';
import { app } from './config';
import Constants from 'expo-constants';

let remoteConfig: RemoteConfig | null = null;

// Default config values
const defaultConfig = {
  maintenance_mode: false,
  maintenance_title: 'Bakım Çalışması',
  maintenance_message: 'Uygulamamız şu anda bakım çalışması nedeniyle kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
  force_update_enabled: false,
  minimum_app_version: '1.0.0',
  force_update_title: 'Güncelleme Gerekli',
  force_update_message: 'Uygulamayı kullanmaya devam etmek için lütfen son sürüme güncelleyin.',
  active_offering_id: 'mira_model_test',
  use_fallback_offering: true,
};

/**
 * Initialize Firebase Remote Config
 */
export async function initializeRemoteConfig(): Promise<void> {
  try {
    if (!remoteConfig) {
      // Check if Firebase app is properly initialized
      if (!app) {
        console.warn('[RemoteConfig] Firebase app not initialized, using default config');
        return;
      }

      remoteConfig = getRemoteConfig(app);

      // Set config settings
      remoteConfig.settings.minimumFetchIntervalMillis = __DEV__ ? 0 : 3600000; // 1 hour in production, instant in dev

      // Set default values
      remoteConfig.defaultConfig = defaultConfig;
    }

    // Fetch and activate config
    await fetchAndActivate(remoteConfig);
    console.log('[RemoteConfig] Initialized and activated');
  } catch (error: any) {
    // IndexedDB is not available in React Native - this is expected
    // Silently fall back to default values
    if (error?.code === 'remoteconfig/indexed-db-unavailable') {
      console.log('[RemoteConfig] Using default values (IndexedDB not available in React Native)');
    } else {
      console.warn('[RemoteConfig] Using default values due to initialization error');
    }
    // Fallback to default values on error
  }
}

/**
 * Get current app version from app.json
 */
function getCurrentAppVersion(): string {
  try {
    return Constants.expoConfig?.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

/**
 * Compare semver versions
 * Returns true if current version is less than required version
 */
function isVersionLessThan(current: string, required: string): boolean {
  try {
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const currentPart = currentParts[i] || 0;
      const requiredPart = requiredParts[i] || 0;

      if (currentPart < requiredPart) return true;
      if (currentPart > requiredPart) return false;
    }

    return false; // Versions are equal
  } catch {
    return false; // If parsing fails, don't force update
  }
}

/**
 * Check if maintenance mode is enabled
 */
export function isMaintenanceModeEnabled(): boolean {
  if (!remoteConfig) return false;

  try {
    const value = getValue(remoteConfig, 'maintenance_mode');
    return value.asBoolean();
  } catch {
    return false;
  }
}

/**
 * Get maintenance mode configuration
 */
export function getMaintenanceConfig(): {
  enabled: boolean;
  title: string;
  message: string;
} {
  if (!remoteConfig) {
    return {
      enabled: false,
      title: defaultConfig.maintenance_title,
      message: defaultConfig.maintenance_message,
    };
  }

  try {
    return {
      enabled: getValue(remoteConfig, 'maintenance_mode').asBoolean(),
      title: getValue(remoteConfig, 'maintenance_title').asString() || defaultConfig.maintenance_title,
      message: getValue(remoteConfig, 'maintenance_message').asString() || defaultConfig.maintenance_message,
    };
  } catch {
    return {
      enabled: false,
      title: defaultConfig.maintenance_title,
      message: defaultConfig.maintenance_message,
    };
  }
}

/**
 * Check if force update is required
 */
export function isForceUpdateRequired(): boolean {
  if (!remoteConfig) return false;

  try {
    const enabled = getValue(remoteConfig, 'force_update_enabled').asBoolean();
    if (!enabled) return false;

    const minimumVersion = getValue(remoteConfig, 'minimum_app_version').asString();
    const currentVersion = getCurrentAppVersion();

    return isVersionLessThan(currentVersion, minimumVersion);
  } catch {
    return false;
  }
}

/**
 * Get force update configuration
 */
export function getForceUpdateConfig(): {
  required: boolean;
  currentVersion: string;
  minimumVersion: string;
  title: string;
  message: string;
} {
  const currentVersion = getCurrentAppVersion();

  if (!remoteConfig) {
    return {
      required: false,
      currentVersion,
      minimumVersion: defaultConfig.minimum_app_version,
      title: defaultConfig.force_update_title,
      message: defaultConfig.force_update_message,
    };
  }

  try {
    const enabled = getValue(remoteConfig, 'force_update_enabled').asBoolean();
    const minimumVersion = getValue(remoteConfig, 'minimum_app_version').asString() || defaultConfig.minimum_app_version;
    const required = enabled && isVersionLessThan(currentVersion, minimumVersion);

    return {
      required,
      currentVersion,
      minimumVersion,
      title: getValue(remoteConfig, 'force_update_title').asString() || defaultConfig.force_update_title,
      message: getValue(remoteConfig, 'force_update_message').asString() || defaultConfig.force_update_message,
    };
  } catch {
    return {
      required: false,
      currentVersion,
      minimumVersion: defaultConfig.minimum_app_version,
      title: defaultConfig.force_update_title,
      message: defaultConfig.force_update_message,
    };
  }
}

/**
 * Get active offering ID for paywall
 */
export function getActiveOfferingId(): string {
  if (!remoteConfig) return defaultConfig.active_offering_id;

  try {
    return getValue(remoteConfig, 'active_offering_id').asString() || defaultConfig.active_offering_id;
  } catch {
    return defaultConfig.active_offering_id;
  }
}

/**
 * Check if should use fallback offering
 */
export function shouldUseFallbackOffering(): boolean {
  if (!remoteConfig) return defaultConfig.use_fallback_offering;

  try {
    return getValue(remoteConfig, 'use_fallback_offering').asBoolean();
  } catch {
    return defaultConfig.use_fallback_offering;
  }
}

/**
 * Refresh remote config (fetch latest values)
 */
export async function refreshRemoteConfig(): Promise<void> {
  if (!remoteConfig) {
    await initializeRemoteConfig();
    return;
  }

  try {
    await fetchAndActivate(remoteConfig);
    console.log('[RemoteConfig] Refreshed and activated');
  } catch (error) {
    console.error('[RemoteConfig] Refresh error:', error);
  }
}
