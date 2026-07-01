// Local Analysis Storage Service
// Analiz sonuclarini cihazda saklamak icin

import AsyncStorage from '@react-native-async-storage/async-storage';
import { OutfitAnalysis } from '@/services/openai/outfitAnalysis';

// Storage key'leri
const STORAGE_KEYS = {
  ANALYSIS_HISTORY: '@analysis_history',
  ANALYSIS_CACHE: '@analysis_cache',
} as const;

// Kayitli analiz tipi
export interface StoredAnalysis {
  id: string;
  analysis: OutfitAnalysis;
  imageUri: string; // Local URI
  createdAt: number;
  averageScore: number;
}

// Max kayit sayisi
const MAX_HISTORY_SIZE = 50;

// Unique ID olustur
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Ortalama skor hesapla
function calculateAverageScore(analysis: OutfitAnalysis): number {
  const scores = [
    analysis.overallScore,
    analysis.colorHarmony.score,
    analysis.styleMatch.score,
    analysis.seasonMatch.score,
  ];
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

// Tum analiz gecmisini getir
export async function getAnalysisHistory(): Promise<StoredAnalysis[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ANALYSIS_HISTORY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Get analysis history error:', error);
    return [];
  }
}

// Yeni analiz kaydet
export async function saveAnalysis(
  analysis: OutfitAnalysis,
  imageUri: string
): Promise<StoredAnalysis> {
  try {
    const history = await getAnalysisHistory();

    const newEntry: StoredAnalysis = {
      id: generateId(),
      analysis,
      imageUri,
      createdAt: Date.now(),
      averageScore: calculateAverageScore(analysis),
    };

    // Yeni kaydi basa ekle
    const updatedHistory = [newEntry, ...history];

    // Limit kontrolu - eski kayitlari sil
    if (updatedHistory.length > MAX_HISTORY_SIZE) {
      updatedHistory.splice(MAX_HISTORY_SIZE);
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.ANALYSIS_HISTORY,
      JSON.stringify(updatedHistory)
    );

    return newEntry;
  } catch (error) {
    console.error('Save analysis error:', error);
    throw new Error('Analiz kaydedilemedi');
  }
}

// ID ile analiz getir
export async function getAnalysisById(id: string): Promise<StoredAnalysis | null> {
  try {
    const history = await getAnalysisHistory();
    return history.find(item => item.id === id) || null;
  } catch (error) {
    console.error('Get analysis by id error:', error);
    return null;
  }
}

// Analiz sil
export async function deleteAnalysis(id: string): Promise<boolean> {
  try {
    const history = await getAnalysisHistory();
    const filteredHistory = history.filter(item => item.id !== id);

    if (filteredHistory.length === history.length) {
      return false; // Silinecek kayit bulunamadi
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.ANALYSIS_HISTORY,
      JSON.stringify(filteredHistory)
    );

    return true;
  } catch (error) {
    console.error('Delete analysis error:', error);
    return false;
  }
}

// Tum gecmisi temizle
export async function clearAnalysisHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ANALYSIS_HISTORY);
  } catch (error) {
    console.error('Clear analysis history error:', error);
    throw new Error('Gecmis temizlenemedi');
  }
}

// Son N analizi getir
export async function getRecentAnalyses(count: number = 10): Promise<StoredAnalysis[]> {
  const history = await getAnalysisHistory();
  return history.slice(0, count);
}

// Tarih araligina gore filtrele
export async function getAnalysesByDateRange(
  startDate: Date,
  endDate: Date
): Promise<StoredAnalysis[]> {
  const history = await getAnalysisHistory();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  return history.filter(
    item => item.createdAt >= startTime && item.createdAt <= endTime
  );
}

// Bugunun analizlerini getir
export async function getTodaysAnalyses(): Promise<StoredAnalysis[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getAnalysesByDateRange(today, tomorrow);
}

// Toplam analiz sayisi
export async function getAnalysisCount(): Promise<number> {
  const history = await getAnalysisHistory();
  return history.length;
}

// Ortalama skor istatistigi
export async function getAverageScoreStats(): Promise<{
  average: number;
  highest: number;
  lowest: number;
  count: number;
}> {
  const history = await getAnalysisHistory();

  if (history.length === 0) {
    return { average: 0, highest: 0, lowest: 0, count: 0 };
  }

  const scores = history.map(item => item.averageScore);
  const sum = scores.reduce((a, b) => a + b, 0);

  return {
    average: Math.round((sum / scores.length) * 10) / 10,
    highest: Math.max(...scores),
    lowest: Math.min(...scores),
    count: history.length,
  };
}
