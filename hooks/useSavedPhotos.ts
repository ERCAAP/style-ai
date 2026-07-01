/**
 * useSavedPhotos Hook
 * Kullanicinin kaydettigi fotograflari yonetir
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getSavedPhotos,
  savePhoto,
  deletePhoto,
  clearAllSavedPhotos,
  getSavedPhotosCount,
  isPhotoSaved,
  type SavedPhoto,
} from '@/services/localStorage/savedPhotosStorage';

interface UseSavedPhotosReturn {
  savedPhotos: SavedPhoto[];
  isLoading: boolean;
  error: string | null;
  count: number;
  saveNewPhoto: (
    uri: string,
    width: number,
    height: number,
    fileSize: number
  ) => Promise<SavedPhoto | null>;
  removePhoto: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
  checkIfSaved: (uri: string) => Promise<boolean>;
}

export function useSavedPhotos(): UseSavedPhotosReturn {
  const [savedPhotos, setSavedPhotos] = useState<SavedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  // Kayitli fotograflari yukle
  const loadSavedPhotos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const photos = await getSavedPhotos();
      setSavedPhotos(photos);
      setCount(photos.length);
    } catch (err) {
      console.error('Load saved photos error:', err);
      setError('Fotograflar yuklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ilk yukleme
  useEffect(() => {
    loadSavedPhotos();
  }, [loadSavedPhotos]);

  // Yeni fotograf kaydet
  const saveNewPhoto = useCallback(
    async (
      uri: string,
      width: number,
      height: number,
      fileSize: number
    ): Promise<SavedPhoto | null> => {
      try {
        const newPhoto = await savePhoto(uri, width, height, fileSize);
        setSavedPhotos(prev => [newPhoto, ...prev]);
        setCount(prev => prev + 1);
        return newPhoto;
      } catch (err) {
        console.error('Save photo error:', err);
        setError('Fotograf kaydedilemedi');
        return null;
      }
    },
    []
  );

  // Fotograf sil
  const removePhoto = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await deletePhoto(id);
      if (success) {
        setSavedPhotos(prev => prev.filter(photo => photo.id !== id));
        setCount(prev => prev - 1);
      }
      return success;
    } catch (err) {
      console.error('Remove photo error:', err);
      setError('Fotograf silinemedi');
      return false;
    }
  }, []);

  // Tum fotograflari temizle
  const clearAll = useCallback(async () => {
    try {
      await clearAllSavedPhotos();
      setSavedPhotos([]);
      setCount(0);
    } catch (err) {
      console.error('Clear all photos error:', err);
      setError('Fotograflar temizlenemedi');
      throw err;
    }
  }, []);

  // Yeniden yukle
  const refresh = useCallback(async () => {
    await loadSavedPhotos();
  }, [loadSavedPhotos]);

  // Fotografin kaydedilip kaydedilmedigini kontrol et
  const checkIfSaved = useCallback(async (uri: string): Promise<boolean> => {
    return await isPhotoSaved(uri);
  }, []);

  return {
    savedPhotos,
    isLoading,
    error,
    count,
    saveNewPhoto,
    removePhoto,
    clearAll,
    refresh,
    checkIfSaved,
  };
}
