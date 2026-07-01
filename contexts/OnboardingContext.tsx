// OnboardingContext - Onboarding state yonetimi

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingAnswers, OnboardingState, DEFAULT_ONBOARDING_STATE } from '@/types/onboarding';
import { ONBOARDING_STORAGE_KEYS, TOTAL_ONBOARDING_STEPS } from '@/constants/onboarding';
import { saveOnboardingAnswers } from '@/services/firebase/userPreferences';
import { useAuthContext } from './AuthContext';

// Context tipi
interface OnboardingContextType {
  // State
  currentStepIndex: number;
  answers: OnboardingAnswers;
  isCompleted: boolean;
  isSkipped: boolean;
  isLoading: boolean;
  totalSteps: number;
  progress: number; // 0-100

  // Actions
  goToStep: (index: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

// Default context
const defaultContext: OnboardingContextType = {
  currentStepIndex: 0,
  answers: {},
  isCompleted: false,
  isSkipped: false,
  isLoading: true,
  totalSteps: TOTAL_ONBOARDING_STEPS,
  progress: 0,
  goToStep: () => {},
  nextStep: () => {},
  previousStep: () => {},
  updateAnswer: () => {},
  completeOnboarding: async () => {},
  skipOnboarding: async () => {},
  resetOnboarding: async () => {},
};

// Context olustur
const OnboardingContext = createContext<OnboardingContextType>(defaultContext);

// Provider props
interface OnboardingProviderProps {
  children: ReactNode;
}

// Provider component
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuthContext();

  // Kaydedilmis durumu yukle
  useEffect(() => {
    loadSavedState();
  }, []);

  const loadSavedState = async () => {
    try {
      const [answersJson, completedStr, skippedStr] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.ANSWERS),
        AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.COMPLETED),
        AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.SKIPPED),
      ]);

      const answers = answersJson ? JSON.parse(answersJson) : {};
      const isCompleted = completedStr === 'true';
      const skipped = skippedStr === 'true';

      setState(prev => ({
        ...prev,
        answers,
        isCompleted,
        skipped,
      }));
    } catch (error) {
      console.error('Load onboarding state error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cevaplari kaydet
  const saveAnswers = useCallback(async (answers: OnboardingAnswers) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
    } catch (error) {
      console.error('Save answers error:', error);
    }
  }, []);

  // Adima git
  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < TOTAL_ONBOARDING_STEPS) {
      setState(prev => ({ ...prev, currentStepIndex: index }));
    }
  }, []);

  // Sonraki adim
  const nextStep = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex < TOTAL_ONBOARDING_STEPS) {
        return { ...prev, currentStepIndex: nextIndex };
      }
      return prev;
    });
  }, []);

  // Onceki adim
  const previousStep = useCallback(() => {
    setState(prev => {
      const prevIndex = prev.currentStepIndex - 1;
      if (prevIndex >= 0) {
        return { ...prev, currentStepIndex: prevIndex };
      }
      return prev;
    });
  }, []);

  // Cevabi guncelle
  const updateAnswer = useCallback(<K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K]
  ) => {
    setState(prev => {
      const newAnswers = { ...prev.answers, [key]: value };
      saveAnswers(newAnswers);
      return { ...prev, answers: newAnswers };
    });
  }, [saveAnswers]);

  // Onboarding'i tamamla
  const completeOnboarding = useCallback(async () => {
    try {
      // AsyncStorage'a kaydet
      await Promise.all([
        AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.COMPLETED, 'true'),
        AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.ANSWERS, JSON.stringify(state.answers)),
      ]);

      // Firestore'a kaydet (kullanici giris yapmissa)
      if (isAuthenticated && user?.uid) {
        try {
          await saveOnboardingAnswers(user.uid, state.answers);
        } catch (firestoreError) {
          console.warn('Firestore save warning (will retry later):', firestoreError);
          // Firestore hatasi olsa bile devam et, AsyncStorage'a kaydedildi
        }
      }

      setState(prev => ({ ...prev, isCompleted: true }));
    } catch (error) {
      console.error('Complete onboarding error:', error);
      throw error;
    }
  }, [state.answers, isAuthenticated, user?.uid]);

  // Onboarding'i atla
  const skipOnboarding = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.SKIPPED, 'true'),
        AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.COMPLETED, 'true'),
      ]);
      setState(prev => ({ ...prev, isCompleted: true, skipped: true }));
    } catch (error) {
      console.error('Skip onboarding error:', error);
      throw error;
    }
  }, []);

  // Onboarding'i sifirla
  const resetOnboarding = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ONBOARDING_STORAGE_KEYS.ANSWERS),
        AsyncStorage.removeItem(ONBOARDING_STORAGE_KEYS.COMPLETED),
        AsyncStorage.removeItem(ONBOARDING_STORAGE_KEYS.SKIPPED),
      ]);
      setState(DEFAULT_ONBOARDING_STATE);
    } catch (error) {
      console.error('Reset onboarding error:', error);
      throw error;
    }
  }, []);

  // Ilerleme yuzdesi
  const progress = Math.round((state.currentStepIndex / (TOTAL_ONBOARDING_STEPS - 1)) * 100);

  // Context degeri
  const value: OnboardingContextType = {
    currentStepIndex: state.currentStepIndex,
    answers: state.answers,
    isCompleted: state.isCompleted,
    isSkipped: state.skipped,
    isLoading,
    totalSteps: TOTAL_ONBOARDING_STEPS,
    progress,
    goToStep,
    nextStep,
    previousStep,
    updateAnswer,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Hook
export function useOnboardingContext(): OnboardingContextType {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }

  return context;
}

// Export context (test icin)
export { OnboardingContext };
