// useWardrobe Hook - Dolap yonetimi

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getWardrobeItems,
  getWardrobeItem,
  addWardrobeItem,
  updateWardrobeItem,
  deleteWardrobeItem,
  toggleFavorite,
  recordWear,
  getWardrobeStats,
} from '@/services/localStorage';
import {
  WardrobeItem,
  WardrobeFilters,
  WardrobeStats,
  CreateWardrobeItemInput,
  UpdateWardrobeItemInput,
  ClothingCategory,
} from '@/types/wardrobe';

interface UseWardrobeReturn {
  // Data
  items: WardrobeItem[];
  filteredItems: WardrobeItem[];
  stats: WardrobeStats | null;

  // State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Filters
  filters: WardrobeFilters;
  setFilters: (filters: WardrobeFilters) => void;
  setCategory: (category: ClothingCategory | null) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Actions
  addItem: (
    imageUri: string,
    itemData: CreateWardrobeItemInput,
    onProgress?: (progress: number) => void
  ) => Promise<WardrobeItem>;
  updateItem: (itemId: string, updates: UpdateWardrobeItemInput) => Promise<void>;
  deleteItem: (itemId: string, imagePath: string) => Promise<void>;
  toggleItemFavorite: (itemId: string, isFavorite: boolean) => Promise<void>;
  recordItemWear: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
  getItem: (itemId: string) => Promise<WardrobeItem | null>;
}

export function useWardrobe(): UseWardrobeReturn {
  // State
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [stats, setStats] = useState<WardrobeStats | null>(null);
  const [filters, setFilters] = useState<WardrobeFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch items
  const fetchItems = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const [fetchedItems, fetchedStats] = await Promise.all([
        getWardrobeItems(filters),
        getWardrobeStats(),
      ]);

      setItems(fetchedItems);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Fetch wardrobe error:', err);
      setError('Kiyafetler yuklenemedi');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filtered items (client-side search)
  const filteredItems = useMemo(() => {
    if (!filters.searchQuery) {
      return items;
    }

    const searchLower = filters.searchQuery.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      item.brand?.toLowerCase().includes(searchLower) ||
      item.color.toLowerCase().includes(searchLower)
    );
  }, [items, filters.searchQuery]);

  // Set category filter
  const setCategory = useCallback((category: ClothingCategory | null) => {
    setFilters(prev => ({
      ...prev,
      category: category || undefined,
    }));
  }, []);

  // Set search query
  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: query || undefined,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Add item
  const addItem = useCallback(async (
    imageUri: string,
    itemData: CreateWardrobeItemInput,
    onProgress?: (progress: number) => void
  ): Promise<WardrobeItem> => {
    const newItem = await addWardrobeItem(imageUri, itemData, onProgress);

    // Optimistic update
    setItems(prev => [newItem, ...prev]);
    setStats(prev => prev ? {
      ...prev,
      total: prev.total + 1,
      byCategory: {
        ...prev.byCategory,
        [newItem.category]: (prev.byCategory[newItem.category] || 0) + 1,
      },
    } : null);

    return newItem;
  }, []);

  // Update item
  const updateItem = useCallback(async (
    itemId: string,
    updates: UpdateWardrobeItemInput
  ): Promise<void> => {
    await updateWardrobeItem(itemId, updates);

    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, ...updates, updatedAt: new Date() }
        : item
    ));
  }, []);

  // Delete item
  const deleteItem = useCallback(async (
    itemId: string,
    imagePath: string
  ): Promise<void> => {
    const itemToDelete = items.find(item => item.id === itemId);
    await deleteWardrobeItem(itemId, imagePath);

    // Optimistic update
    setItems(prev => prev.filter(item => item.id !== itemId));
    if (itemToDelete && stats) {
      setStats({
        ...stats,
        total: stats.total - 1,
        byCategory: {
          ...stats.byCategory,
          [itemToDelete.category]: Math.max(0, (stats.byCategory[itemToDelete.category] || 0) - 1),
        },
        favorites: itemToDelete.isFavorite ? stats.favorites - 1 : stats.favorites,
      });
    }
  }, [items, stats]);

  // Toggle favorite
  const toggleItemFavorite = useCallback(async (
    itemId: string,
    isFavorite: boolean
  ): Promise<void> => {
    await toggleFavorite(itemId, isFavorite);

    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, isFavorite, updatedAt: new Date() }
        : item
    ));
    if (stats) {
      setStats({
        ...stats,
        favorites: isFavorite ? stats.favorites + 1 : stats.favorites - 1,
      });
    }
  }, [stats]);

  // Record wear
  const recordItemWear = useCallback(async (itemId: string): Promise<void> => {
    await recordWear(itemId);

    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? {
            ...item,
            wearCount: (item.wearCount || 0) + 1,
            lastWornAt: new Date(),
            updatedAt: new Date(),
          }
        : item
    ));
  }, []);

  // Refresh
  const refresh = useCallback(async (): Promise<void> => {
    await fetchItems(false);
  }, [fetchItems]);

  // Get single item
  const getItem = useCallback(async (itemId: string): Promise<WardrobeItem | null> => {
    // First check local cache
    const cachedItem = items.find(item => item.id === itemId);
    if (cachedItem) {
      return cachedItem;
    }

    // Fetch from storage
    return getWardrobeItem(itemId);
  }, [items]);

  return {
    items,
    filteredItems,
    stats,
    isLoading,
    isRefreshing,
    error,
    filters,
    setFilters,
    setCategory,
    setSearchQuery,
    clearFilters,
    addItem,
    updateItem,
    deleteItem,
    toggleItemFavorite,
    recordItemWear,
    refresh,
    getItem,
  };
}

export default useWardrobe;
