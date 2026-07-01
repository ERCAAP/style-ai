// useNotifications - Bildirim ayarlari hook'u

import { useState, useEffect, useCallback } from 'react';
import {
  notificationService,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  initializeNotifications,
  updateNotificationSettings,
} from '@/services/notifications';

interface UseNotificationsReturn {
  // Durum
  settings: NotificationSettings;
  isLoading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined' | null;
  pushToken: string | null;

  // Aksiyonlar
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined' | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // Baslangicta ayarlari yukle
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Notification service'i baslat
      await initializeNotifications();

      // Ayarlari al
      const loadedSettings = await notificationService.loadSettings();
      setSettings(loadedSettings);

      // Izin durumunu kontrol et
      const status = await notificationService.checkPermissionStatus();
      setPermissionStatus(status);

      // Push token'i al
      const token = notificationService.getPushToken();
      setPushToken(token);
    } catch (err) {
      console.error('[useNotifications] Load error:', err);
      setError('Bildirim ayarlari yuklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  // Ayarlari guncelle
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    setError(null);

    try {
      await updateNotificationSettings(newSettings);
      setSettings((prev) => ({ ...prev, ...newSettings }));
    } catch (err) {
      console.error('[useNotifications] Update error:', err);
      setError('Ayarlar kaydedilemedi');
      throw err;
    }
  }, []);

  // Bildirimleri ac/kapat
  const toggleNotifications = useCallback(async (enabled: boolean) => {
    if (enabled && permissionStatus !== 'granted') {
      // Izin iste
      const granted = await requestPermission();
      if (!granted) {
        setError('Bildirim izni verilmedi');
        return;
      }
    }

    await updateSettings({ enabled });
  }, [permissionStatus, updateSettings]);

  // Izin iste
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const token = await notificationService.registerForPushNotifications();
      const status = await notificationService.checkPermissionStatus();

      setPermissionStatus(status);
      setPushToken(token);

      return status === 'granted';
    } catch (err) {
      console.error('[useNotifications] Permission request error:', err);
      return false;
    }
  }, []);

  // Yenile
  const refresh = useCallback(async () => {
    await loadInitialData();
  }, []);

  return {
    settings,
    isLoading,
    error,
    permissionStatus,
    pushToken,
    updateSettings,
    toggleNotifications,
    requestPermission,
    refresh,
  };
}
