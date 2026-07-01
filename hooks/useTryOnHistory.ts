/**
 * useTryOnHistory Hook
 * Kıyafet deneme sonuçlarını local cihazda saklar (AsyncStorage)
 */

import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tryOnHistory';
const MAX_HISTORY_ITEMS = 50; // Max 50 sonuç tut

export interface TryOnHistoryItem {
  id: string;
  resultImageUrl: string;
  userImageUri: string; // Original user photo
  clothingImages: string[]; // Original clothing photos
  createdAt: string; // ISO date string
  predictionId?: string;
}

interface UseTryOnHistoryReturn {
  // Data
  history: TryOnHistoryItem[];

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  saveResult: (item: Omit<TryOnHistoryItem, 'id' | 'createdAt'>) => Promise<void>;
  deleteResult: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;

  // Meta
  totalCount: number;
}

export function useTryOnHistory(): UseTryOnHistoryReturn {
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load history from AsyncStorage
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: TryOnHistoryItem[] = JSON.parse(stored);
        // Sort by date (newest first)
        parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setHistory(parsed);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Load try-on history error:', err);
      setError('Geçmiş yüklenemedi');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save new result
  const saveResult = useCallback(
    async (item: Omit<TryOnHistoryItem, 'id' | 'createdAt'>) => {
      try {
        const newItem: TryOnHistoryItem = {
          ...item,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
        };

        // Add to beginning of array (newest first)
        let updatedHistory = [newItem, ...history];

        // Limit to MAX_HISTORY_ITEMS
        if (updatedHistory.length > MAX_HISTORY_ITEMS) {
          updatedHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);
        }

        // Save to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

        // Update state
        setHistory(updatedHistory);

        console.log('Try-on result saved to history:', newItem.id);
      } catch (err) {
        console.error('Save try-on result error:', err);
        throw new Error('Sonuç kaydedilemedi');
      }
    },
    [history]
  );

  // Delete a result
  const deleteResult = useCallback(
    async (id: string) => {
      try {
        const updatedHistory = history.filter((item) => item.id !== id);

        // Save to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

        // Update state
        setHistory(updatedHistory);

        console.log('Try-on result deleted:', id);
      } catch (err) {
        console.error('Delete try-on result error:', err);
        throw new Error('Sonuç silinemedi');
      }
    },
    [history]
  );

  // Clear all history
  const clearAll = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setHistory([]);
      console.log('All try-on history cleared');
    } catch (err) {
      console.error('Clear try-on history error:', err);
      throw new Error('Geçmiş temizlenemedi');
    }
  }, []);

  // Refresh (reload from storage)
  const refresh = useCallback(async () => {
    await loadHistory();
  }, [loadHistory]);

  // Load on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    error,
    saveResult,
    deleteResult,
    clearAll,
    refresh,
    totalCount: history.length,
  };
}
