/**
 * P-IMAGE API Service
 * Integrates with EachLabs P-IMAGE API for virtual clothing try-on
 */

import { uploadImage } from '@/services/firebase/storage';
import { generateClothingTransferPrompt } from './pImagePromptGenerator';
import Constants from 'expo-constants';

const EACHLABS_API_KEY = Constants.expoConfig?.extra?.eachlabsApiKey ||
                         process.env.EXPO_PUBLIC_EACHLABS_API_KEY;
const EACHLABS_API_URL = 'https://api.eachlabs.ai/v1/prediction/';

// Polling configuration
const MAX_POLL_ATTEMPTS = 60; // 5 minutes with 5s intervals
const POLL_INTERVAL_MS = 5000; // 5 seconds

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

/**
 * Uploads a local image to Firebase Storage and returns the public URL
 */
async function getPublicImageUrl(uri: string, index: number): Promise<string> {
  try {
    // Upload to Firebase Storage
    const uploadResult = await uploadImage(uri, `outfit-try-on/${Date.now()}_${index}.jpg`);
    return uploadResult.downloadURL;
  } catch (error) {
    console.error(`Failed to upload image ${index}:`, error);
    throw new Error(`Görsel ${index} yüklenemedi`);
  }
}

/**
 * Creates a P-IMAGE generation request
 */
export async function createPImageGeneration(
  request: PImageRequest
): Promise<PImageResult> {
  if (!EACHLABS_API_KEY) {
    return {
      success: false,
      error: 'EachLabs API key is not configured',
    };
  }

  const { userImageUri, clothingImageUris, turbo = true, customPrompt } = request;

  try {
    // Upload all images to get public URLs
    console.log('Uploading images to Firebase Storage...');
    const imageUrls: string[] = [];

    // Upload user image first
    const userUrl = await getPublicImageUrl(userImageUri, 0);
    imageUrls.push(userUrl);

    // Upload clothing images
    for (let i = 0; i < clothingImageUris.length; i++) {
      const url = await getPublicImageUrl(clothingImageUris[i], i + 1);
      imageUrls.push(url);
    }

    console.log(`Uploaded ${imageUrls.length} images successfully`);

    // Generate prompt
    const prompt = customPrompt || generateClothingTransferPrompt({
      preserveFace: true,
      preserveHair: true,
      preserveBodyShape: true,
      clothingItemsCount: clothingImageUris.length,
    });

    console.log('Generated prompt:', prompt);

    // Create API request
    const apiRequest = {
      model: 'p-image-edit',
      version: '0.0.1',
      input: {
        aspect_ratio: 'match_input_image',
        images: imageUrls,
        prompt: prompt,
        turbo: turbo,
      },
      webhook_url: '', // We'll use polling instead
    };

    console.log('Sending request to P-IMAGE API...');

    // Call P-IMAGE API
    const response = await fetch(EACHLABS_API_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': EACHLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('P-IMAGE API error:', response.status, errorText);
      return {
        success: false,
        error: `API request failed: ${response.status}`,
      };
    }

    const result = await response.json();
    console.log('P-IMAGE API response:', result);

    // The API should return a prediction ID
    if (result.id) {
      return {
        success: true,
        predictionId: result.id,
      };
    } else if (result.output && Array.isArray(result.output) && result.output.length > 0) {
      // Some APIs return the result immediately
      return {
        success: true,
        imageUrl: result.output[0],
      };
    } else {
      return {
        success: false,
        error: 'Unexpected API response format',
      };
    }
  } catch (error: any) {
    console.error('P-IMAGE generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create generation',
    };
  }
}

/**
 * Polls the P-IMAGE API for the generation status
 */
export async function pollPImageStatus(
  predictionId: string,
  onProgress?: (status: PImageStatus) => void
): Promise<PImageResult> {
  if (!EACHLABS_API_KEY) {
    return {
      success: false,
      error: 'EachLabs API key is not configured',
    };
  }

  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    try {
      const response = await fetch(`${EACHLABS_API_URL}${predictionId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': EACHLABS_API_KEY,
        },
      });

      if (!response.ok) {
        console.error('Status check failed:', response.status);
        attempts++;
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      const result = await response.json();
      console.log(`Poll attempt ${attempts + 1}:`, result.status);

      // Update progress callback
      if (onProgress) {
        const progress = Math.min(95, (attempts / MAX_POLL_ATTEMPTS) * 100);

        if (result.status === 'processing' || result.status === 'pending') {
          onProgress({
            status: 'processing',
            progress,
          });
        }
      }

      // Check if completed
      if (result.status === 'succeeded' || result.status === 'completed') {
        const imageUrl = result.output?.[0] || result.output;

        if (onProgress) {
          onProgress({
            status: 'completed',
            progress: 100,
            imageUrl,
          });
        }

        return {
          success: true,
          imageUrl,
          predictionId,
        };
      }

      // Check if failed
      if (result.status === 'failed' || result.status === 'error') {
        const errorMessage = result.error || 'Generation failed';

        if (onProgress) {
          onProgress({
            status: 'failed',
            error: errorMessage,
          });
        }

        return {
          success: false,
          error: errorMessage,
          predictionId,
        };
      }

      // Still processing, wait and try again
      attempts++;
      await sleep(POLL_INTERVAL_MS);

    } catch (error: any) {
      console.error('Poll error:', error);
      attempts++;
      await sleep(POLL_INTERVAL_MS);
    }
  }

  // Timeout
  return {
    success: false,
    error: 'Generation timed out',
    predictionId,
  };
}

/**
 * Complete workflow: Create generation and poll for result
 */
export async function generateOutfitTryOn(
  request: PImageRequest,
  onProgress?: (status: PImageStatus) => void
): Promise<PImageResult> {
  // Create generation
  const createResult = await createPImageGeneration(request);

  if (!createResult.success || !createResult.predictionId) {
    return createResult;
  }

  // If we got the image URL immediately, return it
  if (createResult.imageUrl) {
    return createResult;
  }

  // Otherwise, poll for status
  return pollPImageStatus(createResult.predictionId, onProgress);
}

/**
 * Helper function to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
