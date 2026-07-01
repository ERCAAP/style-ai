// Onboarding Types - Onboarding akisi ile ilgili tipler

import { StylePreference, BodyType, UsageGoal } from './user';

// Onboarding adim tipleri
export type OnboardingStepType = 'welcome' | 'feature' | 'question' | 'completion';

// Soru tipleri
export type OnboardingQuestionType = 'single' | 'multiple' | 'color_picker';

// Onboarding secenegi
export interface OnboardingOption {
  id: string;
  labelKey: string;      // i18n key
  descriptionKey?: string;
  icon?: string;         // Ionicons ismi
  value: string;
  color?: string;        // Renk secimi icin hex
}

// Onboarding sorusu
export interface OnboardingQuestion {
  id: string;
  questionKey: string;   // Yanit kaydedilecek key
  type: OnboardingQuestionType;
  options: OnboardingOption[];
  required: boolean;
  minSelect?: number;    // Multiple secim icin minimum
  maxSelect?: number;    // Multiple secim icin maksimum
}

// Onboarding adimi
export interface OnboardingStep {
  id: string;
  type: OnboardingStepType;
  titleKey: string;       // i18n key
  subtitleKey?: string;   // i18n key
  icon?: string;          // Ionicons ismi
  image?: string;         // Resim yolu
  question?: OnboardingQuestion;
}

// Onboarding yanitlari
export interface OnboardingAnswers {
  stylePreferences?: StylePreference[];
  bodyType?: BodyType;
  favoriteColors?: string[];
  usageGoals?: UsageGoal[];
}

// Onboarding durumu
export interface OnboardingState {
  currentStepIndex: number;
  answers: OnboardingAnswers;
  isCompleted: boolean;
  skipped: boolean;
}

// Varsayilan onboarding durumu
export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  currentStepIndex: 0,
  answers: {},
  isCompleted: false,
  skipped: false,
};
