import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Device from 'expo-device';
import { Alert, Linking, Platform } from 'react-native';
import { compressImage, CompressedImage } from '@/utils/imageCompression';

export interface SelectedImage {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  type: 'camera' | 'gallery';
  originalUri: string;
}

interface UseImagePickerOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
}

interface UseImagePickerReturn {
  selectedImage: SelectedImage | null;
  isLoading: boolean;
  error: string | null;
  pickFromCamera: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  clearImage: () => void;
  saveToGallery: (uri: string) => Promise<boolean>;
  setImageDirectly: (image: SelectedImage) => void;
}

const DEFAULT_OPTIONS: UseImagePickerOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  allowsEditing: true,
  aspect: [3, 4],
};

export function useImagePicker(options: UseImagePickerOptions = {}): UseImagePickerReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCameraPermission = async (): Promise<boolean> => {
    // Daha hızlı - doğrudan izin iste, zaten verilmişse anında dönecek
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Kamera İzni Gerekli',
        'Fotoğraf çekmek için kamera erişimine izin vermeniz gerekiyor.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    return true;
  };

  const requestGalleryPermission = async (): Promise<boolean> => {
    // Daha hızlı - doğrudan izin iste, zaten verilmişse anında dönecek
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Galeri İzni Gerekli',
        'Fotoğraf seçmek için galeri erişimine izin vermeniz gerekiyor.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    return true;
  };

  const processImage = async (
    result: ImagePicker.ImagePickerResult,
    type: 'camera' | 'gallery'
  ): Promise<void> => {
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setIsLoading(true);
    setError(null);

    try {
      // Görseli sıkıştır
      const compressed = await compressImage(asset.uri, {
        maxWidth: opts.maxWidth,
        maxHeight: opts.maxHeight,
        quality: opts.quality,
      });

      setSelectedImage({
        uri: compressed.uri,
        width: compressed.width,
        height: compressed.height,
        fileSize: compressed.fileSize,
        type,
        originalUri: asset.uri,
      });
    } catch (err) {
      console.error('Image processing error:', err);
      setError('Görsel işlenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromCamera = useCallback(async () => {
    // Simulator check - simulator'da kamera yok
    if (!Device.isDevice) {
      Alert.alert(
        'Kamera Kullanılamıyor',
        'Simulator\'da kamera kullanılamaz. Galeri\'den fotoğraf seçmek ister misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Galeri\'yi Aç',
            onPress: () => pickFromGallery(),
          },
        ]
      );
      return;
    }

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: opts.allowsEditing,
        aspect: opts.aspect,
        quality: 1, // Sıkıştırmayı kendimiz yapacağız
      });

      await processImage(result, 'camera');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Kamera açılırken bir hata oluştu.');
    }
  }, [opts]);

  const pickFromGallery = useCallback(async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: opts.allowsEditing,
        aspect: opts.aspect,
        quality: 1, // Sıkıştırmayı kendimiz yapacağız
      });

      await processImage(result, 'gallery');
    } catch (err) {
      console.error('Gallery error:', err);
      setError('Galeri açılırken bir hata oluştu.');
    }
  }, [opts]);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setError(null);
  }, []);

  const saveToGallery = useCallback(async (uri: string): Promise<boolean> => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Galeri İzni Gerekli',
          'Görseli kaydetmek için galeri erişimine izin vermeniz gerekiyor.',
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      return true;
    } catch (err) {
      console.error('Save to gallery error:', err);
      return false;
    }
  }, []);

  const setImageDirectly = useCallback((image: SelectedImage) => {
    setSelectedImage(image);
    setError(null);
  }, []);

  return {
    selectedImage,
    isLoading,
    error,
    pickFromCamera,
    pickFromGallery,
    clearImage,
    saveToGallery,
    setImageDirectly,
  };
}
