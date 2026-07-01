import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  format: 'jpeg',
};

export async function compressImage(
  uri: string,
  options: CompressionOptions = {}
): Promise<CompressedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Manipülasyon işlemleri
  const actions: ImageManipulator.Action[] = [];

  // Resize action ekle
  actions.push({
    resize: {
      width: opts.maxWidth,
      height: opts.maxHeight,
    },
  });

  // Sıkıştır
  const result = await ImageManipulator.manipulateAsync(
    uri,
    actions,
    {
      compress: opts.quality,
      format: opts.format === 'png'
        ? ImageManipulator.SaveFormat.PNG
        : ImageManipulator.SaveFormat.JPEG,
    }
  );

  // Yeni dosya boyutunu al
  const compressedInfo = await FileSystem.getInfoAsync(result.uri);
  const fileSize = compressedInfo.exists ? (compressedInfo as any).size || 0 : 0;

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    fileSize,
  };
}

export async function getImageFileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    return (info as any).size || 0;
  }
  return 0;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
