// Wardrobe Types - Dolap ile ilgili tipler

// Kiyafet kategorileri
export type ClothingCategory =
  | 'tops'        // Ust giyim
  | 'bottoms'     // Alt giyim
  | 'shoes'       // Ayakkabi
  | 'accessories' // Aksesuar
  | 'outerwear'   // Dis giyim
  | 'dresses';    // Elbise

// Mevsimler
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

// Alt kategoriler
export const SUBCATEGORIES: Record<ClothingCategory, string[]> = {
  tops: ['tshirt', 'shirt', 'blouse', 'sweater', 'hoodie', 'tank_top', 'polo'],
  bottoms: ['jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'sweatpants'],
  shoes: ['sneakers', 'boots', 'heels', 'sandals', 'loafers', 'flats', 'athletic'],
  accessories: ['bag', 'hat', 'scarf', 'belt', 'jewelry', 'watch', 'sunglasses'],
  outerwear: ['jacket', 'coat', 'blazer', 'cardigan', 'vest', 'parka'],
  dresses: ['casual_dress', 'formal_dress', 'maxi_dress', 'mini_dress', 'cocktail_dress'],
};

// Dolap ogesi
export interface WardrobeItem {
  id: string;
  userId: string;
  name: string;
  category: ClothingCategory;
  subcategory: string;
  season: Season[];
  color: string;
  colorHex: string;
  brand?: string;
  imageUrl: string;
  imagePath: string;
  thumbnailUrl?: string;
  tags: string[];
  isFavorite: boolean;
  wearCount: number;
  lastWornAt?: Date;
  purchaseDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Dolap filtre secenekleri
export interface WardrobeFilters {
  category?: ClothingCategory;
  season?: Season;
  color?: string;
  isFavorite?: boolean;
  searchQuery?: string;
}

// Dolap istatistikleri
export interface WardrobeStats {
  total: number;
  byCategory: Record<ClothingCategory, number>;
  bySeason: Record<Season, number>;
  favorites: number;
}

// Yeni dolap ogesi olusturma (imageUrl ve imagePath haric)
export type CreateWardrobeItemInput = Omit<
  WardrobeItem,
  'id' | 'userId' | 'imageUrl' | 'imagePath' | 'createdAt' | 'updatedAt' | 'wearCount'
>;

// Dolap ogesi guncelleme
export type UpdateWardrobeItemInput = Partial<
  Omit<WardrobeItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;
