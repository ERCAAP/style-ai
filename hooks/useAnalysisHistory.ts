// useAnalysisHistory Hook
// Kullanicinin analiz gecmisini yonetir

import { useState, useCallback, useEffect } from 'react';
import { getUserAnalysisHistory, Job } from '@/services/firebase/jobs';
import { getAnalysisHistory, StoredAnalysis } from '@/services/localStorage/analysisStorage';
import { useAuthContext } from '@/contexts';
import { OutfitAnalysis, calculateAverageScore } from '@/services/openai';

export interface AnalysisHistoryItem {
  id: string;
  imageUrl: string;
  analysis: OutfitAnalysis;
  averageScore: number;
  createdAt: Date;
  processingTime?: number;
}

interface UseAnalysisHistoryReturn {
  // Data
  history: AnalysisHistoryItem[];

  // State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;

  // Meta
  hasMore: boolean;
  totalCount: number;
}

const PAGE_SIZE = 20;

export function useAnalysisHistory(): UseAnalysisHistoryReturn {
  const { user } = useAuthContext();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Job'u AnalysisHistoryItem'a donustur
  const jobToHistoryItem = useCallback((job: Job): AnalysisHistoryItem | null => {
    if (!job.output?.analysis) return null;

    return {
      id: job.id,
      imageUrl: job.input.imageUrl,
      analysis: job.output.analysis,
      averageScore: calculateAverageScore(job.output.analysis),
      createdAt: job.createdAt,
      processingTime: job.processingTime,
    };
  }, []);

  // StoredAnalysis'i AnalysisHistoryItem'a donustur
  const storedToHistoryItem = useCallback((stored: StoredAnalysis): AnalysisHistoryItem => {
    return {
      id: stored.id,
      imageUrl: stored.imageUri, // localStorage'da imageUri olarak kaydediliyor
      analysis: stored.analysis,
      averageScore: stored.averageScore,
      createdAt: new Date(stored.createdAt),
    };
  }, []);

  // Ilk yukle
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Önce localStorage'dan al (her zaman mevcut)
      const localHistory = await getAnalysisHistory();
      const localItems = localHistory.map(storedToHistoryItem);

      // Eğer kullanıcı authenticated ise Firebase'den de al
      if (user?.uid) {
        try {
          const jobs = await getUserAnalysisHistory(user.uid, PAGE_SIZE);
          const firebaseItems = jobs
            .map(jobToHistoryItem)
            .filter((item): item is AnalysisHistoryItem => item !== null);

          // Her iki kaynağı birleştir, tarihlerine göre sırala
          const allItems = [...localItems, ...firebaseItems];
          const uniqueItems = Array.from(
            new Map(allItems.map(item => [item.id, item])).values()
          ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          setHistory(uniqueItems);
          setHasMore(jobs.length >= PAGE_SIZE);
        } catch (firebaseErr) {
          console.warn('Firebase history load failed, using local only:', firebaseErr);
          // Firebase hatası olsa bile local veriyi kullan
          setHistory(localItems);
          setHasMore(false);
        }
      } else {
        // Authenticated değilse sadece local veriyi kullan
        setHistory(localItems);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Load analysis history error:', err);
      setError('Gecmis yuklenemedi');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, jobToHistoryItem, storedToHistoryItem]);

  // Yenile
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      // localStorage'dan al
      const localHistory = await getAnalysisHistory();
      const localItems = localHistory.map(storedToHistoryItem);

      // Firebase'den de al (eğer authenticated ise)
      if (user?.uid) {
        try {
          const jobs = await getUserAnalysisHistory(user.uid, PAGE_SIZE);
          const firebaseItems = jobs
            .map(jobToHistoryItem)
            .filter((item): item is AnalysisHistoryItem => item !== null);

          // Birleştir ve sırala
          const allItems = [...localItems, ...firebaseItems];
          const uniqueItems = Array.from(
            new Map(allItems.map(item => [item.id, item])).values()
          ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          setHistory(uniqueItems);
          setHasMore(jobs.length >= PAGE_SIZE);
        } catch (firebaseErr) {
          console.warn('Firebase refresh failed, using local only:', firebaseErr);
          setHistory(localItems);
          setHasMore(false);
        }
      } else {
        setHistory(localItems);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Refresh analysis history error:', err);
      setError('Yenileme basarisiz');
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.uid, jobToHistoryItem, storedToHistoryItem]);

  // Daha fazla yukle (pagination icin - ileride gerekebilir)
  const loadMore = useCallback(async () => {
    // Su an icin temel implementasyon
    // Ileride cursor-based pagination eklenebilir
  }, []);

  // Component mount oldugunda yukle
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    isRefreshing,
    error,
    refresh,
    loadMore,
    hasMore,
    totalCount: history.length,
  };
}
