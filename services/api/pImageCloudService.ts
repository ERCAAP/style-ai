/**
 * P-IMAGE Cloud Service
 * Uses Firebase Cloud Functions for secure API integration
 * API key is stored in Firebase secrets, not exposed to client
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth } from '@/services/firebase/config';
import * as FileSystem from 'expo-file-system/legacy';
import { compressImage } from '@/utils/imageCompression';

// Firebase Functions instance (Europe region)
const functions = getFunctions(app, 'europe-west1');

// Cloud Function references
const tryOutfitFn = httpsCallable<
  {
    userImageBase64: string;
    clothingImageBase64s: string[];
    customPrompt?: string;
    aspectRatio?: string;
    turbo?: boolean;
  },
  {
    success: boolean;
    predictionId: string;
    status: string;
    message: string;
  }
>(functions, 'tryOutfit');

const getPredictionStatusFn = httpsCallable<
  { predictionId: string },
  {
    success: boolean;
    status: 'processing' | 'completed' | 'failed' | 'succeeded' | 'error';
    resultUrl?: string;
    error?: string;
    message?: string;
  }
>(functions, 'getPredictionStatus');

export interface PImageRequest {
  userImageUri: string;
  clothingImageUris: string[];
  turbo?: boolean;
  customPrompt?: string;
}

export interface PImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  predictionId?: string;
}

export interface PImageStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  imageUrl?: string;
  error?: string;
}

// Request deduplication cache - prevent duplicate P-IMAGE requests
const inFlightPImageRequests = new Map<string, Promise<PImageResult>>();

// Clear cache entry
function clearPImageRequestCache(key: string): void {
  inFlightPImageRequests.delete(key);
  console.log(`[P-IMAGE Cache] Cleared cache for request: ${key.substring(0, 50)}...`);
}

// Polling configuration
const MAX_POLL_ATTEMPTS = 60; // 5 minutes with 5s intervals
const POLL_INTERVAL_MS = 5000; // 5 seconds

/**
 * Converts a local image URI to base64 string with compression
 * Compresses images to reduce Cloud Function payload size
 */
async function imageUriToBase64(uri: string, isUserImage: boolean = false): Promise<string> {
  try {
    // Compress image first to reduce size
    // User image can be slightly larger, clothing images should be smaller
    const compressed = await compressImage(uri, {
      maxWidth: isUserImage ? 768 : 512,
      maxHeight: isUserImage ? 768 : 512,
      quality: 0.7,
      format: 'jpeg',
    });

    console.log(`Image compressed: ${uri.substring(uri.length - 20)} -> ${compressed.fileSize} bytes (${compressed.width}x${compressed.height})`);

    const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`Base64 length: ${base64.length} characters`);
    return base64;
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    throw new Error('Görsel yüklenemedi');
  }
}

/**
 * Creates a P-IMAGE generation request via Cloud Function
 * Now uses base64 encoding instead of Firebase Storage URLs
 */
export async function createPImageGeneration(
  request: PImageRequest
): Promise<PImageResult> {
  const { userImageUri, clothingImageUris, turbo = true, customPrompt } = request;

  try {
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: 'Giriş yapmanız gerekiyor. Lütfen çıkış yapıp tekrar giriş yapın.',
      };
    }

    console.log('Converting and compressing images to base64...');

    // Convert user image to base64 (larger size allowed)
    const userImageBase64 = await imageUriToBase64(userImageUri, true);
    console.log('User image converted to base64');

    // Convert clothing images to base64 (smaller size for efficiency)
    const clothingImageBase64s: string[] = [];
    for (let i = 0; i < clothingImageUris.length; i++) {
      const base64 = await imageUriToBase64(clothingImageUris[i], false);
      clothingImageBase64s.push(base64);
      console.log(`Clothing image ${i + 1}/${clothingImageUris.length} converted to base64`);
    }

    console.log(`Converted and compressed ${clothingImageBase64s.length + 1} images to base64`);
    console.log('Base64 lengths:', {
      userImage: userImageBase64.length,
      clothingImages: clothingImageBase64s.map(b => b.length),
    });

    // Call Cloud Function with base64 data
    console.log('Calling tryOutfit Cloud Function...');
    const result = await tryOutfitFn({
      userImageBase64,
      clothingImageBase64s,
      customPrompt,
      aspectRatio: 'match_input_image',
      turbo,
    });

    console.log('Cloud Function response:', result.data);

    if (result.data.success && result.data.predictionId) {
      return {
        success: true,
        predictionId: result.data.predictionId,
      };
    } else {
      return {
        success: false,
        error: result.data.message || 'Generation failed',
      };
    }
  } catch (error: any) {
    console.error('P-IMAGE generation error:', error);
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
    });

    // Firebase Functions error handling
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';

    const errorMessages: Record<string, string> = {
      'functions/unauthenticated': 'Giriş yapmanız gerekiyor',
      'functions/permission-denied': 'Bu işlemi yapmaya yetkiniz yok',
      'functions/resource-exhausted': 'Çok fazla istek gönderdiniz. Lütfen bekleyin.',
      'functions/not-found': 'Kullanıcı bulunamadı',
      'functions/invalid-argument': 'Geçersiz veri',
      'functions/internal': 'Sunucu hatası, lütfen tekrar deneyin',
      'functions/unavailable': 'Servis şu anda kullanılamıyor, lütfen birkaç dakika sonra tekrar deneyin',
      'functions/deadline-exceeded': 'İstek zaman aşımına uğradı, lütfen tekrar deneyin',
    };

    const knownError = errorMessages[errorCode];
    if (knownError) {
      return {
        success: false,
        error: knownError,
      };
    }

    // If we have a detailed error message from the server, use it
    if (errorMessage && errorMessage.length > 0) {
      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: false,
      error: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
    };
  }
}

/**
 * Polls the prediction status via Cloud Function
 */
export async function pollPImageStatus(
  predictionId: string,
  onProgress?: (status: PImageStatus) => void
): Promise<PImageResult> {
  let attempts = 0;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 3;

  while (attempts < MAX_POLL_ATTEMPTS) {
    try {
      console.log(`Polling attempt ${attempts + 1}/${MAX_POLL_ATTEMPTS}`);

      const result = await getPredictionStatusFn({ predictionId });

      // Log the full response for debugging
      console.log('Poll response:', JSON.stringify(result.data, null, 2));
      console.log('Poll response structure check:', {
        hasData: !!result.data,
        status: result.data?.status,
        hasResultUrl: !!result.data?.resultUrl,
        resultUrl: result.data?.resultUrl,
        success: result.data?.success,
        allKeys: result.data ? Object.keys(result.data) : [],
      });

      // Reset error counter on successful request
      consecutiveErrors = 0;

      // Update progress callback
      if (onProgress) {
        const progress = Math.min(95, (attempts / MAX_POLL_ATTEMPTS) * 100);

        if (result.data.status === 'processing') {
          onProgress({
            status: 'processing',
            progress,
          });
        } else if (result.data.status === 'completed' && result.data.resultUrl) {
          onProgress({
            status: 'completed',
            progress: 100,
            imageUrl: result.data.resultUrl,
          });
        } else if (result.data.status === 'failed') {
          onProgress({
            status: 'failed',
            error: result.data.error || 'Generation failed',
          });
        }
      }

      // Check if completed (also check for 'succeeded' as a fallback)
      if ((result.data.status === 'completed' || result.data.status === 'succeeded') && result.data.resultUrl) {
        console.log('✅ COMPLETION DETECTED! Returning success with imageUrl');
        return {
          success: true,
          imageUrl: result.data.resultUrl,
          predictionId,
        };
      }

      // Check if failed
      if (result.data.status === 'failed' || result.data.status === 'error') {
        console.log('❌ FAILURE DETECTED! Returning error');
        return {
          success: false,
          error: result.data.error || 'Kıyafet deneme işlemi başarısız oldu',
          predictionId,
        };
      }

      // Still processing, wait and try again
      attempts++;
      await sleep(POLL_INTERVAL_MS);

    } catch (error: any) {
      console.error('Poll error:', error);
      console.error('Poll error details:', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
      });
      consecutiveErrors++;

      // If we have too many consecutive errors, fail early
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error('Max consecutive errors reached, failing...');
        return {
          success: false,
          error: 'Sunucuya bağlanırken sürekli hata oluşuyor. İnternet bağlantınızı kontrol edin.',
          predictionId,
        };
      }

      attempts++;
      await sleep(POLL_INTERVAL_MS);
    }
  }

  // Timeout
  console.error('Polling timeout reached after', MAX_POLL_ATTEMPTS, 'attempts');
  return {
    success: false,
    error: 'İşlem zaman aşımına uğradı (5 dakika). Lütfen daha az kıyafet ile tekrar deneyin.',
    predictionId,
  };
}

/**
 * Complete workflow: Create generation and poll for result
 * No Firebase Storage cleanup needed anymore - we use base64
 */
export async function generateOutfitTryOn(
  request: PImageRequest,
  onProgress?: (status: PImageStatus) => void
): Promise<PImageResult> {
  const { userImageUri, clothingImageUris } = request;

  // Create unique request key
  const requestKey = `${userImageUri}_${JSON.stringify(clothingImageUris.sort())}`;

  // Check if there's already an in-flight request for this combination
  const existingRequest = inFlightPImageRequests.get(requestKey);
  if (existingRequest) {
    console.log('[P-IMAGE] Found existing in-flight request, returning cached promise');
    console.log('[P-IMAGE] Request key:', requestKey.substring(0, 100) + '...');
    return existingRequest;
  }

  // Create and cache the request promise
  const requestPromise = (async (): Promise<PImageResult> => {
    try {
      console.log('[P-IMAGE] Starting NEW generation...');
      console.log('[P-IMAGE] User image:', userImageUri.substring(userImageUri.length - 50));
      console.log('[P-IMAGE] Clothing images:', clothingImageUris.length);

      // Create generation via Cloud Function (with base64 images)
      const createResult = await createPImageGeneration(request);

      if (!createResult.success || !createResult.predictionId) {
        return createResult;
      }

      // Poll for status
      const result = await pollPImageStatus(createResult.predictionId, onProgress);

      return result;
    } catch (error) {
      console.error('[P-IMAGE] Generation error:', error);
      throw error;
    } finally {
      // Clean up cache after request completes (success or failure)
      clearPImageRequestCache(requestKey);
    }
  })();

  // Cache the promise
  inFlightPImageRequests.set(requestKey, requestPromise);
  console.log(`[P-IMAGE Cache] Cached request for ${requestKey.substring(0, 50)}...`);

  return requestPromise;
}

/**
 * Helper function to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
