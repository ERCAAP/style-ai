// Asset Helper - Local asset'leri URI'ye çevirme
import { Image, ImageSourcePropType } from 'react-native';

/**
 * Local asset'i (require()) URI string'e çevirir
 * @param asset - require() ile yüklenmiş local asset
 * @returns URI string veya null
 */
export function getAssetUri(asset: ImageSourcePropType): string | null {
  try {
    const resolved = Image.resolveAssetSource(asset);
    return resolved?.uri || null;
  } catch (error) {
    console.error('Asset URI çözümleme hatası:', error);
    return null;
  }
}

/**
 * Asset boyutlarını alır
 * @param asset - require() ile yüklenmiş local asset
 * @returns { width, height, uri } veya null
 */
export function getAssetInfo(asset: ImageSourcePropType) {
  try {
    return Image.resolveAssetSource(asset);
  } catch (error) {
    console.error('Asset bilgisi alınamadı:', error);
    return null;
  }
}
