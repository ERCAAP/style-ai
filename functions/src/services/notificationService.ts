/**
 * Notification Service - Hybrid iOS (Expo Push) + Android (FCM)
 *
 * Platform-specific notification delivery:
 * - iOS: Expo Push Notifications API
 * - Android: Firebase Cloud Messaging (FCM)
 *
 * Features:
 * - Multi-language support (TR, EN)
 * - Analysis complete notifications
 * - Virtual try-on complete notifications
 * - Admin broadcast notifications
 * - Automatic platform detection
 */

import * as admin from 'firebase-admin';
import axios from 'axios';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

// Supported languages
export type SupportedLanguage = 'tr' | 'en';

// Notification types
export type NotificationType =
  | 'analysis_complete'
  | 'tryon_complete'
  | 'wardrobe_added'
  | 'daily_reminder'
  | 'broadcast'
  | 'system';

// Push token info from Firestore
export interface UserPushToken {
  token: string;
  type: 'expo' | 'fcm';
  platform: 'ios' | 'android';
  language?: SupportedLanguage;
  enabled?: boolean;
}

// Notification data structure
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

// ============================================
// LOCALIZED NOTIFICATION MESSAGES
// ============================================

const NOTIFICATION_MESSAGES: Record<
  SupportedLanguage,
  Record<NotificationType, (data?: Record<string, any>) => { title: string; body: string }>
> = {
  tr: {
    analysis_complete: (data) => ({
      title: '✨ Analiz Tamamlandı',
      body: data?.score
        ? `Kombinin ${data.score.toFixed(1)}/10 puan aldı! ${data.score >= 8 ? '🎉' : data.score >= 6 ? '👍' : '💡'}`
        : 'Kıyafet analiziniz hazır!',
    }),
    tryon_complete: () => ({
      title: '👔 Sanal Deneme Hazır',
      body: 'Kıyafet deneme işleminiz tamamlandı! Sonucu görmek için tıklayın.',
    }),
    wardrobe_added: (data) => ({
      title: '👗 Gardıroba Eklendi',
      body: data?.itemName
        ? `"${data.itemName}" gardırobunuza başarıyla eklendi!`
        : 'Yeni kıyafet gardırobunuza eklendi!',
    }),
    daily_reminder: () => ({
      title: '☀️ Günün Kombini',
      body: 'Bugün kıyafetini analiz etmeyi unuttun mu? Hemen dene!',
    }),
    broadcast: (data) => ({
      title: data?.title || '📢 BOHO',
      body: data?.body || 'Yeni bir duyurumuz var!',
    }),
    system: (data) => ({
      title: data?.title || 'BOHO',
      body: data?.body || 'Yeni bir bildiriminiz var.',
    }),
  },
  en: {
    analysis_complete: (data) => ({
      title: '✨ Analysis Complete',
      body: data?.score
        ? `Your outfit scored ${data.score.toFixed(1)}/10! ${data.score >= 8 ? '🎉' : data.score >= 6 ? '👍' : '💡'}`
        : 'Your outfit analysis is ready!',
    }),
    tryon_complete: () => ({
      title: '👔 Virtual Try-On Ready',
      body: 'Your try-on is complete! Tap to see the result.',
    }),
    wardrobe_added: (data) => ({
      title: '👗 Added to Wardrobe',
      body: data?.itemName
        ? `"${data.itemName}" has been added to your wardrobe!`
        : 'New item added to your wardrobe!',
    }),
    daily_reminder: () => ({
      title: '☀️ Daily Outfit',
      body: 'Did you forget to analyze your outfit today? Try now!',
    }),
    broadcast: (data) => ({
      title: data?.title || '📢 BOHO',
      body: data?.body || 'We have a new announcement!',
    }),
    system: (data) => ({
      title: data?.title || 'BOHO',
      body: data?.body || 'You have a new notification.',
    }),
  },
};

// Get localized notification message
export function getLocalizedNotificationMessage(
  type: NotificationType,
  language: SupportedLanguage = 'tr',
  data?: Record<string, any>
): { title: string; body: string } {
  const messages = NOTIFICATION_MESSAGES[language] || NOTIFICATION_MESSAGES.tr;
  const getMessage = messages[type] || messages.system;
  return getMessage(data);
}

// ============================================
// PUSH TOKEN FETCHING
// ============================================

/**
 * Get user's push token from Firestore
 */
export async function getUserPushToken(userId: string): Promise<UserPushToken | null> {
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.log(`[NotificationService] User ${userId} not found`);
      return null;
    }

    const userData = userDoc.data()!;

    // Check if push token exists
    if (!userData.pushToken) {
      console.log(`[NotificationService] User ${userId} has no push token`);
      return null;
    }

    // Check if notifications are enabled
    const notificationSettings = userData.notificationSettings || {};
    if (notificationSettings.enabled === false) {
      console.log(`[NotificationService] User ${userId} has notifications disabled`);
      return null;
    }

    return {
      token: userData.pushToken,
      type: userData.pushTokenType || 'expo',
      platform: userData.pushTokenPlatform || 'ios',
      language: userData.language || userData.pushTokenLanguage || 'tr',
      enabled: notificationSettings.enabled !== false,
    };
  } catch (error) {
    console.error(`[NotificationService] Error fetching push token for user ${userId}:`, error);
    return null;
  }
}

// ============================================
// SEND NOTIFICATIONS BY PLATFORM
// ============================================

/**
 * Send notification via Expo Push Notifications (iOS)
 */
async function sendExpoPushNotification(
  expoPushToken: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const message = {
      to: expoPushToken,
      sound: payload.sound || 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      priority: payload.priority || 'high',
      badge: payload.badge,
      channelId: payload.channelId || 'default',
    };

    console.log('[NotificationService] Sending Expo Push:', {
      to: expoPushToken.substring(0, 20) + '...',
      title: message.title,
    });

    const response = await axios.post(EXPO_PUSH_API, message, {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
    });

    if (response.data?.data?.[0]?.status === 'ok') {
      console.log('[NotificationService] Expo Push sent successfully');
      return true;
    } else {
      console.error('[NotificationService] Expo Push failed:', response.data);
      return false;
    }
  } catch (error: any) {
    console.error('[NotificationService] Expo Push error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Send notification via Firebase Cloud Messaging (Android)
 */
async function sendFCMNotification(
  fcmToken: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data ? Object.fromEntries(
        Object.entries(payload.data).map(([key, value]) => [key, String(value)])
      ) : {},
      android: {
        priority: payload.priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: payload.channelId || 'default',
          sound: payload.sound || 'default',
          priority: payload.priority === 'high' ? 'high' : 'default',
        },
      },
    };

    console.log('[NotificationService] Sending FCM:', {
      to: fcmToken.substring(0, 20) + '...',
      title: message.notification?.title,
    });

    const response = await admin.messaging().send(message);
    console.log('[NotificationService] FCM sent successfully:', response);
    return true;
  } catch (error: any) {
    console.error('[NotificationService] FCM error:', error.message);

    // If token is invalid, remove it from Firestore
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      console.log('[NotificationService] Invalid FCM token, should be removed');
      // Don't throw, just return false
    }

    return false;
  }
}

// ============================================
// UNIFIED NOTIFICATION SENDER
// ============================================

/**
 * Send notification to a single user (auto-detects platform)
 */
export async function sendNotificationToUser(
  userId: string,
  type: NotificationType,
  data?: Record<string, any>,
  customMessage?: { title: string; body: string }
): Promise<boolean> {
  try {
    // 1. Get user's push token
    const tokenInfo = await getUserPushToken(userId);

    if (!tokenInfo) {
      console.log(`[NotificationService] Cannot send notification to user ${userId} (no token)`);
      return false;
    }

    // 2. Get localized message
    const message = customMessage || getLocalizedNotificationMessage(
      type,
      tokenInfo.language || 'tr',
      data
    );

    // 3. Build payload
    const payload: NotificationPayload = {
      type,
      title: message.title,
      body: message.body,
      data: {
        type,
        ...data,
      },
      sound: 'default',
      priority: type === 'broadcast' || type === 'system' ? 'high' : 'default',
      channelId: getChannelId(type),
    };

    // 4. Send based on platform
    let success = false;

    if (tokenInfo.platform === 'ios' && tokenInfo.type === 'expo') {
      // iOS: Use Expo Push
      success = await sendExpoPushNotification(tokenInfo.token, payload);
    } else if (tokenInfo.platform === 'android' && tokenInfo.type === 'fcm') {
      // Android: Use FCM
      success = await sendFCMNotification(tokenInfo.token, payload);
    } else if (tokenInfo.type === 'expo') {
      // Fallback: Try Expo Push for both platforms
      success = await sendExpoPushNotification(tokenInfo.token, payload);
    } else {
      console.warn(`[NotificationService] Unknown token type: ${tokenInfo.type} for platform: ${tokenInfo.platform}`);
      return false;
    }

    if (success) {
      console.log(`[NotificationService] Notification sent to user ${userId}`);
    }

    return success;
  } catch (error) {
    console.error(`[NotificationService] Error sending notification to user ${userId}:`, error);
    return false;
  }
}

/**
 * Get Android notification channel ID based on type
 */
function getChannelId(type: NotificationType): string {
  switch (type) {
    case 'analysis_complete':
    case 'tryon_complete':
      return 'analysis';
    case 'daily_reminder':
      return 'reminder';
    case 'broadcast':
    case 'system':
      return 'default';
    default:
      return 'default';
  }
}

// ============================================
// SPECIALIZED NOTIFICATION FUNCTIONS
// ============================================

/**
 * Send analysis complete notification
 */
export async function sendAnalysisCompleteNotification(
  userId: string,
  score: number,
  analysisId?: string
): Promise<boolean> {
  return sendNotificationToUser(
    userId,
    'analysis_complete',
    {
      score,
      analysisId,
    }
  );
}

/**
 * Send virtual try-on complete notification
 */
export async function sendTryOnCompleteNotification(
  userId: string,
  predictionId: string,
  resultUrl?: string
): Promise<boolean> {
  return sendNotificationToUser(
    userId,
    'tryon_complete',
    {
      predictionId,
      resultUrl,
    }
  );
}

/**
 * Send wardrobe item added notification
 */
export async function sendWardrobeAddedNotification(
  userId: string,
  itemName: string,
  itemId?: string
): Promise<boolean> {
  return sendNotificationToUser(
    userId,
    'wardrobe_added',
    {
      itemName,
      itemId,
    }
  );
}

// ============================================
// BROADCAST NOTIFICATIONS
// ============================================

/**
 * Send broadcast notification to all users
 */
export async function sendBroadcastNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  targetLanguage?: SupportedLanguage
): Promise<{ sent: number; failed: number }> {
  try {
    // Fetch all users with push tokens
    let query = admin.firestore().collection('users')
      .where('pushToken', '!=', null);

    // Filter by language if specified
    if (targetLanguage) {
      query = query.where('language', '==', targetLanguage);
    }

    const usersSnapshot = await query.get();
    console.log(`[NotificationService] Broadcasting to ${usersSnapshot.size} users`);

    let sent = 0;
    let failed = 0;

    // Send in batches to avoid overwhelming the system
    const batchSize = 100;
    const users = usersSnapshot.docs;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const promises = batch.map(async (userDoc) => {
        const success = await sendNotificationToUser(
          userDoc.id,
          'broadcast',
          data,
          { title, body }
        );

        if (success) {
          sent++;
        } else {
          failed++;
        }
      });

      await Promise.all(promises);

      // Small delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[NotificationService] Broadcast complete: ${sent} sent, ${failed} failed`);

    return { sent, failed };
  } catch (error) {
    console.error('[NotificationService] Broadcast error:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send localized broadcast (each user receives in their language)
 */
export async function sendLocalizedBroadcast(
  messages: Record<SupportedLanguage, { title: string; body: string }>,
  data?: Record<string, any>
): Promise<{ sent: number; failed: number }> {
  try {
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('pushToken', '!=', null)
      .get();

    console.log(`[NotificationService] Sending localized broadcast to ${usersSnapshot.size} users`);

    let sent = 0;
    let failed = 0;

    const promises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      const userLanguage = userData.language || userData.pushTokenLanguage || 'tr';
      const message = messages[userLanguage as SupportedLanguage] || messages.tr;

      const success = await sendNotificationToUser(
        userDoc.id,
        'broadcast',
        data,
        message
      );

      if (success) {
        sent++;
      } else {
        failed++;
      }
    });

    await Promise.all(promises);

    console.log(`[NotificationService] Localized broadcast complete: ${sent} sent, ${failed} failed`);

    return { sent, failed };
  } catch (error) {
    console.error('[NotificationService] Localized broadcast error:', error);
    return { sent: 0, failed: 0 };
  }
}
