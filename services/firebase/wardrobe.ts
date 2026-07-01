// Firebase Wardrobe Service - Dolap islemleri

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './config';
import { uploadImage } from './storage';
import {
  WardrobeItem,
  ClothingCategory,
  Season,
  WardrobeFilters,
  WardrobeStats,
  CreateWardrobeItemInput,
  UpdateWardrobeItemInput,
} from '@/types/wardrobe';

const COLLECTION_NAME = 'wardrobe';

// Firestore dokumani WardrobeItem'a donustur
function docToWardrobeItem(id: string, data: DocumentData): WardrobeItem {
  return {
    id,
    userId: data.userId,
    name: data.name,
    category: data.category,
    subcategory: data.subcategory,
    season: data.season || [],
    color: data.color,
    colorHex: data.colorHex,
    brand: data.brand,
    imageUrl: data.imageUrl,
    imagePath: data.imagePath,
    thumbnailUrl: data.thumbnailUrl,
    tags: data.tags || [],
    isFavorite: data.isFavorite || false,
    wearCount: data.wearCount || 0,
    lastWornAt: data.lastWornAt?.toDate(),
    purchaseDate: data.purchaseDate?.toDate(),
    notes: data.notes,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

// Kullanicinin wardrobe collection referansi
function getWardrobeCollection(userId: string) {
  return collection(db, 'users', userId, COLLECTION_NAME);
}

// Tum kiyafetleri getir
export async function getWardrobeItems(
  userId: string,
  filters?: WardrobeFilters
): Promise<WardrobeItem[]> {
  try {
    const wardrobeRef = getWardrobeCollection(userId);
    let q = query(wardrobeRef, orderBy('createdAt', 'desc'));

    // Kategori filtresi
    if (filters?.category) {
      q = query(wardrobeRef, where('category', '==', filters.category), orderBy('createdAt', 'desc'));
    }

    // Mevsim filtresi
    if (filters?.season) {
      q = query(wardrobeRef, where('season', 'array-contains', filters.season), orderBy('createdAt', 'desc'));
    }

    // Favori filtresi
    if (filters?.isFavorite) {
      q = query(wardrobeRef, where('isFavorite', '==', true), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(doc => docToWardrobeItem(doc.id, doc.data()));

    // Client-side arama filtresi
    if (filters?.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        item.brand?.toLowerCase().includes(searchLower)
      );
    }

    return items;
  } catch (error) {
    console.error('Get wardrobe items error:', error);
    throw error;
  }
}

// Tek kiyafet getir
export async function getWardrobeItem(
  userId: string,
  itemId: string
): Promise<WardrobeItem | null> {
  try {
    const itemRef = doc(db, 'users', userId, COLLECTION_NAME, itemId);
    const snapshot = await getDoc(itemRef);

    if (!snapshot.exists()) {
      return null;
    }

    return docToWardrobeItem(snapshot.id, snapshot.data());
  } catch (error) {
    console.error('Get wardrobe item error:', error);
    throw error;
  }
}

// Kiyafet ekle
export async function addWardrobeItem(
  userId: string,
  imageUri: string,
  itemData: CreateWardrobeItemInput,
  onProgress?: (progress: number) => void
): Promise<WardrobeItem> {
  try {
    // Gorsel yukle
    const timestamp = Date.now();
    const path = `users/${userId}/wardrobe/${timestamp}.jpg`;

    onProgress?.(10);

    const uploadResult = await uploadImage(imageUri, path, (p) => {
      // Upload progress: 10-70
      onProgress?.(10 + (p.progress * 0.6));
    });

    onProgress?.(75);

    // Firestore'a kaydet
    const wardrobeRef = getWardrobeCollection(userId);
    const newDocRef = doc(wardrobeRef);

    const firestoreData = {
      ...itemData,
      userId,
      imageUrl: uploadResult.downloadURL,
      imagePath: path,
      wearCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newDocRef, firestoreData);

    onProgress?.(100);

    return {
      ...itemData,
      id: newDocRef.id,
      userId,
      imageUrl: uploadResult.downloadURL,
      imagePath: path,
      wearCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Add wardrobe item error:', error);
    throw error;
  }
}

// Kiyafet guncelle
export async function updateWardrobeItem(
  userId: string,
  itemId: string,
  updates: UpdateWardrobeItemInput
): Promise<void> {
  try {
    const itemRef = doc(db, 'users', userId, COLLECTION_NAME, itemId);
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Update wardrobe item error:', error);
    throw error;
  }
}

// Kiyafet sil
export async function deleteWardrobeItem(
  userId: string,
  itemId: string,
  imagePath: string
): Promise<void> {
  try {
    // Storage'dan gorseli sil
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (storageError) {
      console.warn('Storage delete error (may not exist):', storageError);
    }

    // Firestore'dan dokumani sil
    const itemRef = doc(db, 'users', userId, COLLECTION_NAME, itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error('Delete wardrobe item error:', error);
    throw error;
  }
}

// Favori durumunu degistir
export async function toggleFavorite(
  userId: string,
  itemId: string,
  isFavorite: boolean
): Promise<void> {
  await updateWardrobeItem(userId, itemId, { isFavorite });
}

// Giyilme sayisini artir
export async function recordWear(
  userId: string,
  itemId: string
): Promise<void> {
  try {
    const item = await getWardrobeItem(userId, itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    await updateWardrobeItem(userId, itemId, {
      wearCount: (item.wearCount || 0) + 1,
      lastWornAt: new Date(),
    });
  } catch (error) {
    console.error('Record wear error:', error);
    throw error;
  }
}

// Dolap istatistikleri
export async function getWardrobeStats(userId: string): Promise<WardrobeStats> {
  try {
    const items = await getWardrobeItems(userId);

    const stats: WardrobeStats = {
      total: items.length,
      byCategory: {
        tops: 0,
        bottoms: 0,
        shoes: 0,
        accessories: 0,
        outerwear: 0,
        dresses: 0,
      },
      bySeason: {
        spring: 0,
        summer: 0,
        fall: 0,
        winter: 0,
      },
      favorites: 0,
    };

    items.forEach(item => {
      // Kategori sayimi
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;

      // Mevsim sayimi
      item.season.forEach(s => {
        stats.bySeason[s] = (stats.bySeason[s] || 0) + 1;
      });

      // Favori sayimi
      if (item.isFavorite) {
        stats.favorites++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Get wardrobe stats error:', error);
    throw error;
  }
}

// Kategori bazli kiyafetleri getir
export async function getItemsByCategory(
  userId: string,
  category: ClothingCategory
): Promise<WardrobeItem[]> {
  return getWardrobeItems(userId, { category });
}

// Mevsim bazli kiyafetleri getir
export async function getItemsBySeason(
  userId: string,
  season: Season
): Promise<WardrobeItem[]> {
  return getWardrobeItems(userId, { season });
}

// Favorileri getir
export async function getFavoriteItems(userId: string): Promise<WardrobeItem[]> {
  return getWardrobeItems(userId, { isFavorite: true });
}
