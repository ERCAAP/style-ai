import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from './config';
import * as FileSystem from 'expo-file-system';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
}

export interface UploadResult {
  downloadURL: string;
  path: string;
  size: number;
}

// Local dosyayı blob'a çevir
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
}

// Görsel yükle
export async function uploadImage(
  uri: string,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Blob oluştur
    const blob = await uriToBlob(uri);

    // Storage referansı
    const storageRef = ref(storage, path);

    // Yükleme task'ı
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

          onProgress?.({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: Math.round(progress),
          });
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Yükleme tamamlandı
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          resolve({
            downloadURL,
            path,
            size: uploadTask.snapshot.totalBytes,
          });
        }
      );
    });
  } catch (error) {
    console.error('Upload image error:', error);
    throw error;
  }
}

// Kullanıcı görseli yükle
export async function uploadUserImage(
  userId: string,
  uri: string,
  jobId: string,
  type: 'input' | 'output',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const timestamp = Date.now();
  const extension = uri.split('.').pop() || 'jpg';
  const path = `users/${userId}/${type}s/${jobId}_${timestamp}.${extension}`;

  return uploadImage(uri, path, onProgress);
}

// Dosya sil
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
}

// Download URL al
export async function getFileDownloadURL(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Get download URL error:', error);
    throw error;
  }
}

// Storage path oluştur
export function createStoragePath(
  userId: string,
  folder: 'inputs' | 'outputs',
  filename: string
): string {
  return `users/${userId}/${folder}/${filename}`;
}
