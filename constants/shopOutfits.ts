// Shop Outfits - Mağaza kombinleri
// Kullanıcıların deneyebileceği hazır kombin görselleri

import { ImageSourcePropType } from 'react-native';

export interface ShopOutfit {
  id: string;
  name: string;
  style: string;
  flatLayImage: ImageSourcePropType;  // Flat lay görsel (düz yerde kıyafetler)
  modelImage: ImageSourcePropType;    // Modele giydirilmiş hali
  category: 'casual' | 'formal' | 'sporty' | 'elegant';
  season?: 'spring' | 'summer' | 'fall' | 'winter';
}

// Mağaza kombinleri - Local Assets
// 3 farklı ürün, her biri kendi modeline evolve olur
export const SHOP_OUTFITS: ShopOutfit[] = [
  {
    id: 'outfit-a',
    name: 'Casual Beige',
    style: 'Günlük Rahat',
    flatLayImage: require('@/assets/images/Onboarding-Assets/Clothes/a.webp'),
    modelImage: require('@/assets/images/Onboarding-Assets/Model/a.webp'),
    category: 'casual',
    season: 'spring',
  },
  {
    id: 'outfit-b',
    name: 'Classic White',
    style: 'Klasik Şık',
    flatLayImage: require('@/assets/images/Onboarding-Assets/Clothes/b.webp'),
    modelImage: require('@/assets/images/Onboarding-Assets/Model/b.webp'),
    category: 'elegant',
    season: 'summer',
  },
  {
    id: 'outfit-c',
    name: 'Summer Light',
    style: 'Yaz Kombini',
    flatLayImage: require('@/assets/images/Onboarding-Assets/Clothes/c.webp'),
    modelImage: require('@/assets/images/Onboarding-Assets/Model/c.webp'),
    category: 'casual',
    season: 'summer',
  },
];

// Kategoriye göre filtrele
export const getOutfitsByCategory = (category: string) => {
  return SHOP_OUTFITS.filter(outfit => outfit.category === category);
};

// Mevsime göre filtrele
export const getOutfitsBySeason = (season: string) => {
  return SHOP_OUTFITS.filter(outfit => outfit.season === season);
};
