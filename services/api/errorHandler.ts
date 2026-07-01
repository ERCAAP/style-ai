// API Error Handler - Hata yonetimi

import { APIErrorCode, APIError as APIErrorType } from '@/types/api';

// API hata sinifi
export class APIError extends Error {
  code: APIErrorCode;
  statusCode?: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    code: APIErrorCode,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  // JSON formatinda donustur
  toJSON(): APIErrorType {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// Hata mesajlari (lokalize)
const ERROR_MESSAGES: Record<string, Record<APIErrorCode, string>> = {
  tr: {
    [APIErrorCode.UNAUTHORIZED]: 'Oturum suresi doldu. Lutfen tekrar giris yapin.',
    [APIErrorCode.RATE_LIMITED]: 'Cok fazla istek gonderdiniz. Lutfen bekleyin.',
    [APIErrorCode.NETWORK_ERROR]: 'Internet baglantisi bulunamadi.',
    [APIErrorCode.SERVER_ERROR]: 'Sunucu hatasi. Lutfen daha sonra tekrar deneyin.',
    [APIErrorCode.VALIDATION_ERROR]: 'Girdiginiz bilgiler gecersiz.',
    [APIErrorCode.NOT_FOUND]: 'Aradiginiz kayit bulunamadi.',
    [APIErrorCode.QUOTA_EXCEEDED]: 'Gunluk kullanim limitinizi astiniz.',
    [APIErrorCode.STORAGE_ERROR]: 'Dosya yukleme hatasi.',
    [APIErrorCode.TIMEOUT]: 'Islem zaman asimina ugradi.',
    [APIErrorCode.UNKNOWN]: 'Bilinmeyen bir hata olustu.',
  },
  en: {
    [APIErrorCode.UNAUTHORIZED]: 'Session expired. Please log in again.',
    [APIErrorCode.RATE_LIMITED]: 'Too many requests. Please wait.',
    [APIErrorCode.NETWORK_ERROR]: 'No internet connection.',
    [APIErrorCode.SERVER_ERROR]: 'Server error. Please try again later.',
    [APIErrorCode.VALIDATION_ERROR]: 'Invalid input.',
    [APIErrorCode.NOT_FOUND]: 'Resource not found.',
    [APIErrorCode.QUOTA_EXCEEDED]: 'Daily usage limit exceeded.',
    [APIErrorCode.STORAGE_ERROR]: 'File upload error.',
    [APIErrorCode.TIMEOUT]: 'Operation timed out.',
    [APIErrorCode.UNKNOWN]: 'An unknown error occurred.',
  },
};

// Hata mesajini al
export function getErrorMessage(code: APIErrorCode, language: 'tr' | 'en' = 'tr'): string {
  return ERROR_MESSAGES[language][code] || ERROR_MESSAGES[language][APIErrorCode.UNKNOWN];
}

// Hatayi isle ve APIError'a donustur
export function handleAPIError(error: unknown, language: 'tr' | 'en' = 'tr'): APIError {
  // Zaten APIError ise direkt don
  if (error instanceof APIError) {
    return error;
  }

  // Firebase hatalari
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network hatalari
    if (message.includes('network') || message.includes('fetch')) {
      return new APIError(
        getErrorMessage(APIErrorCode.NETWORK_ERROR, language),
        APIErrorCode.NETWORK_ERROR
      );
    }

    // Firebase auth hatalari
    if (message.includes('auth') || message.includes('token')) {
      return new APIError(
        getErrorMessage(APIErrorCode.UNAUTHORIZED, language),
        APIErrorCode.UNAUTHORIZED,
        401
      );
    }

    // Timeout
    if (message.includes('timeout')) {
      return new APIError(
        getErrorMessage(APIErrorCode.TIMEOUT, language),
        APIErrorCode.TIMEOUT,
        408
      );
    }

    // Permission denied
    if (message.includes('permission') || message.includes('denied')) {
      return new APIError(
        getErrorMessage(APIErrorCode.UNAUTHORIZED, language),
        APIErrorCode.UNAUTHORIZED,
        403
      );
    }

    // Not found
    if (message.includes('not found') || message.includes('no document')) {
      return new APIError(
        getErrorMessage(APIErrorCode.NOT_FOUND, language),
        APIErrorCode.NOT_FOUND,
        404
      );
    }

    // Storage hatalari
    if (message.includes('storage') || message.includes('upload')) {
      return new APIError(
        getErrorMessage(APIErrorCode.STORAGE_ERROR, language),
        APIErrorCode.STORAGE_ERROR
      );
    }

    // Rate limit
    if (message.includes('rate') || message.includes('limit') || message.includes('429')) {
      return new APIError(
        getErrorMessage(APIErrorCode.RATE_LIMITED, language),
        APIErrorCode.RATE_LIMITED,
        429
      );
    }
  }

  // HTTP response hatalari
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as any).status;

    switch (status) {
      case 401:
        return new APIError(
          getErrorMessage(APIErrorCode.UNAUTHORIZED, language),
          APIErrorCode.UNAUTHORIZED,
          401
        );
      case 403:
        return new APIError(
          getErrorMessage(APIErrorCode.UNAUTHORIZED, language),
          APIErrorCode.UNAUTHORIZED,
          403
        );
      case 404:
        return new APIError(
          getErrorMessage(APIErrorCode.NOT_FOUND, language),
          APIErrorCode.NOT_FOUND,
          404
        );
      case 429:
        return new APIError(
          getErrorMessage(APIErrorCode.RATE_LIMITED, language),
          APIErrorCode.RATE_LIMITED,
          429
        );
      case 500:
      case 502:
      case 503:
        return new APIError(
          getErrorMessage(APIErrorCode.SERVER_ERROR, language),
          APIErrorCode.SERVER_ERROR,
          status
        );
    }
  }

  // Bilinmeyen hata
  return new APIError(
    getErrorMessage(APIErrorCode.UNKNOWN, language),
    APIErrorCode.UNKNOWN
  );
}

// Async fonksiyon sarmalayici
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  language: 'tr' | 'en' = 'tr'
): Promise<{ data?: T; error?: APIError }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    return { error: handleAPIError(error, language) };
  }
}

// Retry mekanizmasi
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Rate limit veya server error ise retry yap
      const apiError = handleAPIError(error);
      if (
        apiError.code === APIErrorCode.RATE_LIMITED ||
        apiError.code === APIErrorCode.SERVER_ERROR ||
        apiError.code === APIErrorCode.NETWORK_ERROR
      ) {
        const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Diger hatalar icin direkt at
      throw error;
    }
  }

  throw lastError;
}

export default { APIError, handleAPIError, getErrorMessage, withErrorHandling, withRetry };
