// Firestore Templates Service
// Template'leri Firebase'den ceker

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

// Template tipi
export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  thumbnailUrl: string;
  previewUrl?: string;
  isPremium: boolean;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  // AI prompt bilgisi (backend tarafinda kullanilacak)
  promptId?: string;
}

export type TemplateCategory =
  | 'casual'
  | 'formal'
  | 'party'
  | 'sporty'
  | 'elegant'
  | 'bohemian'
  | 'business'
  | 'summer'
  | 'winter'
  | 'other';

// Firestore dokuman -> Template
function docToTemplate(docId: string, data: DocumentData): Template {
  return {
    id: docId,
    name: data.name || '',
    description: data.description || '',
    category: data.category || 'other',
    tags: data.tags || [],
    thumbnailUrl: data.thumbnailUrl || '',
    previewUrl: data.previewUrl,
    isPremium: data.isPremium ?? false,
    isFeatured: data.isFeatured ?? false,
    isActive: data.isActive ?? true,
    order: data.order ?? 0,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    usageCount: data.usageCount ?? 0,
    promptId: data.promptId,
  };
}

// Tum aktif template'leri getir
export async function getAllTemplates(): Promise<Template[]> {
  try {
    const templatesRef = collection(db, 'templates');
    const q = query(
      templatesRef,
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => docToTemplate(doc.id, doc.data()));
  } catch (error) {
    console.error('Get all templates error:', error);
    throw error;
  }
}

// Featured (one cikan) template'leri getir
export async function getFeaturedTemplates(limitCount: number = 10): Promise<Template[]> {
  try {
    const templatesRef = collection(db, 'templates');
    const q = query(
      templatesRef,
      where('isActive', '==', true),
      where('isFeatured', '==', true),
      orderBy('order', 'asc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => docToTemplate(doc.id, doc.data()));
  } catch (error) {
    console.error('Get featured templates error:', error);
    throw error;
  }
}

// Kategoriye gore template'leri getir
export async function getTemplatesByCategory(
  category: TemplateCategory,
  limitCount: number = 20
): Promise<Template[]> {
  try {
    const templatesRef = collection(db, 'templates');
    const q = query(
      templatesRef,
      where('isActive', '==', true),
      where('category', '==', category),
      orderBy('order', 'asc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => docToTemplate(doc.id, doc.data()));
  } catch (error) {
    console.error('Get templates by category error:', error);
    throw error;
  }
}

// Ucretsiz template'leri getir
export async function getFreeTemplates(limitCount: number = 20): Promise<Template[]> {
  try {
    const templatesRef = collection(db, 'templates');
    const q = query(
      templatesRef,
      where('isActive', '==', true),
      where('isPremium', '==', false),
      orderBy('order', 'asc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => docToTemplate(doc.id, doc.data()));
  } catch (error) {
    console.error('Get free templates error:', error);
    throw error;
  }
}

// Premium template'leri getir
export async function getPremiumTemplates(limitCount: number = 20): Promise<Template[]> {
  try {
    const templatesRef = collection(db, 'templates');
    const q = query(
      templatesRef,
      where('isActive', '==', true),
      where('isPremium', '==', true),
      orderBy('order', 'asc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => docToTemplate(doc.id, doc.data()));
  } catch (error) {
    console.error('Get premium templates error:', error);
    throw error;
  }
}

// Tek template getir (ID ile)
export async function getTemplateById(templateId: string): Promise<Template | null> {
  try {
    const templateRef = doc(db, 'templates', templateId);
    const templateSnap = await getDoc(templateRef);

    if (!templateSnap.exists()) {
      return null;
    }

    return docToTemplate(templateSnap.id, templateSnap.data());
  } catch (error) {
    console.error('Get template by id error:', error);
    throw error;
  }
}

// Tag'e gore template ara
export async function searchTemplatesByTag(tag: string): Promise<Template[]> {
  try {
    const templatesRef = collection(db, 'templates');
    const q = query(
      templatesRef,
      where('isActive', '==', true),
      where('tags', 'array-contains', tag.toLowerCase()),
      orderBy('order', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => docToTemplate(doc.id, doc.data()));
  } catch (error) {
    console.error('Search templates by tag error:', error);
    throw error;
  }
}

// Populer template'leri getir (kullanim sayisina gore)
export async function getPopularTemplates(limitCount: number = 10): Promise<Template[]> {
  try {
    const templatesRef = collection(db, 'templates');
    const q = query(
      templatesRef,
      where('isActive', '==', true),
      orderBy('usageCount', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => docToTemplate(doc.id, doc.data()));
  } catch (error) {
    console.error('Get popular templates error:', error);
    throw error;
  }
}

// Kategori listesi
export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'casual', label: 'Gunluk' },
  { value: 'formal', label: 'Resmi' },
  { value: 'party', label: 'Parti' },
  { value: 'sporty', label: 'Sportif' },
  { value: 'elegant', label: 'Sik' },
  { value: 'bohemian', label: 'Bohem' },
  { value: 'business', label: 'Is' },
  { value: 'summer', label: 'Yaz' },
  { value: 'winter', label: 'Kis' },
  { value: 'other', label: 'Diger' },
];

