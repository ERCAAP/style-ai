// Wardrobe Local Storage Service
// Manages wardrobe items using AsyncStorage and local file system

import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheDirectory, copyAsync, deleteAsync, getInfoAsync } from 'expo-file-system/legacy';
import {
  WardrobeItem,
  ClothingCategory,
  Season,
  WardrobeFilters,
  WardrobeStats,
  CreateWardrobeItemInput,
  UpdateWardrobeItemInput,
} from '@/types/wardrobe';

// Storage configuration
const STORAGE_KEY = '@wardrobe_items';
const MAX_WARDROBE_ITEMS = 200;

// Promise lock for preventing concurrent modifications
let storageLock = Promise.resolve();

// Helper: Generate unique ID
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Execute with lock to prevent race conditions
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const release = storageLock;
  let releaseLock: () => void;
  storageLock = new Promise(resolve => {
    releaseLock = resolve;
  });

  await release;
  try {
    return await fn();
  } finally {
    releaseLock!();
  }
}

// Helper: Serialize item for storage (convert Dates to ISO strings)
function serializeItem(item: WardrobeItem): any {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    lastWornAt: item.lastWornAt?.toISOString(),
    purchaseDate: item.purchaseDate?.toISOString(),
  };
}

// Helper: Deserialize item from storage (convert ISO strings to Dates)
function deserializeItem(data: any): WardrobeItem {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    lastWornAt: data.lastWornAt ? new Date(data.lastWornAt) : undefined,
    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
  };
}

// Helper: Load items from AsyncStorage
async function loadFromStorage(): Promise<WardrobeItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    return parsed.map(deserializeItem);
  } catch (error) {
    console.error('Load wardrobe items error:', error);
    return [];
  }
}

// Helper: Save items to AsyncStorage
async function saveToStorage(items: WardrobeItem[]): Promise<void> {
  try {
    const serialized = items.map(serializeItem);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error('Save wardrobe items error:', error);
    throw new Error('Could not save wardrobe items');
  }
}

// Helper: Apply filters to items (client-side)
function applyFilters(items: WardrobeItem[], filters?: WardrobeFilters): WardrobeItem[] {
  let filtered = [...items];

  // Category filter
  if (filters?.category) {
    filtered = filtered.filter(item => item.category === filters.category);
  }

  // Season filter
  if (filters?.season) {
    filtered = filtered.filter(item => item.season.includes(filters.season!));
  }

  // Favorite filter
  if (filters?.isFavorite) {
    filtered = filtered.filter(item => item.isFavorite);
  }

  // Color filter
  if (filters?.color) {
    const colorLower = filters.color.toLowerCase();
    filtered = filtered.filter(item => item.color.toLowerCase().includes(colorLower));
  }

  // Search query filter
  if (filters?.searchQuery) {
    const searchLower = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      item.brand?.toLowerCase().includes(searchLower) ||
      item.color.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

// Get all wardrobe items with optional filters
export async function getWardrobeItems(
  filters?: WardrobeFilters
): Promise<WardrobeItem[]> {
  try {
    const items = await loadFromStorage();

    // Validate image URIs (check if files still exist)
    const validatedItems: WardrobeItem[] = [];
    for (const item of items) {
      try {
        const fileInfo = await getInfoAsync(item.imageUrl);
        if (fileInfo.exists) {
          validatedItems.push(item);
        } else {
          console.warn(`Image missing for item ${item.id}: ${item.name}`);
        }
      } catch (error) {
        console.warn(`Error checking image for item ${item.id}:`, error);
      }
    }

    // Apply filters
    return applyFilters(validatedItems, filters);
  } catch (error) {
    console.error('Get wardrobe items error:', error);
    return [];
  }
}

// Get single wardrobe item by ID
export async function getWardrobeItem(
  itemId: string
): Promise<WardrobeItem | null> {
  try {
    const items = await loadFromStorage();
    return items.find(item => item.id === itemId) || null;
  } catch (error) {
    console.error('Get wardrobe item error:', error);
    return null;
  }
}

// Add new wardrobe item
export async function addWardrobeItem(
  imageUri: string,
  itemData: CreateWardrobeItemInput,
  onProgress?: (progress: number) => void
): Promise<WardrobeItem> {
  return withLock(async () => {
    try {
      onProgress?.(10);

      // Load current items
      const items = await loadFromStorage();

      // Check limit
      if (items.length >= MAX_WARDROBE_ITEMS) {
        throw new Error(`Wardrobe limit reached (${MAX_WARDROBE_ITEMS} items). Please delete some items.`);
      }

      // Generate unique filename
      const filename = `wardrobe_${generateId()}.jpg`;
      const permanentUri = `${cacheDirectory}${filename}`;

      onProgress?.(30);

      // Copy image to permanent location
      await copyAsync({
        from: imageUri,
        to: permanentUri,
      });

      onProgress?.(70);

      // Create new item
      const newItem: WardrobeItem = {
        ...itemData,
        id: generateId(),
        userId: 'local', // Local storage doesn't need real userId
        imageUrl: permanentUri,
        imagePath: filename,
        wearCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to beginning (newest first)
      items.unshift(newItem);

      // Save to storage
      await saveToStorage(items);

      onProgress?.(100);

      return newItem;
    } catch (error) {
      console.error('Add wardrobe item error:', error);
      throw error;
    }
  });
}

// Update wardrobe item
export async function updateWardrobeItem(
  itemId: string,
  updates: UpdateWardrobeItemInput
): Promise<void> {
  return withLock(async () => {
    try {
      const items = await loadFromStorage();
      const index = items.findIndex(item => item.id === itemId);

      if (index === -1) {
        throw new Error(`Item not found: ${itemId}`);
      }

      // Update item
      items[index] = {
        ...items[index],
        ...updates,
        updatedAt: new Date(),
      };

      await saveToStorage(items);
    } catch (error) {
      console.error('Update wardrobe item error:', error);
      throw error;
    }
  });
}

// Delete wardrobe item
export async function deleteWardrobeItem(
  itemId: string,
  imagePath: string
): Promise<void> {
  return withLock(async () => {
    try {
      // Delete image file
      try {
        const imageUri = `${cacheDirectory}${imagePath}`;
        const fileInfo = await getInfoAsync(imageUri);
        if (fileInfo.exists) {
          await deleteAsync(imageUri, { idempotent: true });
        }
      } catch (storageError) {
        console.warn('Image delete error (may not exist):', storageError);
      }

      // Remove from storage
      const items = await loadFromStorage();
      const filtered = items.filter(item => item.id !== itemId);

      if (filtered.length === items.length) {
        console.warn(`Item not found for deletion: ${itemId}`);
        return;
      }

      await saveToStorage(filtered);
    } catch (error) {
      console.error('Delete wardrobe item error:', error);
      throw error;
    }
  });
}

// Toggle favorite status
export async function toggleFavorite(
  itemId: string,
  isFavorite: boolean
): Promise<void> {
  await updateWardrobeItem(itemId, { isFavorite });
}

// Record wear (increment count and update last worn date)
export async function recordWear(itemId: string): Promise<void> {
  return withLock(async () => {
    try {
      const items = await loadFromStorage();
      const index = items.findIndex(item => item.id === itemId);

      if (index === -1) {
        throw new Error(`Item not found: ${itemId}`);
      }

      items[index] = {
        ...items[index],
        wearCount: (items[index].wearCount || 0) + 1,
        lastWornAt: new Date(),
        updatedAt: new Date(),
      };

      await saveToStorage(items);
    } catch (error) {
      console.error('Record wear error:', error);
      throw error;
    }
  });
}

// Get wardrobe statistics
export async function getWardrobeStats(): Promise<WardrobeStats> {
  try {
    const items = await getWardrobeItems();

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
      // Category count
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;

      // Season count
      item.season.forEach(s => {
        stats.bySeason[s] = (stats.bySeason[s] || 0) + 1;
      });

      // Favorites count
      if (item.isFavorite) {
        stats.favorites++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Get wardrobe stats error:', error);
    return {
      total: 0,
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
  }
}

// Get items by category
export async function getItemsByCategory(
  category: ClothingCategory
): Promise<WardrobeItem[]> {
  return getWardrobeItems({ category });
}

// Get items by season
export async function getItemsBySeason(
  season: Season
): Promise<WardrobeItem[]> {
  return getWardrobeItems({ season });
}

// Get favorite items
export async function getFavoriteItems(): Promise<WardrobeItem[]> {
  return getWardrobeItems({ isFavorite: true });
}
