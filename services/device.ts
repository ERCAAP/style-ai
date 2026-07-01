import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'DEVICE_ID';

// UUID oluştur
async function generateUUID(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // UUID v4 formatı
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    '4' + hex.substring(13, 16),
    ((parseInt(hex.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) +
      hex.substring(18, 20),
    hex.substring(20, 32),
  ].join('-');
}

// Device ID al veya oluştur
export async function getDeviceId(): Promise<string> {
  try {
    // Önce kayıtlı ID'yi kontrol et
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (!deviceId) {
      // Yeni ID oluştur ve kaydet
      deviceId = await generateUUID();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('Device ID error:', error);
    // Fallback: geçici ID oluştur
    return await generateUUID();
  }
}

// Device ID'yi sıfırla (debug için)
export async function resetDeviceId(): Promise<string> {
  try {
    const newDeviceId = await generateUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newDeviceId);
    return newDeviceId;
  } catch (error) {
    console.error('Reset device ID error:', error);
    throw error;
  }
}
