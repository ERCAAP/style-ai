"use strict";
/**
 * Push Token Registration Handler
 *
 * Supports both Android (FCM/Expo) and iOS (Expo) platforms
 * Saves token for multiple user IDs (Firebase UID + RevenueCat ID)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPushToken = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
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
exports.registerPushToken = (0, https_1.onCall)({
    region: 'europe-west1',
    timeoutSeconds: 30,
    memory: '256MiB',
}, async (request) => {
    console.log('[registerPushToken] Request received');
    // Data validation
    const { visitorId, persistentId, token, tokenType, platform, language } = request.data;
    if (!token || typeof token !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Token is required');
    }
    if (!tokenType || !['expo', 'fcm'].includes(tokenType)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid token type');
    }
    if (!platform || !['ios', 'android'].includes(platform)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid platform');
    }
    // At least one ID is required
    if (!visitorId && !persistentId) {
        throw new https_1.HttpsError('invalid-argument', 'At least one user ID is required');
    }
    try {
        // Validate token format
        const isExpoToken = token.startsWith('ExponentPushToken[');
        const isFCMToken = token.length > 100 && !isExpoToken;
        if (!isExpoToken && !isFCMToken) {
            throw new https_1.HttpsError('invalid-argument', 'Invalid token format');
        }
        // Determine final token type
        let finalTokenType = tokenType;
        if (isExpoToken && tokenType !== 'expo') {
            finalTokenType = 'expo';
        }
        else if (isFCMToken && tokenType !== 'fcm') {
            finalTokenType = 'fcm';
        }
        const now = admin.firestore.Timestamp.now();
        const userLanguage = language || 'tr';
        // Collect all IDs to save
        const idsToSave = [visitorId, persistentId].filter((id) => Boolean(id));
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
    }
    catch (error) {
        console.error('[registerPushToken] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', `Failed to register token: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
    }
});
//# sourceMappingURL=pushTokenRegistration.js.map