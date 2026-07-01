// useTemplates Hook
// Template'leri yonetmek icin

import { useState, useEffect, useCallback } from 'react';
import {
  Template,
  TemplateCategory,
  getAllTemplates,
  getFeaturedTemplates,
  getTemplatesByCategory,
  getTemplateById,
} from '@/services/firebase/templates';

interface UseTemplatesReturn {
  // Veriler
  templates: Template[];
  featuredTemplates: Template[];

  // Durumlar
  isLoading: boolean;
  error: string | null;

  // Aksiyonlar
  refreshTemplates: () => Promise<void>;
  getByCategory: (category: TemplateCategory) => Promise<Template[]>;
  getById: (id: string) => Promise<Template | null>;

  // Yardimci
  getFreeOnly: () => Template[];
  getPremiumOnly: () => Template[];
}

interface UseTemplatesOptions {
  autoFetch?: boolean;
}

export function useTemplates(options: UseTemplatesOptions = {}): UseTemplatesReturn {
  const { autoFetch = true } = options;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Template'leri yukle
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [allTemplates, featured] = await Promise.all([
        getAllTemplates(),
        getFeaturedTemplates(6),
      ]);

      setTemplates(allTemplates);
      setFeaturedTemplates(featured);
    } catch (err) {
      console.error('Fetch templates error:', err);
      setError('Template\'ler yuklenirken hata olustu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Kategoriye gore getir
  const getByCategory = useCallback(async (category: TemplateCategory): Promise<Template[]> => {
    try {
      return await getTemplatesByCategory(category);
    } catch (err) {
      console.error('Get by category error:', err);
      return [];
    }
  }, []);

  // ID ile getir
  const getById = useCallback(async (id: string): Promise<Template | null> => {
    try {
      return await getTemplateById(id);
    } catch (err) {
      console.error('Get by id error:', err);
      return null;
    }
  }, []);

  // Ucretsiz olanlari filtrele
  const getFreeOnly = useCallback((): Template[] => {
    return templates.filter(t => !t.isPremium);
  }, [templates]);

  // Premium olanlari filtrele
  const getPremiumOnly = useCallback((): Template[] => {
    return templates.filter(t => t.isPremium);
  }, [templates]);

  // Ilk yukleme
  useEffect(() => {
    if (autoFetch) {
      fetchTemplates();
    }
  }, [autoFetch, fetchTemplates]);

  return {
    templates,
    featuredTemplates,
    isLoading,
    error,
    refreshTemplates: fetchTemplates,
    getByCategory,
    getById,
    getFreeOnly,
    getPremiumOnly,
  };
}
