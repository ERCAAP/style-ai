// Arka Plan Analiz Görevi
// Uygulama kapatıldığında veya arka planda çalıştığında analiz işleminin devam etmesini sağlar

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureAnalyzeOutfit } from '@/services/api/secureAnalysis';
import { saveAnalysis } from '@/services/localStorage';
import { sendLocalizedAnalysisNotification } from '@/services/notifications';
import { calculateAverageScore } from '@/services/openai';
import {
  completeJobWithAnalysis,
  failJob,
  updateJobStatus,
} from '@/services/firebase/jobs';

// Task adı
export const BACKGROUND_ANALYSIS_TASK = 'BACKGROUND_ANALYSIS_TASK';

// AsyncStorage anahtarları
const STORAGE_KEYS = {
  PENDING_ANALYSIS: '@pending_analysis',
  ANALYSIS_STATUS: '@analysis_status',
};

// Analiz durumu tipi
export interface PendingAnalysis {
  imageUri: string;
  userId: string;
  deviceId?: string;
  language: 'tr' | 'en';
  userPreferences?: any;
  purposes?: string[];
  jobId?: string;
  startTime: number;
}

// Analiz durumunu kaydet
export async function savePendingAnalysis(analysis: PendingAnalysis): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ANALYSIS, JSON.stringify(analysis));
    await AsyncStorage.setItem(STORAGE_KEYS.ANALYSIS_STATUS, 'pending');
    console.log('📝 Pending analysis saved to storage');
  } catch (error) {
    console.error('Failed to save pending analysis:', error);
    throw error;
  }
}

// Bekleyen analizi al
export async function getPendingAnalysis(): Promise<PendingAnalysis | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ANALYSIS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get pending analysis:', error);
    return null;
  }
}

// Analiz durumunu kontrol et
export async function getAnalysisStatus(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.ANALYSIS_STATUS);
  } catch (error) {
    console.error('Failed to get analysis status:', error);
    return null;
  }
}

// Analiz durumunu güncelle
export async function updateAnalysisStatus(status: 'pending' | 'processing' | 'completed' | 'failed'): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ANALYSIS_STATUS, status);
  } catch (error) {
    console.error('Failed to update analysis status:', error);
  }
}

// Bekleyen analizi temizle
export async function clearPendingAnalysis(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_ANALYSIS);
    await AsyncStorage.removeItem(STORAGE_KEYS.ANALYSIS_STATUS);
    console.log('🧹 Pending analysis cleared');
  } catch (error) {
    console.error('Failed to clear pending analysis:', error);
  }
}

// Arka plan görevini tanımla
TaskManager.defineTask(BACKGROUND_ANALYSIS_TASK, async () => {
  console.log('🔄 Background analysis task started');

  try {
    // Bekleyen analiz var mı kontrol et
    const pendingAnalysis = await getPendingAnalysis();

    if (!pendingAnalysis) {
      console.log('No pending analysis found');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const status = await getAnalysisStatus();

    // Eğer işlem zaten tamamlanmış veya işleniyor ise atla
    if (status === 'completed' || status === 'processing') {
      console.log(`Analysis already ${status}, skipping`);
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // İşlem durumunu güncelle
    await updateAnalysisStatus('processing');

    // Job durumunu güncelle (varsa)
    if (pendingAnalysis.jobId) {
      try {
        await updateJobStatus(pendingAnalysis.jobId, 'processing');
      } catch (error) {
        console.warn('Failed to update job status:', error);
      }
    }

    console.log('🚀 Starting background analysis');

    // Analizi gerçekleştir
    const result = await secureAnalyzeOutfit(pendingAnalysis.imageUri, {
      language: pendingAnalysis.language,
      userPreferences: pendingAnalysis.userPreferences,
      purposes: pendingAnalysis.purposes,
    });

    if (!result.success || !result.analysis) {
      console.error('❌ Analysis failed:', result.error);

      // Job'u başarısız olarak işaretle (varsa)
      if (pendingAnalysis.jobId) {
        try {
          await failJob(
            pendingAnalysis.jobId,
            'BACKGROUND_ANALYSIS_FAILED',
            result.error || 'Unknown error'
          );
        } catch (error) {
          console.warn('Failed to mark job as failed:', error);
        }
      }

      await updateAnalysisStatus('failed');

      // Kullanıcıya bildirim gönder
      await sendLocalizedAnalysisNotification(0, pendingAnalysis.language, true);

      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    console.log('✅ Analysis completed successfully');

    // Sonucu local storage'a kaydet
    try {
      await saveAnalysis(result.analysis, pendingAnalysis.imageUri);
      console.log('💾 Analysis saved to local storage');
    } catch (error) {
      console.warn('Failed to save analysis locally:', error);
    }

    // Job'u tamamla (varsa)
    if (pendingAnalysis.jobId) {
      try {
        await completeJobWithAnalysis(pendingAnalysis.jobId, result.analysis);
      } catch (error) {
        console.warn('Failed to complete job:', error);
      }
    }

    // Durumu güncelle
    await updateAnalysisStatus('completed');

    // Başarılı bildirim gönder
    const avgScore = calculateAverageScore(result.analysis);
    await sendLocalizedAnalysisNotification(avgScore, pendingAnalysis.language, false);

    // Bekleyen analizi temizle
    await clearPendingAnalysis();

    console.log('🎉 Background analysis task completed successfully');
    return BackgroundFetch.BackgroundFetchResult.NewData;

  } catch (error) {
    console.error('❌ Background analysis task error:', error);

    await updateAnalysisStatus('failed');

    // Hata bildirimi gönder
    const pendingAnalysis = await getPendingAnalysis();
    if (pendingAnalysis) {
      await sendLocalizedAnalysisNotification(0, pendingAnalysis.language, true);
    }

    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Arka plan görevini kaydet
export async function registerBackgroundAnalysisTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ANALYSIS_TASK);

    if (isRegistered) {
      console.log('✅ Background analysis task already registered');
      return;
    }

    // Arka plan fetch'i yapılandır
    await BackgroundFetch.registerTaskAsync(BACKGROUND_ANALYSIS_TASK, {
      minimumInterval: 15 * 60, // 15 dakika (minimum iOS değeri)
      stopOnTerminate: false, // Uygulama kapatıldığında durdurma
      startOnBoot: true, // Telefon yeniden başladığında başlat
    });

    console.log('✅ Background analysis task registered successfully');
  } catch (error) {
    console.error('Failed to register background analysis task:', error);
    throw error;
  }
}

// Arka plan görevini kaldır
export async function unregisterBackgroundAnalysisTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ANALYSIS_TASK);

    if (!isRegistered) {
      console.log('Background analysis task not registered');
      return;
    }

    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_ANALYSIS_TASK);
    console.log('✅ Background analysis task unregistered');
  } catch (error) {
    console.error('Failed to unregister background analysis task:', error);
    throw error;
  }
}

// Arka plan görev durumunu kontrol et
export async function getBackgroundTaskStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
  try {
    return await BackgroundFetch.getStatusAsync();
  } catch (error) {
    console.error('Failed to get background task status:', error);
    return null;
  }
}

// Manuel olarak arka plan görevini tetikle (test için)
export async function triggerBackgroundAnalysis(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ANALYSIS_TASK);

    if (!isRegistered) {
      throw new Error('Background task is not registered');
    }

    // BackgroundFetch'i manuel olarak tetikle
    console.log('🔄 Manually triggering background analysis...');

    // Not: Bu sadece test amacıyla kullanılmalı
    // Gerçek uygulamada sistem otomatik olarak tetikler

  } catch (error) {
    console.error('Failed to trigger background analysis:', error);
    throw error;
  }
}
