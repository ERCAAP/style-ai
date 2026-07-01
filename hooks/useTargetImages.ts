/**
 * useTargetImages Hook
 * Çoklu hedef kıyafet görseli yönetimi için hook
 */

import { useState, useCallback } from 'react';
import { scrapeProductImage, isValidUrl } from '@/services/urlScraper';
import { cacheDirectory, downloadAsync, getInfoAsync } from 'expo-file-system/legacy';
import { TargetImage } from '@/components/url/TargetImagesInput';

const MAX_IMAGES = 10;

interface UseTargetImagesReturn {
  images: TargetImage[];
  isLoading: boolean;
  error: string | null;
  addImage: (url: string) => Promise<TargetImage | null>;
  addLocalImage: (uri: string) => TargetImage | null;
  removeImage: (id: string) => void;
  clearAll: () => void;
}

export function useTargetImages(): UseTargetImagesReturn {
  const [images, setImages] = useState<TargetImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * URL'den görsel indir
   */
  const downloadImage = useCallback(async (imageUrl: string): Promise<string> => {
    const filename = `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const localUri = `${cacheDirectory}${filename}`;

    const downloadResult = await downloadAsync(imageUrl, localUri, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      },
    });

    if (downloadResult.status !== 200) {
      throw new Error('Gorsel indirilemedi');
    }

    return downloadResult.uri;
  }, []);

  /**
   * URL'den görsel ekle
   */
  const addImage = useCallback(async (url: string): Promise<TargetImage | null> => {
    // Limit kontrolü
    if (images.length >= MAX_IMAGES) {
      setError(`Maksimum ${MAX_IMAGES} gorsel ekleyebilirsiniz`);
      return null;
    }

    // URL validasyonu
    if (!url || !url.trim()) {
      setError('URL bos olamaz');
      return null;
    }

    if (!isValidUrl(url)) {
      setError('Gecerli bir URL girin');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sayfadan görsel URL'sini çek
      const result = await scrapeProductImage(url);

      if (!result.success || !result.productImage) {
        setError(result.error || 'Gorsel bulunamadi');
        return null;
      }

      // Görseli indir
      const localUri = await downloadImage(result.productImage.url);

      const newImage: TargetImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri: localUri,
        sourceUrl: url,
      };

      setImages(prev => [...prev, newImage]);
      setError(null);

      return newImage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gorsel eklenemedi';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [images.length, downloadImage]);

  /**
   * Lokal görsel ekle (galeri/kamera)
   */
  const addLocalImage = useCallback((uri: string): TargetImage | null => {
    // Limit kontrolü
    if (images.length >= MAX_IMAGES) {
      setError(`Maksimum ${MAX_IMAGES} gorsel ekleyebilirsiniz`);
      return null;
    }

    const newImage: TargetImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uri: uri,
      sourceUrl: 'local',
    };

    setImages(prev => [...prev, newImage]);
    setError(null);

    return newImage;
  }, [images.length]);

  /**
   * Görsel kaldır
   */
  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setError(null);
  }, []);

  /**
   * Tüm görselleri temizle
   */
  const clearAll = useCallback(() => {
    setImages([]);
    setError(null);
  }, []);

  return {
    images,
    isLoading,
    error,
    addImage,
    addLocalImage,
    removeImage,
    clearAll,
  };
}

export default useTargetImages;
