/**
 * useURLImage Hook
 * URL'den görsel çekmek için kullanılan hook
 */

import { useState, useCallback } from 'react';
import { scrapeProductImage, isValidUrl, ScrapeResult, ScrapedImage } from '@/services/urlScraper';
import { cacheDirectory, downloadAsync, getInfoAsync } from 'expo-file-system/legacy';
import { Image } from 'react-native';

export interface URLImage {
  uri: string;
  sourceUrl: string;
  width: number;
  height: number;
  fileSize: number;
  type: 'url';
}

export type URLImageStatus = 'idle' | 'validating' | 'fetching' | 'downloading' | 'completed' | 'error';

interface UseURLImageOptions {
  autoValidate?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

interface UseURLImageReturn {
  urlImage: URLImage | null;
  status: URLImageStatus;
  error: string | null;
  allImages: ScrapedImage[];
  fetchFromUrl: (url: string) => Promise<URLImage | null>;
  selectImage: (image: ScrapedImage) => Promise<URLImage | null>;
  clear: () => void;
}

const DEFAULT_OPTIONS: UseURLImageOptions = {
  autoValidate: true,
  maxWidth: 1024,
  maxHeight: 1024,
};

export function useURLImage(options: UseURLImageOptions = {}): UseURLImageReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [urlImage, setUrlImage] = useState<URLImage | null>(null);
  const [status, setStatus] = useState<URLImageStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [allImages, setAllImages] = useState<ScrapedImage[]>([]);

  /**
   * Görsel URL'sini cihaza indirir ve local URI döndürür
   */
  const downloadImage = useCallback(async (imageUrl: string): Promise<{ uri: string; fileSize: number }> => {
    console.log(`\n========== [useURLImage] downloadImage BAŞLIYOR ==========`);
    console.log(`[useURLImage] İndirilecek URL: ${imageUrl.substring(0, 100)}...`);

    const filename = `url_image_${Date.now()}.jpg`;
    const localUri = `${cacheDirectory}${filename}`;
    console.log(`[useURLImage] Hedef dosya: ${localUri}`);

    try {
      const startTime = Date.now();
      console.log(`[useURLImage] Download başlıyor...`);

      const downloadResult = await downloadAsync(imageUrl, localUri, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://www.google.com/',
        },
      });

      const downloadDuration = Date.now() - startTime;
      console.log(`[useURLImage] Download tamamlandı - Süre: ${downloadDuration}ms, Status: ${downloadResult.status}`);

      if (downloadResult.status !== 200) {
        console.error(`[useURLImage] ❌ Download başarısız - HTTP ${downloadResult.status}`);
        throw new Error(`Download failed: ${downloadResult.status}`);
      }

      // Dosya boyutunu al
      const fileInfo = await getInfoAsync(downloadResult.uri);
      const fileSize = (fileInfo as any).size || 0;
      console.log(`[useURLImage] ✅ Dosya bilgisi - Boyut: ${(fileSize / 1024).toFixed(2)} KB`);

      console.log(`========== [useURLImage] downloadImage BAŞARILI ==========\n`);
      return {
        uri: downloadResult.uri,
        fileSize,
      };
    } catch (err) {
      console.error(`[useURLImage] ❌ Download hatası:`, err);
      console.log(`========== [useURLImage] downloadImage BAŞARISIZ ==========\n`);
      throw new Error('Gorsel indirilemedi');
    }
  }, []);

  /**
   * Görsel boyutlarını alır
   */
  const getImageDimensions = useCallback((uri: string): Promise<{ width: number; height: number }> => {
    console.log(`[useURLImage] getImageDimensions başlıyor - URI: ${uri.substring(0, 80)}...`);

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      Image.getSize(
        uri,
        (width, height) => {
          const duration = Date.now() - startTime;
          console.log(`[useURLImage] ✅ Boyutlar alındı - ${width}x${height} (${duration}ms)`);
          resolve({ width, height });
        },
        (err) => {
          console.error(`[useURLImage] ❌ Boyut alma hatası:`, err);
          reject(err);
        }
      );
    });
  }, []);

  /**
   * Seçilen görseli işler
   */
  const processImage = useCallback(async (image: ScrapedImage, sourceUrl: string): Promise<URLImage | null> => {
    console.log(`\n========== [useURLImage] processImage BAŞLIYOR ==========`);
    console.log(`[useURLImage] Görsel URL: ${image.url.substring(0, 100)}...`);
    console.log(`[useURLImage] Kaynak URL: ${sourceUrl.substring(0, 100)}...`);

    try {
      setStatus('downloading');

      // Görseli indir
      const { uri, fileSize } = await downloadImage(image.url);

      // Boyutları al
      let dimensions = { width: 0, height: 0 };
      try {
        dimensions = await getImageDimensions(uri);
      } catch (dimError) {
        console.warn(`[useURLImage] ⚠️ Boyut alınamadı, varsayılan değerler kullanılıyor:`, dimError);
        // Boyut alınamazsa varsayılan değerler kullan
        dimensions = { width: image.width || 800, height: image.height || 1200 };
      }

      const urlImageResult: URLImage = {
        uri,
        sourceUrl,
        width: dimensions.width,
        height: dimensions.height,
        fileSize,
        type: 'url',
      };

      console.log(`[useURLImage] ✅ URLImage oluşturuldu:`);
      console.log(`  - URI: ${uri}`);
      console.log(`  - Boyut: ${dimensions.width}x${dimensions.height}`);
      console.log(`  - Dosya boyutu: ${(fileSize / 1024).toFixed(2)} KB`);

      setUrlImage(urlImageResult);
      setStatus('completed');
      setError(null);

      console.log(`========== [useURLImage] processImage BAŞARILI ==========\n`);
      return urlImageResult;
    } catch (err) {
      console.error(`[useURLImage] ❌ processImage hatası:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Gorsel islenemedi';
      setError(errorMessage);
      setStatus('error');
      console.log(`========== [useURLImage] processImage BAŞARISIZ ==========\n`);
      return null;
    }
  }, [downloadImage, getImageDimensions]);

  /**
   * URL'den görsel çeker
   */
  const fetchFromUrl = useCallback(async (url: string): Promise<URLImage | null> => {
    console.log(`\n========== [useURLImage] fetchFromUrl BAŞLIYOR ==========`);
    console.log(`[useURLImage] URL: ${url}`);

    // URL validasyonu
    if (!url || !url.trim()) {
      console.error(`[useURLImage] ❌ URL boş`);
      setError('URL bos olamaz');
      setStatus('error');
      return null;
    }

    if (!isValidUrl(url)) {
      console.error(`[useURLImage] ❌ Geçersiz URL formatı`);
      setError('Gecerli bir URL girin');
      setStatus('error');
      return null;
    }

    console.log(`[useURLImage] URL validasyonu başarılı ✅`);
    setStatus('fetching');
    setError(null);
    setAllImages([]);

    try {
      // Sayfadan görselleri çek
      console.log(`[useURLImage] scrapeProductImage çağrılıyor...`);
      const result: ScrapeResult = await scrapeProductImage(url);

      console.log(`[useURLImage] Scrape sonucu:`, {
        success: result.success,
        imageCount: result.images.length,
        hasProductImage: !!result.productImage,
        error: result.error,
      });

      if (!result.success || !result.productImage) {
        console.error(`[useURLImage] ❌ Scraping başarısız:`, result.error);
        setError(result.error || 'Gorsel bulunamadi');
        setStatus('error');
        console.log(`========== [useURLImage] fetchFromUrl BAŞARISIZ ==========\n`);
        return null;
      }

      // Tüm görselleri kaydet
      console.log(`[useURLImage] ${result.images.length} adet görsel bulundu`);
      setAllImages(result.images);

      // Ana ürün görselini işle
      console.log(`[useURLImage] Ana görsel işleniyor...`);
      const urlImage = await processImage(result.productImage, url);

      if (urlImage) {
        console.log(`========== [useURLImage] fetchFromUrl BAŞARILI ==========\n`);
      } else {
        console.log(`========== [useURLImage] fetchFromUrl BAŞARISIZ (processImage null döndü) ==========\n`);
      }

      return urlImage;
    } catch (err) {
      console.error(`[useURLImage] ❌ fetchFromUrl hatası:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Gorsel cekilemedi';
      setError(errorMessage);
      setStatus('error');
      console.log(`========== [useURLImage] fetchFromUrl BAŞARISIZ ==========\n`);
      return null;
    }
  }, [processImage]);

  /**
   * Alternatif görsellerden birini seçer
   */
  const selectImage = useCallback(async (image: ScrapedImage): Promise<URLImage | null> => {
    return await processImage(image, image.url);
  }, [processImage]);

  /**
   * State'i temizler
   */
  const clear = useCallback(() => {
    setUrlImage(null);
    setStatus('idle');
    setError(null);
    setAllImages([]);
  }, []);

  return {
    urlImage,
    status,
    error,
    allImages,
    fetchFromUrl,
    selectImage,
    clear,
  };
}

export default useURLImage;
