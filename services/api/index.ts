// API Services exports

export {
  APIError,
  handleAPIError,
  getErrorMessage,
  withErrorHandling,
  withRetry,
} from './errorHandler';

export {
  secureAnalyzeOutfit,
  type SecureAnalysisResult,
} from './secureAnalysis';

// P-IMAGE Cloud Service (uses Firebase Cloud Functions - secure)
export {
  createPImageGeneration,
  pollPImageStatus,
  generateOutfitTryOn,
  type PImageRequest,
  type PImageResult,
  type PImageStatus,
} from './pImageCloudService';
