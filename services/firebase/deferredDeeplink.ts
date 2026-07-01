/**
 * Deferred Deep Linking Service
 *
 * Handles attribution when users install the app via App Store.
 * Uses device fingerprinting and clipboard to match install to original click.
 */

import { Platform, Dimensions } from 'react-native';
import * as Localization from 'expo-localization';
import { db } from './config';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

// Optional clipboard import - will be null if not available
let Clipboard: any = null;
try {
  Clipboard = require('expo-clipboard');
} catch (error) {
  console.warn('expo-clipboard not available, using fingerprint-only deferred deep linking');
}

interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  fingerprint: string;
}

interface DeferredDeeplinkResult {
  referrer: string | null;
  trackingId: string | null;
  method: 'clipboard' | 'fingerprint' | 'none';
}

/**
 * Generate device fingerprint for matching
 */
function generateDeviceFingerprint(): DeviceFingerprint {
  const { width, height, scale } = Dimensions.get('window');
  const screenResolution = `${Math.round(width * scale)}x${Math.round(height * scale)}x${scale}`;
  const timezone = Localization.getCalendars()[0]?.timeZone || 'unknown';
  const language = Localization.getLocales()[0]?.languageTag || 'unknown';
  const platform = Platform.OS;

  // Create a simple fingerprint (not for security, just for matching)
  const fingerprintData = `${platform}${screenResolution}${timezone}${language}`;
  // Use a simple hash instead of Buffer (which is not available in React Native)
  const fingerprint = fingerprintData
    .split('')
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
    .toString(36)
    .substring(0, 32);

  return {
    userAgent: Platform.OS === 'ios' ? 'iOS' : 'Android',
    screenResolution,
    timezone,
    language,
    platform,
    fingerprint,
  };
}

/**
 * Check clipboard for tracking ID (iOS only)
 * Web page copies "BOHO:trackingId" to clipboard on iOS
 */
async function checkClipboardForTrackingId(): Promise<string | null> {
  // Check if clipboard module is available
  if (!Clipboard) {
    console.log('📋 Clipboard module not available, skipping clipboard check');
    return null;
  }

  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    const clipboardContent = await Clipboard.getStringAsync();

    // Check if clipboard contains our tracking ID format
    if (clipboardContent && clipboardContent.startsWith('BOHO:')) {
      const trackingId = clipboardContent.replace('BOHO:', '');
      console.log('📋 Found tracking ID in clipboard:', trackingId);

      // Clear clipboard after reading (privacy)
      await Clipboard.setStringAsync('');

      return trackingId;
    }
  } catch (error) {
    console.warn('Could not read clipboard:', error);
  }

  return null;
}

/**
 * Query Firebase for recent unmatched clicks based on device fingerprint
 */
async function queryFirebaseForMatch(fingerprint: DeviceFingerprint): Promise<DeferredDeeplinkResult | null> {
  try {
    const deeplinkRef = collection(db, 'deeplinkTracking');

    // Query for recent unmatched clicks from the same platform
    // Look for clicks in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const q = query(
      deeplinkRef,
      where('platform', '==', Platform.OS),
      where('converted', '==', false),
      where('clickedAt', '>', Timestamp.fromDate(oneDayAgo)),
      orderBy('clickedAt', 'desc'),
      limit(50) // Check last 50 clicks
    );

    const querySnapshot = await getDocs(q);

    // Try to match based on device fingerprint
    for (const doc of querySnapshot.docs) {
      const data = doc.data();

      // Match based on fingerprint components
      let matchScore = 0;

      if (data.deviceFingerprint === fingerprint.fingerprint) {
        matchScore += 10; // Exact fingerprint match
      }

      if (data.screenResolution === fingerprint.screenResolution) {
        matchScore += 3;
      }

      if (data.timezone === fingerprint.timezone) {
        matchScore += 2;
      }

      if (data.language === fingerprint.language) {
        matchScore += 2;
      }

      // If match score is high enough, consider it a match
      if (matchScore >= 10) {
        console.log('✅ Matched deferred deeplink via fingerprint:', {
          trackingId: data.trackingId,
          referrer: data.referrer,
          matchScore,
        });

        return {
          referrer: data.referrer,
          trackingId: data.trackingId,
          method: 'fingerprint',
        };
      }
    }

    console.log('⚠️ No matching deferred deeplink found');
    return null;
  } catch (error) {
    console.error('Error querying Firebase for deferred deeplink:', error);
    return null;
  }
}

/**
 * Query Firebase by tracking ID directly
 */
async function queryFirebaseByTrackingId(trackingId: string): Promise<DeferredDeeplinkResult | null> {
  try {
    const deeplinkRef = collection(db, 'deeplinkTracking');

    const q = query(
      deeplinkRef,
      where('trackingId', '==', trackingId),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();

      console.log('✅ Found tracking ID in Firebase:', {
        trackingId: data.trackingId,
        referrer: data.referrer,
      });

      return {
        referrer: data.referrer,
        trackingId: data.trackingId,
        method: 'clipboard',
      };
    }

    return null;
  } catch (error) {
    console.error('Error querying Firebase by tracking ID:', error);
    return null;
  }
}

/**
 * Main function: Get deferred deeplink attribution
 *
 * Tries multiple methods in order:
 * 1. Clipboard (iOS only) - most reliable
 * 2. Device fingerprint matching - fallback
 */
export async function getDeferredDeeplink(): Promise<DeferredDeeplinkResult> {
  console.log('🔍 Checking for deferred deeplink attribution...');

  // Method 1: Check clipboard for tracking ID (iOS only)
  const clipboardTrackingId = await checkClipboardForTrackingId();
  if (clipboardTrackingId) {
    const result = await queryFirebaseByTrackingId(clipboardTrackingId);
    if (result) {
      return result;
    }
  }

  // Method 2: Device fingerprint matching
  const fingerprint = generateDeviceFingerprint();
  console.log('📱 Device fingerprint:', fingerprint.fingerprint);

  const fingerprintResult = await queryFirebaseForMatch(fingerprint);
  if (fingerprintResult) {
    return fingerprintResult;
  }

  // No match found
  return {
    referrer: null,
    trackingId: null,
    method: 'none',
  };
}
