// API Types - API ile ilgili tipler

// API hata kodlari
export enum APIErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

// API hatasi
export interface APIError {
  code: APIErrorCode;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

// Genel API yaniti
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

// Sayfalama bilgisi
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Sayfalamali API yaniti
export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination?: PaginationInfo;
}

// Rate limit bilgisi
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

// Upload ilerleme bilgisi
export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
}

// Analiz durumu
export type AnalysisStatus =
  | 'idle'
  | 'checking_limit'
  | 'uploading'
  | 'analyzing'
  | 'completed'
  | 'error';

// Analiz job tipi
export interface AnalysisJob {
  id: string;
  userId: string;
  status: AnalysisStatus;
  type: 'outfit' | 'item' | 'color';
  inputImageUrl?: string;
  result?: AnalysisResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  processingTime?: number; // milisaniye
}

// Analiz sonucu
export interface AnalysisResult {
  overallScore: number;
  items: AnalyzedItem[];
  colorHarmony: ColorHarmonyResult;
  styleMatch: StyleMatchResult;
  seasonMatch: SeasonMatchResult;
  suggestions: string[];
  alternatives: string[];
}

// Analiz edilen kiyafet
export interface AnalyzedItem {
  name: string;
  color: string;
  style: string;
  condition: string;
  recommendations: string[];
}

// Renk uyumu sonucu
export interface ColorHarmonyResult {
  score: number;
  comment: string;
  dominantColors: string[];
  suggestions: string[];
}

// Stil uyumu sonucu
export interface StyleMatchResult {
  score: number;
  detectedStyle: string;
  comment: string;
  occasion: string[];
}

// Mevsim uyumu sonucu
export interface SeasonMatchResult {
  score: number;
  suitableSeasons: string[];
  comment: string;
}
