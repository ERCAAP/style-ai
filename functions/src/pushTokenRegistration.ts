/**
 * Push Token Registration Handler
 *
 * Supports both Android (FCM/Expo) and iOS (Expo) platforms
 * Saves token for multiple user IDs (Firebase UID + RevenueCat ID)
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Register push notification token
 *
 * Usage:
 * {
 *   "visitorId": "firebase-auth-uid",
 *   "persistentId": "revenuecat-user-id",
 *   "token": "ExponentPushToken[xxx]" or "fcm-token",
 *   "tokenType": "expo" | "fcm",
 *   "platform": "ios" | "android",
 *   "language": "tr" | "en"
 * }
 */
export const registerPushToken = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    console.log('[registerPushToken] Request received');

    // Data validation
    const { visitorId, persistentId, token, tokenType, platform, language } = request.data;

    if (!token || typeof token !== 'string') {
      throw new HttpsError('invalid-argument', 'Token is required');
    }

    if (!tokenType || !['expo', 'fcm'].includes(tokenType)) {
      throw new HttpsError('invalid-argument', 'Invalid token type');
    }

    if (!platform || !['ios', 'android'].includes(platform)) {
      throw new HttpsError('invalid-argument', 'Invalid platform');
    }

    // At least one ID is required
    if (!visitorId && !persistentId) {
      throw new HttpsError('invalid-argument', 'At least one user ID is required');
    }

    try {
      // Validate token format
      const isExpoToken = token.startsWith('ExponentPushToken[');
      const isFCMToken = token.length > 100 && !isExpoToken;

      if (!isExpoToken && !isFCMToken) {
        throw new HttpsError('invalid-argument', 'Invalid token format');
      }

      // Determine final token type
      let finalTokenType = tokenType;
      if (isExpoToken && tokenType !== 'expo') {
        finalTokenType = 'expo';
      } else if (isFCMToken && tokenType !== 'fcm') {
        finalTokenType = 'fcm';
      }

      const now = admin.firestore.Timestamp.now();
      const userLanguage = language || 'tr';

      // Collect all IDs to save
      const idsToSave = [visitorId, persistentId].filter((id): id is string => Boolean(id));
      console.log(`[registerPushToken] Saving token for ${idsToSave.length} user IDs`);

      // Save token for each user ID
      for (const userId of idsToSave) {
        // 1. Update user document
        await db.collection('users').doc(userId).set({
          pushToken: token,
          pushTokenType: finalTokenType,
          pushTokenPlatform: platform,
          pushTokenLanguage: userLanguage,
          language: userLanguage,
          pushTokenUpdatedAt: now,
          pushTokenIsActive: true,
          notificationSettings: {
            enabled: true,
          },
        }, { merge: true });

        console.log(`[registerPushToken] Token saved for user ${userId}`);
      }

      // 2. Save to pushTokens collection (for analytics and deduplication)
      const tokenId = Buffer.from(token).toString('base64').substring(0, 20);
      await db.collection('pushTokens').doc(tokenId).set({
        token: token,
        tokenType: finalTokenType,
        platform: platform,
        language: userLanguage,
        userIds: idsToSave,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      }, { merge: true });

      console.log('[registerPushToken] Token registered successfully');

      return {
        success: true,
        message: 'Token registered successfully',
        tokenType: finalTokenType,
        platform: platform,
      };

    } catch (error: any) {
      console.error('[registerPushToken] Error:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to register token: ${error?.message || 'Unknown error'}`);
    }
  }
);
