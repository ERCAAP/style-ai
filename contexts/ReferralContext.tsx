import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Platform, Dimensions } from 'react-native';
import * as Localization from 'expo-localization';
import {
  trackDeeplinkClick,
  trackAppInstall,
  trackAppOpen,
  trackPurchase as trackPurchaseAnalytics,
  trackAnalysis as trackAnalysisAnalytics,
} from '@/services/firebase/analytics';
import { getDeferredDeeplink } from '@/services/firebase/deferredDeeplink';

/**
 * Referral Context for Deeplink and Analytics Tracking
 *
 * Flow:
 * 1. User clicks https://bohoapp.online/user?user=omer
 * 2. Web tracks click and generates trackingId
 * 3. App opens with deeplink: styleai://user?user=omer&trackingId=xxx
 * 4. ReferralContext stores referrer info
 * 5. All future actions (install, purchase, analysis) are tracked
 */

const STORAGE_KEYS = {
  REFERRER: '@boho_referrer',
  TRACKING_ID: '@boho_tracking_id',
  FIRST_OPEN: '@boho_first_open',
  USER_ID: '@boho_user_id',
};

interface ReferralContextType {
  referrer: string | null;
  trackingId: string | null;
  isFirstOpen: boolean;
  setReferrer: (referrer: string, trackingId?: string) => Promise<void>;
  clearReferrer: () => Promise<void>;
  trackPurchase: (amount: number) => Promise<void>;
  trackAnalysis: (analysisType: string) => Promise<void>;
  getUserId: () => Promise<string>;
}

const ReferralContext = createContext<ReferralContextType | undefined>(
  undefined
);

export function useReferral(): ReferralContextType {
  const context = useContext(ReferralContext);
  if (!context) {
    throw new Error('useReferral must be used within ReferralProvider');
  }
  return context;
}

interface ReferralProviderProps {
  children: ReactNode;
}

export function ReferralProvider({ children }: ReferralProviderProps) {
  const [referrer, setReferrerState] = useState<string | null>(null);
  const [trackingId, setTrackingIdState] = useState<string | null>(null);
  const [isFirstOpen, setIsFirstOpen] = useState<boolean>(false);

  // Initialize on mount
  useEffect(() => {
    initializeReferral();
    setupDeeplinkListener();
  }, []);

  /**
   * Initialize referral data from storage
   */
  async function initializeReferral() {
    try {
      const storedReferrer = await AsyncStorage.getItem(STORAGE_KEYS.REFERRER);
      const storedTrackingId = await AsyncStorage.getItem(
        STORAGE_KEYS.TRACKING_ID
      );
      const firstOpen = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_OPEN);

      setReferrerState(storedReferrer);
      setTrackingIdState(storedTrackingId);
      setIsFirstOpen(firstOpen === null); // If null, this is first open

      // If this is first open, check for deferred deep linking
      if (firstOpen === null) {
        console.log('🆕 First app open detected');

        // If we don't have a referrer from deeplink, try deferred deep linking
        if (!storedReferrer) {
          console.log('🔍 No direct deeplink found, trying deferred deep linking...');

          const deferredResult = await getDeferredDeeplink();

          if (deferredResult.referrer && deferredResult.trackingId) {
            console.log('✅ Deferred deeplink attribution successful!', {
              referrer: deferredResult.referrer,
              method: deferredResult.method,
            });

            // Store the referrer from deferred deep linking
            await setReferrer(deferredResult.referrer, deferredResult.trackingId);

            // Update state
            setReferrerState(deferredResult.referrer);
            setTrackingIdState(deferredResult.trackingId);

            // Mark the deferred deeplink as converted in Firebase
            try {
              const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
              const { db } = await import('@/services/firebase/config');
              const trackingRef = doc(db, 'deeplinkTracking', deferredResult.trackingId);
              await updateDoc(trackingRef, {
                converted: true,
                convertedAt: serverTimestamp(),
                conversionMethod: deferredResult.method, // 'clipboard' or 'fingerprint'
              });
              console.log('📊 Deferred deeplink marked as converted:', deferredResult.trackingId);
            } catch (error) {
              console.warn('Could not mark deferred deeplink as converted:', error);
            }
          } else {
            console.log('⚠️ No deferred deeplink found - organic install');
          }
        } else {
          console.log('✅ Direct deeplink found:', storedReferrer);
        }

        // Track install if we have a referrer (from deeplink or deferred)
        const finalReferrer = storedReferrer || (await AsyncStorage.getItem(STORAGE_KEYS.REFERRER));
        if (finalReferrer) {
          const userId = await getUserId();
          const platform = Platform.OS as 'ios' | 'android';
          const finalTrackingId = storedTrackingId || (await AsyncStorage.getItem(STORAGE_KEYS.TRACKING_ID));

          await trackAppInstall(
            finalReferrer,
            userId,
            platform,
            finalTrackingId || undefined
          );

          console.log('📊 App install tracked:', {
            referrer: finalReferrer,
            trackingId: finalTrackingId,
          });
        }

        // Mark as not first open
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_OPEN, 'false');
        setIsFirstOpen(false);
      }
    } catch (error) {
      console.error('Error initializing referral:', error);
    }
  }

  /**
   * Setup deeplink listener
   */
  function setupDeeplinkListener() {
    // Handle initial URL (app opened from deeplink)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeeplink(url);
      }
    });

    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeeplink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }

  /**
   * Handle deeplink
   * Supported formats:
   * - styleai://user?user=omer
   * - styleai://user?user=omer&trackingId=xxx
   * - https://bohoapp.online/user?user=omer
   * - styleai://home (ana sayfaya yönlendirme)
   */
  async function handleDeeplink(url: string) {
    try {
      console.log('📱 Deeplink received:', url);

      const parsed = Linking.parse(url);
      const queryParams = parsed.queryParams;

      // Check if this is a home redirect
      if (parsed.hostname === 'home' || parsed.path === 'home' || url.includes('home')) {
        console.log('🏠 Home deeplink detected, redirecting to main tabs...');

        // Import router dynamically to avoid circular imports
        const { router } = await import('expo-router');
        router.replace('/(tabs)');

        return;
      }

      // Check if this is a user referral link
      if (
        (parsed.hostname === 'user' || parsed.path === 'user') &&
        queryParams?.user
      ) {
        const username = queryParams.user as string;
        const trackingIdFromUrl = queryParams.trackingId as string | undefined;

        await setReferrer(username, trackingIdFromUrl);

        // Track app open if not first open
        const firstOpen = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_OPEN);
        if (firstOpen !== null) {
          const userId = await getUserId();
          const platform = Platform.OS as 'ios' | 'android';
          await trackAppOpen(username, userId, platform);
        }

        console.log('✅ Referrer set from deeplink:', username);
      }
    } catch (error) {
      console.error('Error handling deeplink:', error);
    }
  }

  /**
   * Set referrer
   */
  async function setReferrer(
    username: string,
    trackingIdValue?: string
  ): Promise<void> {
    const cleaned = username.toLowerCase().trim();
    await AsyncStorage.setItem(STORAGE_KEYS.REFERRER, cleaned);
    setReferrerState(cleaned);

    if (trackingIdValue) {
      await AsyncStorage.setItem(STORAGE_KEYS.TRACKING_ID, trackingIdValue);
      setTrackingIdState(trackingIdValue);
    }
  }

  /**
   * Clear referrer
   */
  async function clearReferrer(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.REFERRER,
      STORAGE_KEYS.TRACKING_ID,
    ]);
    setReferrerState(null);
    setTrackingIdState(null);
  }

  /**
   * Get or create user ID (device-based)
   */
  async function getUserId(): Promise<string> {
    let userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

    if (!userId) {
      // Generate unique user ID
      userId = `user_${Platform.OS}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    }

    return userId;
  }

  /**
   * Track purchase
   */
  async function trackPurchase(amount: number): Promise<void> {
    if (!referrer) return;

    try {
      const userId = await getUserId();
      const platform = Platform.OS as 'ios' | 'android';

      await trackPurchaseAnalytics(referrer, userId, amount, platform);
      console.log(`✅ Purchase tracked: $${amount}`);
    } catch (error) {
      console.error('Error tracking purchase:', error);
    }
  }

  /**
   * Track analysis
   */
  async function trackAnalysis(analysisType: string): Promise<void> {
    if (!referrer) return;

    try {
      const userId = await getUserId();
      const platform = Platform.OS as 'ios' | 'android';

      await trackAnalysisAnalytics(referrer, userId, analysisType, platform);
      console.log(`✅ Analysis tracked: ${analysisType}`);
    } catch (error) {
      console.error('Error tracking analysis:', error);
    }
  }

  const value: ReferralContextType = {
    referrer,
    trackingId,
    isFirstOpen,
    setReferrer,
    clearReferrer,
    trackPurchase,
    trackAnalysis,
    getUserId,
  };

  return (
    <ReferralContext.Provider value={value}>
      {children}
    </ReferralContext.Provider>
  );
}

export default ReferralContext;
