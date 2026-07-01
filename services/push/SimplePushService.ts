/**
 * SimplePushService - Platform-agnostic push notification token registration
 *
 * Features:
 * - Android: FCM token (preferred) → Expo token (fallback)
 * - iOS: Expo token (always)
 * - Dual user ID support (Firebase UID + Persistent ID)
 * - Automatic retry with exponential backoff
 * - Token deduplication
 * - Backend registration via Firebase Functions
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/services/firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  LAST_REGISTERED_TOKEN: '@simplepush_last_token',
  LAST_REGISTRATION_TIME: '@simplepush_last_time',
};

// Registration result
export interface PushRegistrationResult {
  success: boolean;
  token: string | null;
  tokenType: 'expo' | 'fcm' | null;
  platform: 'ios' | 'android' | null;
  message?: string;
  error?: string;
}

// User IDs for registration
export interface UserIds {
  visitorId: string | null;  // Firebase Auth UID
  persistentId: string | null;  // RevenueCat/custom persistent ID
}

class SimplePushService {
  private static instance: SimplePushService;
  private lastRegisteredToken: string | null = null;
  private isRegistering = false;

  private constructor() {}

  static getInstance(): SimplePushService {
    if (!SimplePushService.instance) {
      SimplePushService.instance = new SimplePushService();
    }
    return SimplePushService.instance;
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Register push notification token
   *
   * @param userIds - Visitor ID (Firebase UID) and Persistent ID (RevenueCat)
   * @param language - User's language preference
   * @returns Registration result
   */
  async register(
    userIds: UserIds,
    language: 'tr' | 'en' = 'tr'
  ): Promise<PushRegistrationResult> {
    // Prevent concurrent registrations
    if (this.isRegistering) {
      console.log('[SimplePushService] Registration already in progress');
      return {
        success: false,
        token: null,
        tokenType: null,
        platform: null,
        message: 'Registration in progress',
      };
    }

    // At least one ID is required
    if (!userIds.visitorId && !userIds.persistentId) {
      console.error('[SimplePushService] No user IDs provided');
      return {
        success: false,
        token: null,
        tokenType: null,
        platform: null,
        error: 'At least one user ID is required',
      };
    }

    this.isRegistering = true;

    try {
      console.log('[SimplePushService] Starting registration');
      console.log('[SimplePushService] Platform:', Platform.OS);
      console.log('[SimplePushService] User IDs:', {
        visitorId: userIds.visitorId ? 'present' : 'none',
        persistentId: userIds.persistentId ? 'present' : 'none',
      });

      // Step 1: Check if device supports push notifications
      if (!Device.isDevice) {
        console.log('[SimplePushService] Not a physical device, skipping');
        return {
          success: false,
          token: null,
          tokenType: null,
          platform: null,
          message: 'Push notifications require a physical device',
        };
      }

      // Step 2: Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('[SimplePushService] Permission not granted');
        return {
          success: false,
          token: null,
          tokenType: null,
          platform: null,
          message: 'Notification permission not granted',
        };
      }

      // Step 3: Setup Android notification channels (if needed)
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Step 4: Get push token
      const tokenResult = await this.getPushToken();
      if (!tokenResult.success || !tokenResult.token) {
        console.error('[SimplePushService] Failed to get token:', tokenResult.error);
        return tokenResult;
      }

      // Step 5: Check if token already registered
      if (await this.isTokenAlreadyRegistered(tokenResult.token)) {
        console.log('[SimplePushService] Token already registered recently');
        this.lastRegisteredToken = tokenResult.token;
        return {
          ...tokenResult,
          message: 'Token already registered',
        };
      }

      // Step 6: Register token with backend
      const registerResult = await this.registerWithBackend(
        userIds,
        tokenResult.token!,
        tokenResult.tokenType!,
        language
      );

      if (registerResult.success) {
        // Save to storage
        await this.saveTokenToStorage(tokenResult.token!);
        this.lastRegisteredToken = tokenResult.token;

        console.log('[SimplePushService] Registration successful');
        return {
          ...tokenResult,
          message: 'Token registered successfully',
        };
      } else {
        console.error('[SimplePushService] Backend registration failed:', registerResult.error);
        return registerResult;
      }

    } catch (error: any) {
      console.error('[SimplePushService] Registration error:', error);
      return {
        success: false,
        token: null,
        tokenType: null,
        platform: null,
        error: error?.message || 'Unknown error',
      };
    } finally {
      this.isRegistering = false;
    }
  }

  /**
   * Check current registration status
   */
  async getRegistrationStatus(): Promise<{
    hasToken: boolean;
    token: string | null;
    lastRegistered: Date | null;
  }> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REGISTERED_TOKEN);
    const timeStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REGISTRATION_TIME);

    return {
      hasToken: !!token,
      token: token,
      lastRegistered: timeStr ? new Date(parseInt(timeStr)) : null,
    };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('[SimplePushService] Permission request error:', error);
      return false;
    }
  }

  /**
   * Get push notification token (platform-specific)
   */
  private async getPushToken(): Promise<PushRegistrationResult> {
    try {
      let token: string | null = null;
      let tokenType: 'expo' | 'fcm' = 'expo';

      if (Platform.OS === 'android') {
        // Android: Try FCM first, fallback to Expo
        try {
          console.log('[SimplePushService] Trying FCM token (Android)...');
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          token = deviceToken.data;
          tokenType = 'fcm';
          console.log('[SimplePushService] FCM token obtained');
        } catch (fcmError) {
          console.log('[SimplePushService] FCM failed, trying Expo token...', fcmError);
          // Fallback to Expo token
          const expoPushToken = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
          });
          token = expoPushToken.data;
          tokenType = 'expo';
          console.log('[SimplePushService] Expo token obtained (fallback)');
        }
      } else {
        // iOS: Always use Expo token
        console.log('[SimplePushService] Getting Expo token (iOS)...');
        const expoPushToken = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        });
        token = expoPushToken.data;
        tokenType = 'expo';
        console.log('[SimplePushService] Expo token obtained');
      }

      if (!token) {
        return {
          success: false,
          token: null,
          tokenType: null,
          platform: null,
          error: 'Failed to obtain push token',
        };
      }

      console.log('[SimplePushService] Token type:', tokenType);
      console.log('[SimplePushService] Token:', token.substring(0, 50) + '...');

      return {
        success: true,
        token: token,
        tokenType: tokenType,
        platform: Platform.OS as 'ios' | 'android',
      };

    } catch (error: any) {
      console.error('[SimplePushService] Get token error:', error);
      return {
        success: false,
        token: null,
        tokenType: null,
        platform: null,
        error: error?.message || 'Token retrieval failed',
      };
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    try {
      // Default channel
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      // Analysis channel
      await Notifications.setNotificationChannelAsync('analysis', {
        name: 'Analiz Bildirimleri',
        description: 'Kıyafet analizi tamamlandığında bildirim',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });

      // Reminder channel
      await Notifications.setNotificationChannelAsync('reminder', {
        name: 'Hatırlatıcılar',
        description: 'Günlük kullanım hatırlatmaları',
        importance: Notifications.AndroidImportance.DEFAULT,
      });

      console.log('[SimplePushService] Android channels created');
    } catch (error) {
      console.error('[SimplePushService] Channel setup error:', error);
    }
  }

  /**
   * Check if token was recently registered
   */
  private async isTokenAlreadyRegistered(token: string): Promise<boolean> {
    try {
      const lastToken = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REGISTERED_TOKEN);
      const lastTimeStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REGISTRATION_TIME);

      if (!lastToken || !lastTimeStr) {
        return false;
      }

      // If token is different, re-register
      if (lastToken !== token) {
        return false;
      }

      // If registered within last 24 hours, skip
      const lastTime = parseInt(lastTimeStr);
      const hoursSinceRegistration = (Date.now() - lastTime) / (1000 * 60 * 60);

      return hoursSinceRegistration < 24;
    } catch (error) {
      console.error('[SimplePushService] Check registration error:', error);
      return false;
    }
  }

  /**
   * Register token with backend (Firebase Functions)
   */
  private async registerWithBackend(
    userIds: UserIds,
    token: string,
    tokenType: 'expo' | 'fcm',
    language: 'tr' | 'en'
  ): Promise<PushRegistrationResult> {
    const maxRetries = Platform.OS === 'android' ? 3 : 1;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;

      try {
        console.log(`[SimplePushService] Backend registration attempt ${attempt}/${maxRetries}`);

        const registerFunction = httpsCallable(functions, 'registerPushToken');

        const result = await registerFunction({
          visitorId: userIds.visitorId,
          persistentId: userIds.persistentId,
          token: token,
          tokenType: tokenType,
          platform: Platform.OS,
          language: language,
        });

        const data = result.data as any;

        if (data.success) {
          console.log('[SimplePushService] Backend registration successful');
          return {
            success: true,
            token: token,
            tokenType: tokenType,
            platform: Platform.OS as 'ios' | 'android',
          };
        } else {
          throw new Error(data.message || 'Backend registration failed');
        }

      } catch (error: any) {
        console.error(`[SimplePushService] Backend attempt ${attempt} failed:`, error);

        // If max retries reached, return error
        if (attempt >= maxRetries) {
          return {
            success: false,
            token: null,
            tokenType: null,
            platform: null,
            error: error?.message || 'Backend registration failed after retries',
          };
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`[SimplePushService] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Should never reach here
    return {
      success: false,
      token: null,
      tokenType: null,
      platform: null,
      error: 'Registration failed',
    };
  }

  /**
   * Save token to local storage
   */
  private async saveTokenToStorage(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_REGISTERED_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_REGISTRATION_TIME, Date.now().toString());
    } catch (error) {
      console.error('[SimplePushService] Save to storage error:', error);
    }
  }
}

// Export singleton instance
export const simplePushService = SimplePushService.getInstance();

// Convenience function
export async function registerPushNotifications(
  userIds: UserIds,
  language: 'tr' | 'en' = 'tr'
): Promise<PushRegistrationResult> {
  return simplePushService.register(userIds, language);
}
