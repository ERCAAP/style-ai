// useAnalysis Hook - SIMPLIFIED VERSION
// Firebase Cloud Function üzerinden hızlı analiz (Jobs collection ve background tasks kaldırıldı)

import { useState, useCallback } from 'react';
import {
  OutfitAnalysis,
  calculateAverageScore,
  getScoreLevel,
  getScoreColor,
} from '@/services/openai';
import { secureAnalyzeOutfit } from '@/services/api/secureAnalysis';
import { saveAnalysis } from '@/services/localStorage';
import { UserPreferences } from '@/types/user';

export type AnalysisStatus =
  | 'idle'
  | 'preparing'
  | 'analyzing'
  | 'completed'
  | 'error';

// Analiz seçenekleri
export interface AnalysisOptions {
  language?: 'tr' | 'en';
  detailLevel?: 'basic' | 'detailed';
  userId?: string;
  deviceId?: string;
  userPreferences?: UserPreferences;
  purposes?: string[]; // Analiz amaçları
}

interface UseAnalysisReturn {
  // Durumlar
  status: AnalysisStatus;
  isAnalyzing: boolean;
  progress: number;
  progressText: string;

  // Sonuçlar
  result: OutfitAnalysis | null;
  averageScore: number | null;
  scoreLevel: 'low' | 'medium' | 'high' | 'excellent' | null;
  scoreColor: string | null;

  // Hata
  error: string | null;

  // Aksiyonlar
  startAnalysis: (imageUri: string, options?: AnalysisOptions) => Promise<OutfitAnalysis | null>;
  reset: () => void;

  // Yardımcı
  isConfigured: boolean;
}

export function useAnalysis(): UseAnalysisReturn {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState<OutfitAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cloud Function kullanıldığında her zaman yapılandırılmış kabul et
  const isConfigured = true;

  // Hesaplanan değerler
  const averageScore = result ? calculateAverageScore(result) : null;
  const scoreLevel = averageScore ? getScoreLevel(averageScore) : null;
  const scoreColor = averageScore ? getScoreColor(averageScore) : null;

  // Analizi başlat
  const startAnalysis = useCallback(async (
    imageUri: string,
    options: AnalysisOptions = {}
  ): Promise<OutfitAnalysis | null> => {
    const { language = 'tr', userPreferences, purposes } = options;

    // Sıfırla
    setError(null);
    setResult(null);
    setProgress(0);

    // Lokalize mesajlar
    const messages = {
      tr: {
        preparing: 'Hazırlanıyor...',
        analyzing: 'AI analiz ediyor...',
        saving: 'Sonuçlar kaydediliyor...',
        completed: 'Analiz tamamlandı!',
        analysisError: 'Analiz sırasında bir hata oluştu',
        unexpectedError: 'Beklenmeyen bir hata oluştu',
      },
      en: {
        preparing: 'Preparing...',
        analyzing: 'AI is analyzing...',
        saving: 'Saving results...',
        completed: 'Analysis completed!',
        analysisError: 'An error occurred during analysis',
        unexpectedError: 'An unexpected error occurred',
      },
    };
    const msg = messages[language];

    try {
      // 1. Hazırlanıyor
      setStatus('preparing');
      setProgressText(msg.preparing);
      setProgress(10);

      // 2. Analiz başlıyor
      setStatus('analyzing');
      setProgressText(msg.analyzing);
      setProgress(30);

      // Simüle edilmiş progress (30-85%)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + Math.random() * 5;
        });
      }, 500);

      console.log('[Analyzing] Starting analysis for:', imageUri);

      // 3. MINIMAL Cloud Function çağrısı (Firebase Secret'ten OpenAI key kullanır)
      const analysisResult = await secureAnalyzeOutfit(imageUri, {
        language,
        userPreferences: userPreferences ? {
          stylePreferences: userPreferences.stylePreferences || [],
          bodyType: userPreferences.bodyType || undefined,
          favoriteColors: userPreferences.favoriteColors,
          usageGoals: userPreferences.usageGoals,
        } : undefined,
        purposes: purposes,
      });

      clearInterval(progressInterval);
      setProgress(90);

      // 4. Sonucu işle
      if (!analysisResult.success || !analysisResult.analysis) {
        setError(analysisResult.error || msg.analysisError);
        setStatus('error');
        return null;
      }

      // 5. LOCAL STORAGE'A KAYDET (önemli - geçmiş için)
      setProgressText(msg.saving);

      try {
        await saveAnalysis(analysisResult.analysis, imageUri);
        console.log('✅ Analysis saved to local storage');
      } catch (saveError) {
        console.warn('⚠️ Local save failed:', saveError);
        // Local kayıt başarısız olsa bile devam et
      }

      setProgress(100);
      setResult(analysisResult.analysis);
      setStatus('completed');
      setProgressText(msg.completed);

      console.log('✅ Analysis completed successfully');

      return analysisResult.analysis;

    } catch (err) {
      console.error('❌ Analysis error:', err);

      setError(err instanceof Error ? err.message : msg.unexpectedError);
      setStatus('error');
      return null;
    }
  }, []);

  // Sıfırla
  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setProgressText('');
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    isAnalyzing: status === 'preparing' || status === 'analyzing',
    progress,
    progressText,
    result,
    averageScore,
    scoreLevel,
    scoreColor,
    error,
    startAnalysis,
    reset,
    isConfigured,
  };
}
