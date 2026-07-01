// User Preferences Service - Kullanici tercihleri yonetimi
// Onboarding cevaplari ve kisisel tercihler

import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { OnboardingAnswers } from '@/types/onboarding';
import { UserPreferences } from '@/types/user';

// Onboarding cevaplarini kullanici profiline kaydet
export async function saveOnboardingAnswers(
  userId: string,
  answers: OnboardingAnswers
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);

    // Cevaplari UserPreferences formatina donustur
    const preferences: Partial<UserPreferences> = {
      stylePreferences: answers.stylePreferences || [],
      bodyType: answers.bodyType,
      favoriteColors: answers.favoriteColors || [],
      usageGoals: answers.usageGoals || [],
    };

    await setDoc(userRef, {
      'stylePreferences': preferences,
      'onboarding': {
        completed: true,
        completedAt: serverTimestamp(),
        answers: answers,
      },
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Save onboarding answers error:', error);
    throw error;
  }
}

// Kullanici tercihlerini al
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    const data = userSnap.data();
    const prefs = data.stylePreferences || {};

    return {
      stylePreferences: prefs.stylePreferences || [],
      bodyType: prefs.bodyType || null,
      favoriteColors: prefs.favoriteColors || [],
      usageGoals: prefs.usageGoals || [],
      language: prefs.language || 'tr',
      notificationsEnabled: prefs.notificationsEnabled ?? true,
    };
  } catch (error) {
    console.error('Get user preferences error:', error);
    throw error;
  }
}

// Kullanici tercihlerini guncelle
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);

    const updates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (preferences.stylePreferences) {
      updates['stylePreferences.stylePreferences'] = preferences.stylePreferences;
    }
    if (preferences.bodyType) {
      updates['stylePreferences.bodyType'] = preferences.bodyType;
    }
    if (preferences.favoriteColors) {
      updates['stylePreferences.favoriteColors'] = preferences.favoriteColors;
    }
    if (preferences.usageGoals) {
      updates['stylePreferences.usageGoals'] = preferences.usageGoals;
    }

    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Update user preferences error:', error);
    throw error;
  }
}

// Dil tercihini guncelle
export async function updateLanguagePreference(
  userId: string,
  language: 'tr' | 'en'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      'preferences.language': language,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Update language preference error:', error);
    throw error;
  }
}

// Bildirim tercihini guncelle
export async function updateNotificationPreference(
  userId: string,
  enabled: boolean
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      'preferences.notificationsEnabled': enabled,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Update notification preference error:', error);
    throw error;
  }
}

export default {
  saveOnboardingAnswers,
  getUserPreferences,
  updateUserPreferences,
  updateLanguagePreference,
  updateNotificationPreference,
};
