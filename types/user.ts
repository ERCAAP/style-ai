// User Types - Kullanici ile ilgili tipler

// Stil tercihleri
export type StylePreference =
  | 'casual'
  | 'formal'
  | 'sporty'
  | 'elegant'
  | 'bohemian'
  | 'minimalist';

// Beden tipleri
export type BodyType =
  | 'rectangle'
  | 'triangle'
  | 'inverted_triangle'
  | 'hourglass'
  | 'oval';

// Kullanim amaclari
export type UsageGoal =
  | 'daily_outfit'
  | 'work'
  | 'special_events'
  | 'shopping'
  | 'style_improvement';

// Desteklenen diller
export type SupportedLanguage = 'tr' | 'en';

// Kullanici tercihleri
export interface UserPreferences {
  stylePreferences: StylePreference[];
  bodyType: BodyType | null;
  favoriteColors: string[];
  usageGoals: UsageGoal[];
  language: SupportedLanguage;
  notificationsEnabled: boolean;
}

// Varsayilan kullanici tercihleri
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  stylePreferences: [],
  bodyType: null,
  favoriteColors: [],
  usageGoals: [],
  language: 'tr',
  notificationsEnabled: true,
};

// Abonelik durumu
export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'expired' | 'cancelled';

// Kullanici profili
export interface UserProfile {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  subscription: {
    status: SubscriptionStatus;
    plan: string | null;
    startDate: Date | null;
    endDate: Date | null;
  };
  usage: {
    totalJobs: number;
    jobsToday: number;
    dailyLimit: number;
    lastJobDate: Date | null;
  };
  preferences: UserPreferences;
  flags: {
    isBlocked: boolean;
    isVIP: boolean;
    hasCompletedOnboarding: boolean;
  };
}
