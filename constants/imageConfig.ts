// Image Picker Configuration Constants
import { Limits, AspectRatios } from './theme';

export const IMAGE_PICKER_PRESETS = {
  // For wardrobe items (square)
  square: {
    mediaTypes: ['images'] as const,
    allowsEditing: true,
    aspect: [1, 1] as [number, number],
    quality: Limits.imageQuality,
  },
  // For outfit photos (portrait)
  portrait: {
    mediaTypes: ['images'] as const,
    allowsEditing: true,
    aspect: [3, 4] as [number, number],
    quality: Limits.imageQuality,
  },
  // For full body photos with size limits
  fullBody: {
    mediaTypes: ['images'] as const,
    allowsEditing: true,
    aspect: [3, 4] as [number, number],
    quality: Limits.imageQuality,
    exif: false,
  },
} as const;

// Camera options
export const CAMERA_PRESETS = {
  portrait: {
    allowsEditing: true,
    aspect: [3, 4] as [number, number],
    quality: Limits.imageQuality,
  },
  square: {
    allowsEditing: true,
    aspect: [1, 1] as [number, number],
    quality: Limits.imageQuality,
  },
} as const;

// Image resize options for upload
export const IMAGE_RESIZE_OPTIONS = {
  maxWidth: Limits.maxImageWidth,
  maxHeight: Limits.maxImageHeight,
  quality: Limits.imageQuality,
} as const;
