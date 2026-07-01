// i18n Configuration - Coklu dil destegi yapilandirmasi

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import tr from './locales/tr';
import en from './locales/en';

// Storage anahtarlari
const LANGUAGE_STORAGE_KEY = '@styleai_language';

// Desteklenen diller
export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Dil ayarlari
export const LANGUAGE_CONFIG: Record<SupportedLanguage, { name: string; nativeName: string }> = {
  tr: { name: 'Turkish', nativeName: 'Turkce' },
  en: { name: 'English', nativeName: 'English' },
};

// Ceviriler
const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

// Cihaz dilini al (expo-localization ile)
const getDeviceLocale = (): string => {
  try {
    // expo-localization ile cihazin tercih edilen dillerini al
    const locales = Localization.getLocales();

    // Ilk tercih edilen dili kullan
    if (locales && locales.length > 0) {
      return locales[0].languageCode || 'en';
    }

    // Fallback
    return Localization.locale || 'en';
  } catch (error) {
    console.warn('Error getting device locale:', error);
    return 'en';
  }
};

// Varsayilan dili belirle
const getDefaultLanguage = (): SupportedLanguage => {
  try {
    const deviceLanguage = getDeviceLocale().split(/[-_]/)[0].toLowerCase();
    return SUPPORTED_LANGUAGES.includes(deviceLanguage as SupportedLanguage)
      ? (deviceLanguage as SupportedLanguage)
      : 'en';
  } catch {
    return 'en';
  }
};

// i18n'i baslat
export const initI18n = async (): Promise<typeof i18next> => {
  try {
    // Kaydedilmis dili kontrol et
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    const defaultLanguage = savedLanguage || getDefaultLanguage();

    await i18next.use(initReactI18next).init({
      resources,
      lng: defaultLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
      react: {
        useSuspense: false,
      },
    });

    return i18next;
  } catch (error) {
    console.error('i18n initialization error:', error);
    // Hata durumunda varsayilan ayarlarla baslat
    await i18next.use(initReactI18next).init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
    return i18next;
  }
};

// Dili degistir
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18next.changeLanguage(language);
  } catch (error) {
    console.error('Change language error:', error);
    throw error;
  }
};

// Mevcut dili al
export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18next.language as SupportedLanguage) || 'en';
};

// Kaydedilmis dili al
export const getSavedLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved as SupportedLanguage | null;
  } catch {
    return null;
  }
};

export default i18next;
