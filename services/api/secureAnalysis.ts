// Secure Analysis Service
// Cloud Function uzerinden guvenli analiz

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/services/firebase/config';
import * as FileSystem from 'expo-file-system';
import { OutfitAnalysis } from '@/services/openai/outfitAnalysis';
import { compressImage } from '@/utils/imageCompression';

// Firebase Functions instance (Europe region)
const functions = getFunctions(app, 'europe-west1');

// Helper function to get fresh callable reference (cache problemi önleme)
function getAnalyzeOutfitFn() {
  return httpsCallable<
    {
      imageBase64: string;
      language?: 'tr' | 'en';
      userPreferences?: {
        stylePreferences?: string[];
        bodyType?: string;
        favoriteColors?: string[];
        usageGoals?: string[];
      };
      purposes?: string[];
    },
    {
      success: boolean;
      analysis: OutfitAnalysis;
      timestamp: number;
    }
  >(functions, 'analyzeOutfitMinimal');
}

// Analiz sonuc tipi
export interface SecureAnalysisResult {
  success: boolean;
  analysis: OutfitAnalysis | null;
  error?: string;
  timestamp?: number;
}

// Request deduplication cache - aynı görsel için tekrar istek yapılmasını engelle
const inFlightRequests = new Map<string, Promise<SecureAnalysisResult>>();

// Cache'i temizle (optional, memory management için)
function clearRequestCache(imageUri: string): void {
  inFlightRequests.delete(imageUri);
  console.log(`[RequestCache] Cleared cache for ${imageUri.substring(0, 50)}...`);
}

// Gorseli base64'e cevir
async function convertImageToBase64(uri: string): Promise<string> {
  try {
    console.log('[convertImageToBase64] Starting for URI:', uri);
    console.log('[Performance] Starting image compression...');
    const startTime = Date.now();

    // 1. Görseli sıkıştır (OpenAI için optimize edilmiş ayarlar)
    // GPT-4o vision: 512px - 2048px arası optimal
    // compressImage zaten file existence kontrolü yapıyor
    const compressed = await compressImage(uri, {
      maxWidth: 1536,  // OpenAI için ideal boyut
      maxHeight: 1536,
      quality: 0.85,   // Yüksek kalite ama optimize
      format: 'jpeg',  // PNG'den daha küçük
    });

    const compressTime = Date.now() - startTime;
    console.log(`[Performance] Image compressed in ${compressTime}ms`);
    console.log(`[Performance] Compressed size: ${Math.round(compressed.fileSize / 1024)}KB`);

    // FileSystem modülü kontrol et
    if (!FileSystem || !FileSystem.EncodingType) {
      // Fallback: fetch ile base64'e çevir
      const response = await fetch(compressed.uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // data:image/...;base64, prefix'ini kaldır
          const base64 = result.split(',')[1] || result;
          const encodeTime = Date.now() - startTime;
          console.log(`[Performance] Total conversion time: ${encodeTime}ms, Base64 length: ${Math.round(base64.length / 1024)}KB`);
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // 2. Sıkıştırılmış görseli base64'e çevir
    const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const totalTime = Date.now() - startTime;
    console.log(`[Performance] Total conversion time: ${totalTime}ms, Base64 length: ${Math.round(base64.length / 1024)}KB`);

    return base64;
  } catch (error) {
    console.error('Image conversion error:', error);
    throw new Error('Gorsel isleme hatasi');
  }
}

// Guvenli analiz fonksiyonu
export async function secureAnalyzeOutfit(
  imageUri: string,
  options?: {
    language?: 'tr' | 'en';
    userPreferences?: {
      stylePreferences?: string[];
      bodyType?: string;
      favoriteColors?: string[];
      usageGoals?: string[];
    };
    purposes?: string[]; // Analiz amaçları
  }
): Promise<SecureAnalysisResult> {
  const language = options?.language || 'tr';

  // Check if there's already an in-flight request for this image
  const existingRequest = inFlightRequests.get(imageUri);
  if (existingRequest) {
    console.log('[secureAnalyzeOutfit] Found existing in-flight request, returning cached promise');
    console.log('[secureAnalyzeOutfit] Image URI:', imageUri.substring(0, 50) + '...');
    return existingRequest;
  }

  // Create and cache the request promise
  const requestPromise = (async (): Promise<SecureAnalysisResult> => {
    try {
      console.log('[secureAnalyzeOutfit] Starting NEW analysis...');
      console.log('[secureAnalyzeOutfit] Image URI:', imageUri);

    // Gorseli base64'e cevir (Storage'a yuklemeden direkt)
    const imageBase64 = await convertImageToBase64(imageUri);
    console.log('[secureAnalyzeOutfit] Base64 conversion successful, length:', imageBase64.length);

    // Get fresh callable reference (her çağrıda yeni instance)
    const analyzeOutfitFn = getAnalyzeOutfitFn();

    // Cloud Function cagir (base64 gonderiyoruz)
    console.log('[secureAnalyzeOutfit] Calling Firebase Function...');
    const result = await analyzeOutfitFn({
      imageBase64,
      language,
      userPreferences: options?.userPreferences,
      purposes: options?.purposes, // Analiz amaçlarını gönder
    });

    console.log('[secureAnalyzeOutfit] Firebase Function responded:', {
      success: result.data.success,
      hasAnalysis: !!result.data.analysis,
    });

    if (result.data.success && result.data.analysis) {
      return {
        success: true,
        analysis: result.data.analysis,
        timestamp: result.data.timestamp,
      };
    }

    return {
      success: false,
      analysis: null,
      error: language === 'tr' ? 'Analiz basarisiz' : 'Analysis failed',
    };

  } catch (error: any) {
    console.error('Secure analysis error:', error);
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      name: error?.name,
      stack: error?.stack,
    });

    // Firebase Functions hata kodlari
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';

    // Turkce hata mesajlari
    const errorMessages: Record<string, { tr: string; en: string }> = {
      'functions/unauthenticated': {
        tr: 'Giris yapmaniz gerekiyor',
        en: 'Authentication required',
      },
      'functions/permission-denied': {
        tr: 'Bu islemi yapmaya yetkiniz yok',
        en: 'Permission denied',
      },
      'functions/resource-exhausted': {
        tr: 'Gunluk limit doldu veya cok fazla istek gonderdiniz',
        en: 'Daily limit reached or too many requests',
      },
      'functions/not-found': {
        tr: 'Kullanici bulunamadi',
        en: 'User not found',
      },
      'functions/invalid-argument': {
        tr: 'Gecersiz veri',
        en: 'Invalid data',
      },
      'functions/internal': {
        tr: 'Sunucu hatasi, lutfen tekrar deneyin',
        en: 'Server error, please try again',
      },
    };

    const knownError = errorMessages[errorCode];
    if (knownError) {
      // Eger hata mesajinda "analiz edilemez" gibi ifadeler varsa direkt kullan
      if (errorMessage && (
        errorMessage.includes('analiz edilemez') ||
        errorMessage.includes('cannot be analyzed') ||
        errorMessage.includes('Tespit edilen:') ||
        errorMessage.includes('Detected:')
      )) {
        return {
          success: false,
          analysis: null,
          error: errorMessage,
        };
      }

      return {
        success: false,
        analysis: null,
        error: language === 'tr' ? knownError.tr : knownError.en,
      };
    }

    // Bilinmeyen hata
    return {
      success: false,
      analysis: null,
      error: language === 'tr'
        ? 'Beklenmeyen bir hata olustu'
        : 'An unexpected error occurred',
    };
    } finally {
      // Clean up cache after request completes (success or failure)
      clearRequestCache(imageUri);
    }
  })();

  // Cache the promise
  inFlightRequests.set(imageUri, requestPromise);
  console.log(`[RequestCache] Cached request for ${imageUri.substring(0, 50)}...`);

  return requestPromise;
}
