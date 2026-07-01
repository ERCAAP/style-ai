// Saved User Photos Storage Service
// Kullanicinin kaydettigi fotograflari cihazda saklamak icin

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key
const STORAGE_KEY = '@saved_user_photos';

// Kayitli fotograf tipi
export interface SavedPhoto {
  id: string;
  uri: string; // Local URI
  createdAt: number;
  width: number;
  height: number;
  fileSize: number;
}

// Max kayit sayisi
const MAX_SAVED_PHOTOS = 20;

// Unique ID olustur
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Tum kayitli fotograflari getir
export async function getSavedPhotos(): Promise<SavedPhoto[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Get saved photos error:', error);
    return [];
  }
}

// Yeni fotograf kaydet
export async function savePhoto(
  uri: string,
  width: number,
  height: number,
  fileSize: number
): Promise<SavedPhoto> {
  try {
    const savedPhotos = await getSavedPhotos();

    const newPhoto: SavedPhoto = {
      id: generateId(),
      uri,
      createdAt: Date.now(),
      width,
      height,
      fileSize,
    };

    // Yeni kaydi basa ekle
    const updatedPhotos = [newPhoto, ...savedPhotos];

    // Limit kontrolu - eski fotograflari sil
    if (updatedPhotos.length > MAX_SAVED_PHOTOS) {
      updatedPhotos.splice(MAX_SAVED_PHOTOS);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));

    return newPhoto;
  } catch (error) {
    console.error('Save photo error:', error);
    throw new Error('Fotograf kaydedilemedi');
  }
}

// ID ile fotograf getir
export async function getPhotoById(id: string): Promise<SavedPhoto | null> {
  try {
    const photos = await getSavedPhotos();
    return photos.find(item => item.id === id) || null;
  } catch (error) {
    console.error('Get photo by id error:', error);
    return null;
  }
}

// Fotograf sil
export async function deletePhoto(id: string): Promise<boolean> {
  try {
    const photos = await getSavedPhotos();
    const filteredPhotos = photos.filter(item => item.id !== id);

    if (filteredPhotos.length === photos.length) {
      return false; // Silinecek fotograf bulunamadi
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPhotos));

    return true;
  } catch (error) {
    console.error('Delete photo error:', error);
    return false;
  }
}

// Tum fotograflari temizle
export async function clearAllSavedPhotos(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Clear saved photos error:', error);
    throw new Error('Fotograflar temizlenemedi');
  }
}

// Toplam fotograf sayisi
export async function getSavedPhotosCount(): Promise<number> {
  const photos = await getSavedPhotos();
  return photos.length;
}

// URI'nin zaten kaydedilip kaydedilmedigini kontrol et
export async function isPhotoSaved(uri: string): Promise<boolean> {
  try {
    const photos = await getSavedPhotos();
    return photos.some(photo => photo.uri === uri);
  } catch (error) {
    console.error('Check photo saved error:', error);
    return false;
  }
}
