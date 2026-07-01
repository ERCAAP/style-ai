// Firestore Jobs Service
// Analiz islerinin takibi ve yonetimi

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  DocumentData,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { OutfitAnalysis } from '../openai/outfitAnalysis';

// Job durumlari
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Job tipi
export type JobType = 'outfit_analysis' | 'dress_change';

// Job tipi
export interface Job {
  id: string;
  userId: string;
  type: JobType;
  status: JobStatus;

  // Girdi bilgileri
  input: {
    imageUrl: string;
    imagePath: string;
    templateId?: string;
  };

  // Cikti bilgileri (tamamlandiginda)
  output?: {
    analysis?: OutfitAnalysis;
    resultImageUrl?: string;
    resultImagePath?: string;
  };

  // Hata bilgisi
  error?: {
    code: string;
    message: string;
  };

  // Zamanlar
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Meta
  processingTime?: number; // milisaniye
  deviceId?: string;
}

// Firestore dokuman -> Job
function docToJob(docId: string, data: DocumentData): Job {
  return {
    id: docId,
    userId: data.userId || '',
    type: data.type || 'outfit_analysis',
    status: data.status || 'pending',
    input: {
      imageUrl: data.input?.imageUrl || '',
      imagePath: data.input?.imagePath || '',
      templateId: data.input?.templateId,
    },
    output: data.output
      ? {
          analysis: data.output.analysis,
          resultImageUrl: data.output.resultImageUrl,
          resultImagePath: data.output.resultImagePath,
        }
      : undefined,
    error: data.error
      ? {
          code: data.error.code,
          message: data.error.message,
        }
      : undefined,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    startedAt: data.startedAt?.toDate(),
    completedAt: data.completedAt?.toDate(),
    processingTime: data.processingTime,
    deviceId: data.deviceId,
  };
}

// Benzersiz job ID olustur
function generateJobId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `job_${timestamp}_${randomPart}`;
}

// Yeni job olustur
export async function createJob(
  userId: string,
  type: JobType,
  imageUrl: string,
  imagePath: string,
  templateId?: string,
  deviceId?: string
): Promise<Job> {
  try {
    const jobId = generateJobId();
    const jobRef = doc(db, 'jobs', jobId);

    const jobData: Record<string, any> = {
      userId,
      type,
      status: 'pending' as JobStatus,
      input: {
        imageUrl,
        imagePath,
        ...(templateId !== undefined && { templateId }),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (deviceId !== undefined) {
      jobData.deviceId = deviceId;
    }

    await setDoc(jobRef, jobData);

    // Kullanici istatistiklerini guncelle
    await updateUserJobStats(userId);

    return {
      id: jobId,
      userId,
      type,
      status: 'pending',
      input: {
        imageUrl,
        imagePath,
        templateId,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceId,
    };
  } catch (error) {
    console.error('Create job error:', error);
    throw error;
  }
}

// Job durumunu guncelle
export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  output?: Job['output'],
  error?: Job['error']
): Promise<void> {
  try {
    const jobRef = doc(db, 'jobs', jobId);

    const updateData: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'processing') {
      updateData.startedAt = serverTimestamp();
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = serverTimestamp();
    }

    if (output) {
      updateData.output = output;
    }

    if (error) {
      updateData.error = error;
    }

    await updateDoc(jobRef, updateData);
  } catch (error) {
    console.error('Update job status error:', error);
    throw error;
  }
}

// Job tamamla (analiz sonucu ile)
export async function completeJobWithAnalysis(
  jobId: string,
  analysis: OutfitAnalysis
): Promise<void> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);

    if (!jobSnap.exists()) {
      throw new Error('Job bulunamadi');
    }

    const jobData = jobSnap.data();
    const startedAt = jobData.startedAt?.toDate();
    const processingTime = startedAt ? Date.now() - startedAt.getTime() : undefined;

    await updateDoc(jobRef, {
      status: 'completed',
      'output.analysis': analysis,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      processingTime,
    });
  } catch (error) {
    console.error('Complete job with analysis error:', error);
    throw error;
  }
}

// Job'u hata ile bitir
export async function failJob(jobId: string, code: string, message: string): Promise<void> {
  await updateJobStatus(jobId, 'failed', undefined, { code, message });
}

// Job'u iptal et
export async function cancelJob(jobId: string): Promise<void> {
  await updateJobStatus(jobId, 'cancelled');
}

// Job getir (ID ile)
export async function getJobById(jobId: string): Promise<Job | null> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);

    if (!jobSnap.exists()) {
      return null;
    }

    return docToJob(jobSnap.id, jobSnap.data());
  } catch (error) {
    console.error('Get job by id error:', error);
    throw error;
  }
}

// Kullanicinin job'larini getir
export async function getUserJobs(
  userId: string,
  limitCount: number = 20,
  status?: JobStatus
): Promise<Job[]> {
  try {
    const jobsRef = collection(db, 'jobs');

    let q;
    if (status) {
      q = query(
        jobsRef,
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        jobsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => docToJob(doc.id, doc.data()));
  } catch (error) {
    console.error('Get user jobs error:', error);
    throw error;
  }
}

// Kullanicinin tamamlanmis analizlerini getir
export async function getUserAnalysisHistory(
  userId: string,
  limitCount: number = 20
): Promise<Job[]> {
  try {
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('userId', '==', userId),
      where('type', '==', 'outfit_analysis'),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => docToJob(doc.id, doc.data()));
  } catch (error) {
    console.error('Get user analysis history error:', error);
    throw error;
  }
}

// Kullanici istatistiklerini guncelle
async function updateUserJobStats(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return;
    }

    const userData = userSnap.data();
    const today = new Date().toDateString();
    const lastJobDate = userData.usage?.lastJobDate?.toDate()?.toDateString();

    // Ayni gun mu kontrol et
    if (lastJobDate === today) {
      // Ayni gun - sadece jobsToday artir
      await updateDoc(userRef, {
        'usage.totalJobs': increment(1),
        'usage.jobsToday': increment(1),
        'usage.lastJobDate': serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Farkli gun - jobsToday sifirla ve 1 yap
      await updateDoc(userRef, {
        'usage.totalJobs': increment(1),
        'usage.jobsToday': 1,
        'usage.lastJobDate': serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Update user job stats error:', error);
    // Stats guncellenemezse job olusturmaya devam et
  }
}

// Kullanicinin gunluk limit kontrolu
export async function checkDailyLimit(userId: string): Promise<{
  canCreate: boolean;
  jobsToday: number;
  dailyLimit: number;
  remaining: number;
}> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        canCreate: true,
        jobsToday: 0,
        dailyLimit: 3,
        remaining: 3,
      };
    }

    const userData = userSnap.data();
    const usage = userData.usage || {};
    const subscription = userData.subscription || {};

    // Premium kullanicilar icin sinirsiz
    if (subscription.status === 'active') {
      return {
        canCreate: true,
        jobsToday: usage.jobsToday || 0,
        dailyLimit: -1, // -1 = sinirsiz
        remaining: -1,
      };
    }

    const dailyLimit = usage.dailyLimit || 3;
    const today = new Date().toDateString();
    const lastJobDate = usage.lastJobDate?.toDate()?.toDateString();

    // Farkli gun ise jobsToday sifir
    const jobsToday = lastJobDate === today ? (usage.jobsToday || 0) : 0;
    const remaining = Math.max(0, dailyLimit - jobsToday);

    return {
      canCreate: remaining > 0,
      jobsToday,
      dailyLimit,
      remaining,
    };
  } catch (error) {
    console.error('Check daily limit error:', error);
    // Hata durumunda izin ver
    return {
      canCreate: true,
      jobsToday: 0,
      dailyLimit: 3,
      remaining: 3,
    };
  }
}
