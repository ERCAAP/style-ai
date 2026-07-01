// Notification Service - Push ve Local bildirim yonetimi
// Expo Notifications API kullanilarak implement edilmistir

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Storage keys
const STORAGE_KEYS = {
  PUSH_TOKEN: '@styleai_push_token',
  NOTIFICATION_SETTINGS: '@styleai_notification_settings',
  SCHEDULED_NOTIFICATIONS: '@styleai_scheduled_notifications',
};

// Bildirim ayarlari tipi
export interface NotificationSettings {
  enabled: boolean;
  analysisComplete: boolean;
  dailyReminder: boolean;
  weeklyTips: boolean;
  promotions: boolean;
  reminderTime: string; // "09:00" formati
}

// Default bildirim ayarlari
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  analysisComplete: true,
  dailyReminder: false,
  weeklyTips: true,
  promotions: false,
  reminderTime: '09:00',
};

// Bildirim turleri
export type NotificationType =
  | 'analysis_complete'
  | 'daily_reminder'
  | 'weekly_tips'
  | 'promotion'
  | 'system';

// Bildirim verisi
export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Push token tipi
export interface PushTokenInfo {
  token: string;
  type: 'expo' | 'fcm';
  platform: 'ios' | 'android';
  createdAt: Date;
  updatedAt: Date;
}

// Notification handler ayarlari
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;
  private settings: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Servisi baslat
  async initialize(): Promise<void> {
    try {
      // Ayarlari yukle
      await this.loadSettings();

      // Push token al
      await this.registerForPushNotifications();

      // Bildirim listener'larini ayarla
      this.setupNotificationListeners();

      console.log('[NotificationService] Initialized successfully');
    } catch (error) {
      console.error('[NotificationService] Initialization error:', error);
    }
  }

  // Push notification izni al ve token kaydet
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Fiziksel cihaz kontrolu
      if (!Device.isDevice) {
        console.log('[NotificationService] Push notifications require a physical device');
        return null;
      }

      // Mevcut izin durumunu kontrol et
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Izin yoksa iste
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NotificationService] Permission not granted');
        return null;
      }

      // Android icin kanal olustur
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Push token al
      // IMPORTANT: Expo automatically uses FCM for Android and APNS for iOS
      // iOS: Returns ExponentPushToken[...] (Expo Push Notifications)
      // Android: Returns FCM token (Firebase Cloud Messaging) via Expo
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.pushToken = tokenData.data;

      // Token'i kaydet
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, this.pushToken);

      // Determine token type based on platform
      // iOS uses Expo Push, Android uses FCM through Expo
      const tokenType = Platform.OS === 'android' ? 'fcm' : 'expo';

      console.log('[NotificationService] Push token registered');
      console.log('[NotificationService] Platform:', Platform.OS);
      console.log('[NotificationService] Token type:', tokenType);
      console.log('[NotificationService] Token:', this.pushToken);

      return this.pushToken;
    } catch (error) {
      console.error('[NotificationService] Register error:', error);
      return null;
    }
  }

  // Android bildirim kanallari
  private async setupAndroidChannels(): Promise<void> {
    // Ana kanal
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Genel Bildirimler',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
      sound: 'default',
    });

    // Analiz tamamlandi kanali
    await Notifications.setNotificationChannelAsync('analysis', {
      name: 'Analiz Bildirimleri',
      description: 'Kiyafet analizi tamamlandiginda bildirim',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    // Hatirlatici kanali
    await Notifications.setNotificationChannelAsync('reminder', {
      name: 'Hatirlaticilar',
      description: 'Gunluk kullanim hatirlat',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    // Promosyon kanali
    await Notifications.setNotificationChannelAsync('promotion', {
      name: 'Promosyonlar',
      description: 'Ozel firsatlar ve kampanyalar',
      importance: Notifications.AndroidImportance.LOW,
    });
  }

  // Bildirim listener'lari
  private setupNotificationListeners(): void {
    // Bildirim alindi (uygulama acikken)
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('[NotificationService] Notification received:', notification);
    });

    // Bildirime tiklandi
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[NotificationService] Notification response:', response);
      const data = response.notification.request.content.data;

      // Bildirim tipine gore yonlendirme
      if (data?.type === 'analysis_complete' && data?.analysisId) {
        // Analysis result sayfasina yonlendir
        // router.push(`/analysis-result?id=${data.analysisId}`);
      }
    });
  }

  // Ayarlari yukle
  async loadSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (stored) {
        this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) };
      }
      return this.settings;
    } catch (error) {
      console.error('[NotificationService] Load settings error:', error);
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  // Ayarlari kaydet
  async saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATION_SETTINGS,
        JSON.stringify(this.settings)
      );

      // Gunluk hatirlatici ayari degistiyse
      if ('dailyReminder' in settings || 'reminderTime' in settings) {
        await this.updateDailyReminder();
      }

      console.log('[NotificationService] Settings saved:', this.settings);
    } catch (error) {
      console.error('[NotificationService] Save settings error:', error);
      throw error;
    }
  }

  // Mevcut ayarlari getir
  getSettings(): NotificationSettings {
    return this.settings;
  }

  // Push token'i Firebase'e kaydet
  async savePushTokenToFirebase(userId: string, language: 'tr' | 'en' = 'tr'): Promise<void> {
    if (!this.pushToken) {
      console.log('[NotificationService] No push token to save');
      return;
    }

    try {
      // Determine token type: iOS uses Expo Push, Android uses FCM
      const tokenType = Platform.OS === 'android' ? 'fcm' : 'expo';

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushToken: this.pushToken,
        pushTokenType: tokenType,
        pushTokenPlatform: Platform.OS,
        pushTokenLanguage: language,
        pushTokenUpdatedAt: Timestamp.now(),
        notificationSettings: this.settings,
        language: language, // Also save as top-level language for easier querying
      });

      console.log('[NotificationService] Push token saved to Firebase');
      console.log('[NotificationService] Token type:', tokenType);
      console.log('[NotificationService] Platform:', Platform.OS);
      console.log('[NotificationService] Language:', language);
    } catch (error) {
      console.error('[NotificationService] Save to Firebase error:', error);
    }
  }

  // Local bildirim gonder
  async sendLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      // Bildirim tipi ayarlara gore kontrol
      if (!this.shouldSendNotification(notification.type)) {
        console.log(`[NotificationService] Notification type ${notification.type} is disabled`);
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { type: notification.type, ...notification.data },
          sound: 'default',
        },
        trigger: null, // Hemen gonder
      });

      console.log('[NotificationService] Local notification sent:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Send notification error:', error);
      return null;
    }
  }

  // Zamanlanmis bildirim gonder
  async scheduleNotification(
    notification: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      if (!this.shouldSendNotification(notification.type)) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { type: notification.type, ...notification.data },
          sound: 'default',
        },
        trigger,
      });

      console.log('[NotificationService] Scheduled notification:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Schedule notification error:', error);
      return null;
    }
  }

  // Bildirim gonderilmeli mi kontrol et
  private shouldSendNotification(type: NotificationType): boolean {
    if (!this.settings.enabled) return false;

    switch (type) {
      case 'analysis_complete':
        return this.settings.analysisComplete;
      case 'daily_reminder':
        return this.settings.dailyReminder;
      case 'weekly_tips':
        return this.settings.weeklyTips;
      case 'promotion':
        return this.settings.promotions;
      case 'system':
        return true; // Sistem bildirimleri her zaman gonderilir
      default:
        return true;
    }
  }

  // Gunluk hatirlatici ayarla
  private async updateDailyReminder(): Promise<void> {
    // Onceki hatirlaticlari iptal et
    await this.cancelDailyReminder();

    if (!this.settings.dailyReminder) return;

    try {
      const [hours, minutes] = this.settings.reminderTime.split(':').map(Number);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Gunun Kombini',
          body: 'Bugun kiyafetini analiz etmeyi unuttun mu? Hemen dene!',
          data: { type: 'daily_reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
        identifier: 'daily_reminder',
      });

      console.log('[NotificationService] Daily reminder scheduled at', this.settings.reminderTime);
    } catch (error) {
      console.error('[NotificationService] Schedule daily reminder error:', error);
    }
  }

  // Gunluk hatirlaticiyi iptal et
  async cancelDailyReminder(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync('daily_reminder');
    } catch (error) {
      console.error('[NotificationService] Cancel daily reminder error:', error);
    }
  }

  // Analiz tamamlandi bildirimi
  async sendAnalysisCompleteNotification(score: number): Promise<void> {
    const scoreText = score >= 8 ? 'Muhtesem!' : score >= 6 ? 'Guzel!' : 'Gelistirilebilir';

    await this.sendLocalNotification({
      type: 'analysis_complete',
      title: 'Analiz Tamamlandi',
      body: `Kombinin ${score.toFixed(1)}/10 puan aldi. ${scoreText}`,
      data: { score },
    });
  }

  // Haftalik ipucu bildirimi
  async scheduleWeeklyTips(): Promise<void> {
    if (!this.settings.weeklyTips) return;

    const tips = [
      'Renk uyumunda altin kural: 3 renkten fazla kullanma!',
      'Ayakkabi ve kemer rengi uyumu klasik bir tercihtir.',
      'Mevsime uygun kumas secimi konforun anahtaridir.',
      'Aksesuar seciminde "az coktur" prensibini unutma!',
      'Vucut tipine uygun kesimler secmek onemlidir.',
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    await this.scheduleNotification(
      {
        type: 'weekly_tips',
        title: 'Haftanin Stil Ipucu',
        body: randomTip,
      },
      {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Pazartesi
        hour: 10,
        minute: 0,
      }
    );
  }

  // Tum bildirimleri iptal et
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[NotificationService] All notifications cancelled');
  }

  // Badge sayisini guncelle
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  // Izin durumunu kontrol et
  async checkPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  // Push token'i getir
  getPushToken(): string | null {
    return this.pushToken;
  }
}

// Singleton export
export const notificationService = NotificationService.getInstance();

// Kolay erisim icin fonksiyonlar
export async function initializeNotifications(): Promise<void> {
  await notificationService.initialize();
}

export async function registerPushToken(): Promise<string | null> {
  return notificationService.registerForPushNotifications();
}

export async function sendAnalysisNotification(score: number): Promise<void> {
  await notificationService.sendAnalysisCompleteNotification(score);
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return notificationService.loadSettings();
}

export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<void> {
  await notificationService.saveSettings(settings);
}

// Lokalize bildirim mesajlari
type SupportedLanguage = 'tr' | 'en';

interface LocalizedNotification {
  title: string;
  body: string;
}

const NOTIFICATION_MESSAGES: Record<SupportedLanguage, Record<NotificationType, (data?: Record<string, any>) => LocalizedNotification>> = {
  tr: {
    analysis_complete: (data) => ({
      title: 'Analiz Tamamlandi',
      body: data?.score
        ? `Kombinin ${data.score.toFixed(1)}/10 puan aldi!`
        : 'Kiyafet analiziniz hazir!',
    }),
    daily_reminder: () => ({
      title: 'Gunun Kombini',
      body: 'Bugun kiyafetini analiz etmeyi unuttun mu? Hemen dene!',
    }),
    weekly_tips: (data) => ({
      title: 'Haftanin Stil Ipucu',
      body: data?.tip || 'Yeni stil onerileri sizi bekliyor!',
    }),
    promotion: (data) => ({
      title: data?.title || 'Ozel Firsat',
      body: data?.body || 'Size ozel bir firsatimiz var!',
    }),
    system: (data) => ({
      title: data?.title || 'BOHO',
      body: data?.body || 'Yeni bir bildiriminiz var.',
    }),
  },
  en: {
    analysis_complete: (data) => ({
      title: 'Analysis Complete',
      body: data?.score
        ? `Your outfit scored ${data.score.toFixed(1)}/10!`
        : 'Your outfit analysis is ready!',
    }),
    daily_reminder: () => ({
      title: 'Daily Outfit',
      body: 'Did you forget to analyze your outfit today? Try now!',
    }),
    weekly_tips: (data) => ({
      title: 'Weekly Style Tip',
      body: data?.tip || 'New style recommendations await you!',
    }),
    promotion: (data) => ({
      title: data?.title || 'Special Offer',
      body: data?.body || 'We have a special offer for you!',
    }),
    system: (data) => ({
      title: data?.title || 'BOHO',
      body: data?.body || 'You have a new notification.',
    }),
  },
};

// Lokalize bildirim mesaji al
export function getLocalizedNotification(
  type: NotificationType,
  language: SupportedLanguage = 'tr',
  data?: Record<string, any>
): LocalizedNotification {
  const messages = NOTIFICATION_MESSAGES[language] || NOTIFICATION_MESSAGES.en;
  const getMessage = messages[type] || messages.system;
  return getMessage(data);
}

// Lokalize analiz tamamlandi bildirimi
export async function sendLocalizedAnalysisNotification(
  score: number,
  language: SupportedLanguage = 'tr',
  isError: boolean = false
): Promise<void> {
  if (isError) {
    const errorMessages = {
      tr: {
        title: 'Analiz Başarısız',
        body: 'Analiz işlemi tamamlanamadı. Lütfen tekrar deneyin.',
      },
      en: {
        title: 'Analysis Failed',
        body: 'Analysis could not be completed. Please try again.',
      },
    };

    const message = errorMessages[language] || errorMessages.en;

    await notificationService.sendLocalNotification({
      type: 'system',
      title: message.title,
      body: message.body,
      data: { error: true },
    });
  } else {
    const { title, body } = getLocalizedNotification('analysis_complete', language, { score });

    await notificationService.sendLocalNotification({
      type: 'analysis_complete',
      title,
      body,
      data: { score },
    });
  }
}
