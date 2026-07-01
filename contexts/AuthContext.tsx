// AuthContext - Global auth state yonetimi

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  AppUser,
  signInAnonymouslyAsync,
  signOut as firebaseSignOut,
  onAuthStateChange,
  getUserProfile,
  updateSubscriptionStatus,
} from '@/services/firebase/auth';
import { getDeviceId } from '@/services/device';
import { UserPreferences, DEFAULT_USER_PREFERENCES } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_STORAGE_KEYS } from '@/constants/onboarding';
import { registerPushNotifications } from '@/services/push/SimplePushService';
import { purchasesService } from '@/services/purchases';
import Purchases from 'react-native-purchases';
import { changeLanguage, getCurrentLanguage } from '@/i18n';

// Kullanici profil tipi
interface UserProfile {
  subscription: {
    status: 'free' | 'trial' | 'active' | 'expired' | 'cancelled';
    plan: string | null;
    startDate: Date | null;
    endDate: Date | null;
  };
  usage: {
    totalJobs: number;
    analysisToday: number;
    tryOnToday: number;
    dailyLimit: number;
    lastJobDate: Date | null;
  };
  preferences: {
    notificationsEnabled: boolean;
    language: string;
  };
  flags: {
    isBlocked: boolean;
    isVIP: boolean;
  };
}

// Context degerleri tipi
interface AuthContextType {
  // Kullanici bilgileri
  user: AppUser | null;
  profile: UserProfile | null;

  // Durumlar
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isPremium: boolean;
  isBlocked: boolean;

  // Kullanim limitleri (Premium: 30 analiz + 30 tryon/gun, Free: 0)
  analysisToday: number;
  tryOnToday: number;
  analysisRemaining: number;
  tryOnRemaining: number;
  dailyAnalysisLimit: number;
  dailyTryOnLimit: number;

  // Device & Preferences
  deviceId: string | null;
  userPreferences: UserPreferences | null;

  // Aksiyonlar
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUserPreferences: () => Promise<void>;
}

// Default context degerleri
const defaultContext: AuthContextType = {
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isAnonymous: false,
  isPremium: false,
  isBlocked: false,
  analysisToday: 0,
  tryOnToday: 0,
  analysisRemaining: 0,
  tryOnRemaining: 0,
  dailyAnalysisLimit: 0,
  dailyTryOnLimit: 0,
  deviceId: null,
  userPreferences: null,
  signInAnonymously: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshUserPreferences: async () => {},
};

// Context olustur
const AuthContext = createContext<AuthContextType>(defaultContext);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [revenueCatProStatus, setRevenueCatProStatus] = useState<boolean>(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // RevenueCat'ten pro durumunu kontrol et (Source of Truth)
  const checkRevenueCatProStatus = useCallback(async (uid: string) => {
    try {
      console.log('[AuthContext] Checking RevenueCat pro status...');
      const customerInfo = await Purchases.getCustomerInfo();
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;

      console.log('[AuthContext] RevenueCat pro status:', isPro);
      setRevenueCatProStatus(isPro);

      // Firebase ile senkronize et
      // RevenueCat'teki durum Firebase'den farklıysa güncelle
      const currentStatus = isPro ? 'active' : 'free';

      // Firebase'i güncelle (cache olarak)
      try {
        const activeSubscription = Object.values(customerInfo.entitlements.active)[0] as any;
        const productId = activeSubscription?.productIdentifier || 'pro';

        await updateSubscriptionStatus(uid, currentStatus, isPro ? productId : undefined);
        console.log('[AuthContext] Firebase synced with RevenueCat:', currentStatus);
      } catch (syncError) {
        console.warn('[AuthContext] Firebase sync error (non-critical):', syncError);
      }

      return isPro;
    } catch (error) {
      console.error('[AuthContext] RevenueCat check error:', error);
      // Hata durumunda Firebase'den fallback yap
      return false;
    }
  }, []);

  // Profil bilgilerini cek
  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const userProfile = await getUserProfile(uid);

      if (userProfile) {
        setProfile({
          subscription: {
            status: userProfile.subscription?.status || 'free',
            plan: userProfile.subscription?.plan || null,
            startDate: userProfile.subscription?.startDate?.toDate() || null,
            endDate: userProfile.subscription?.endDate?.toDate() || null,
          },
          usage: {
            totalJobs: userProfile.usage?.totalJobs || 0,
            analysisToday: userProfile.usage?.analysisToday || 0,
            tryOnToday: userProfile.usage?.tryOnToday || 0,
            dailyLimit: userProfile.usage?.dailyLimit || 0,
            lastJobDate: userProfile.usage?.lastJobDate?.toDate() || null,
          },
          preferences: {
            notificationsEnabled: userProfile.preferences?.notificationsEnabled ?? true,
            language: getCurrentLanguage(), // Sadece mevcut dili kaydet, Firebase'den senkronizasyon yok
          },
          flags: {
            isBlocked: userProfile.flags?.isBlocked || false,
            isVIP: userProfile.flags?.isVIP || false,
          },
        });
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  }, []);

  // User preferences'i AsyncStorage'dan cek
  const fetchUserPreferences = useCallback(async () => {
    try {
      const answersJson = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.ANSWERS);
      if (answersJson) {
        const answers = JSON.parse(answersJson);
        setUserPreferences({
          stylePreferences: answers.stylePreferences || [],
          bodyType: answers.bodyType || null,
          favoriteColors: answers.favoriteColors || [],
          usageGoals: answers.usageGoals || [],
          language: 'tr',
          notificationsEnabled: true,
        });
      } else {
        setUserPreferences(DEFAULT_USER_PREFERENCES);
      }
    } catch (error) {
      console.error('Fetch user preferences error:', error);
      setUserPreferences(DEFAULT_USER_PREFERENCES);
    }
  }, []);

  // Device ID'yi baslangicta al
  useEffect(() => {
    const initDeviceId = async () => {
      try {
        const id = await getDeviceId();
        setDeviceId(id);
      } catch (error) {
        console.error('Get device ID error:', error);
      }
    };
    initDeviceId();
  }, []);

  // User preferences'i baslangicta al
  useEffect(() => {
    fetchUserPreferences();
  }, [fetchUserPreferences]);

  // RevenueCat customer info listener - Real-time subscription updates
  useEffect(() => {
    if (!user) return;

    console.log('[AuthContext] Setting up RevenueCat listener for user:', user.uid);

    // Add listener for customer info updates (purchase, restore, renewal, cancellation)
    Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
      console.log('[AuthContext] RevenueCat customer info updated');
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;

      console.log('[AuthContext] Updated pro status:', isPro);
      setRevenueCatProStatus(isPro);

      // Sync to Firebase
      try {
        const currentStatus = isPro ? 'active' : 'free';
        const activeSubscription = Object.values(customerInfo.entitlements.active)[0] as any;
        const productId = activeSubscription?.productIdentifier || 'pro';

        await updateSubscriptionStatus(user.uid, currentStatus, isPro ? productId : undefined);
        console.log('[AuthContext] Firebase synced after customer info update:', currentStatus);
      } catch (syncError) {
        console.warn('[AuthContext] Firebase sync error after update:', syncError);
      }
    });

    // Note: RevenueCat listener cleanup is automatic on SDK level
  }, [user]);

  // App state listener - Uygulama foreground'a geldiğinde RevenueCat kontrol et
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // Background'dan foreground'a geçiş
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[AuthContext] App came to foreground, checking RevenueCat status...');

        if (user) {
          // RevenueCat'ten en güncel durumu kontrol et
          await checkRevenueCatProStatus(user.uid);
          console.log('[AuthContext] RevenueCat status refreshed on foreground');
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user, checkRevenueCatProStatus]);

  // Auth state listener - otomatik anonim giris
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await fetchProfile(authUser.uid);

        // CRITICAL: Check RevenueCat pro status (Source of Truth)
        await checkRevenueCatProStatus(authUser.uid);

        // Register push notification token
        try {
          console.log('[AuthContext] Registering push token for user:', authUser.uid);
          const result = await registerPushNotifications(
            {
              visitorId: authUser.uid,
              persistentId: null, // TODO: Add RevenueCat persistent ID if needed
            },
            getCurrentLanguage()
          );

          if (result.success) {
            console.log('[AuthContext] Push token registered successfully');
          } else {
            console.log('[AuthContext] Push token registration failed:', result.error);
          }
        } catch (pushError) {
          // Don't fail auth if push registration fails
          console.error('[AuthContext] Push registration error:', pushError);
        }

        setIsLoading(false);
      } else {
        // Kullanici yoksa otomatik anonim giris yap
        try {
          const anonUser = await signInAnonymouslyAsync();
          setUser(anonUser);
          await fetchProfile(anonUser.uid);

          // Check RevenueCat for anonymous user too
          await checkRevenueCatProStatus(anonUser.uid);

          // Register push token for anonymous user
          try {
            console.log('[AuthContext] Registering push token for anonymous user');
            await registerPushNotifications(
              {
                visitorId: anonUser.uid,
                persistentId: null,
              },
              getCurrentLanguage()
            );
          } catch (pushError) {
            console.error('[AuthContext] Anonymous push registration error:', pushError);
          }
        } catch (error) {
          console.error('Auto anonymous sign in error:', error);
        }
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchProfile, checkRevenueCatProStatus]);

  // Anonim giris
  const signInAnonymously = useCallback(async () => {
    setIsLoading(true);
    try {
      const authUser = await signInAnonymouslyAsync();
      setUser(authUser);
      await fetchProfile(authUser.uid);
    } catch (error) {
      console.error('Sign in anonymously error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  // Cikis yap
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Profili yenile (RevenueCat'ten de kontrol et)
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.uid);
      // RevenueCat'ten tekrar kontrol et (satın alma/restore sonrası)
      await checkRevenueCatProStatus(user.uid);
    }
  }, [user, fetchProfile, checkRevenueCatProStatus]);

  // User preferences'i yenile
  const refreshUserPreferences = useCallback(async () => {
    await fetchUserPreferences();
  }, [fetchUserPreferences]);

  // Hesaplanan degerler
  const isAuthenticated = !!user;
  const isAnonymous = user?.isAnonymous ?? false;

  // CRITICAL: Use RevenueCat as source of truth for premium status
  // Firebase is only used as fallback if RevenueCat check fails
  const isPremium = revenueCatProStatus;

  const isBlocked = profile?.flags.isBlocked ?? false;

  // Premium limitleri (gunluk 30 analiz + 30 tryon)
  const PREMIUM_ANALYSIS_LIMIT = 30;
  const PREMIUM_TRYON_LIMIT = 30;

  // Bugunun kullanim sayilari
  const today = new Date().toDateString();
  const lastActivityDate = profile?.usage.lastJobDate?.toDateString();
  const isSameDay = lastActivityDate === today;

  const analysisToday = isSameDay ? (profile?.usage.analysisToday || 0) : 0;
  const tryOnToday = isSameDay ? (profile?.usage.tryOnToday || 0) : 0;

  // Limitler ve kalan haklar
  const dailyAnalysisLimit = isPremium ? PREMIUM_ANALYSIS_LIMIT : 0;
  const dailyTryOnLimit = isPremium ? PREMIUM_TRYON_LIMIT : 0;
  const analysisRemaining = isPremium ? Math.max(0, PREMIUM_ANALYSIS_LIMIT - analysisToday) : 0;
  const tryOnRemaining = isPremium ? Math.max(0, PREMIUM_TRYON_LIMIT - tryOnToday) : 0;

  // Context degeri
  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated,
    isAnonymous,
    isPremium,
    isBlocked,
    analysisToday,
    tryOnToday,
    analysisRemaining,
    tryOnRemaining,
    dailyAnalysisLimit,
    dailyTryOnLimit,
    deviceId,
    userPreferences,
    signInAnonymously,
    signOut,
    refreshProfile,
    refreshUserPreferences,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}

// Export context (test icin)
export { AuthContext };
