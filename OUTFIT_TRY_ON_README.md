# 👔 Kıyafet Deneme (Outfit Try-On) - Teknik Dokümantasyon

## 🎯 Genel Bakış

Bu özellik EachLabs P-IMAGE API kullanarak kullanıcılara sanal kıyafet deneme deneyimi sunar. Sistem Firebase Cloud Functions kullanarak güvenli ve ölçeklenebilir bir mimari üzerine inşa edilmiştir.

## 🏗️ Mimari

```
┌─────────────────┐
│   React Native  │
│   Client App    │
└────────┬────────┘
         │
         ├─► Firebase Storage (Görselleri yükle)
         │
         ├─► Firebase Cloud Functions
         │   └─► tryOutfit()
         │   └─► getPredictionStatus()
         │
         └─► Firebase Firestore (Durum takibi)

Cloud Functions
         │
         ├─► Firebase Secrets (API Key)
         │
         └─► EachLabs P-IMAGE API
```

## 📁 Dosya Yapısı

### Client-Side (React Native)
```
app/
├── outfit-try.tsx                    # Ana kıyafet seçim ekranı
├── processing.tsx                    # Animasyonlu işlem ekranı
└── outfit-try-result.tsx             # Sonuç gösterim ekranı

services/api/
├── pImageCloudService.ts             # Cloud Functions client service
└── index.ts                          # API exports

components/processing/
├── FlyingImagesAnimation.tsx         # Kıyafet uçuş animasyonu
└── EnhancedRadarScan.tsx             # Radar tarama animasyonu
```

### Server-Side (Firebase Cloud Functions)
```
functions/src/
└── index.ts                          # Cloud Functions tanımları
    ├── tryOutfit()                   # Kıyafet deneme başlatma
    └── getPredictionStatus()         # Durum sorgulama
```

## 🔐 Güvenlik

### Firebase Secrets Kullanımı

API anahtarı **asla** client-side'da bulunmaz. Tüm API çağrıları Firebase Cloud Functions üzerinden yapılır.

**Secret Tanımlama:**
```typescript
const eachlabsApiKey = defineSecret('EACHLABS_API_KEY');
```

**Secret Kullanımı:**
```typescript
export const tryOutfit = onCall(
  {
    secrets: [eachlabsApiKey],  // Secret'ı function'a enjekte et
  },
  async (request) => {
    const apiKey = eachlabsApiKey.value();  // Runtime'da değeri al
    // ...
  }
);
```

## 🚀 Kurulum ve Deployment

### 1. Firebase Secrets'ı Yapılandırın

```bash
# EachLabs API key'i secret olarak ekleyin
firebase functions:secrets:set EACHLABS_API_KEY

# Doğrulayın
firebase functions:secrets:access EACHLABS_API_KEY
```

Detaylı talimatlar için: [FIREBASE_SECRETS_SETUP.md](./FIREBASE_SECRETS_SETUP.md)

### 2. Cloud Functions'ı Build Edin

```bash
cd functions
npm install
npm run build
```

### 3. Deploy Edin

```bash
# Sadece functions deploy et
firebase deploy --only functions

# Veya tüm projeyi deploy et
firebase deploy
```

### 4. Client App'i Test Edin

```bash
npm start
```

## 💡 Kullanım Akışı

### 1. Kullanıcı Fotoğrafı Seçimi
```typescript
// outfit-try.tsx
const { selectedImage: userImage } = useImagePickerHook();
```

### 2. Kıyafet Fotoğrafları Seçimi (1-10 adet)
```typescript
const { images: targetImages } = useTargetImages();
```

### 3. İşleme Başlatma
```typescript
// "Kıyafetleri Dene" butonuna basıldığında
router.push({
  pathname: '/processing',
  params: {
    userImageUri: userImage.uri,
    targetImageUris: JSON.stringify(targetImages.map(img => img.uri)),
  },
});
```

### 4. API Çağrısı (Cloud Function)
```typescript
// processing.tsx
const result = await generateOutfitTryOn(
  {
    userImageUri,
    clothingImageUris: targetImageUris,
    turbo: true,
  },
  (status: PImageStatus) => {
    // Progress callback
    setProgress(status.progress);
    setStatusText(statusMessages[...]);
  }
);
```

### 5. Cloud Function İşleyişi

**a) Görselleri Firebase Storage'a Yükle:**
```typescript
// pImageCloudService.ts
const userUrl = await uploadLocalImage(userImageUri, 0);
const clothingUrls = await Promise.all(
  clothingImageUris.map((uri, i) => uploadLocalImage(uri, i + 1))
);
```

**b) Cloud Function'ı Çağır:**
```typescript
const result = await tryOutfitFn({
  userImageUrl: userUrl,
  clothingImageUrls: clothingUrls,
  turbo: true,
});
```

**c) Server-Side İşlem:**
```typescript
// functions/src/index.ts
export const tryOutfit = onCall(..., async (request) => {
  // 1. Authentication kontrolü
  // 2. Rate limiting
  // 3. User verification
  // 4. Data validation

  // 5. Intelligent prompt oluştur
  const finalPrompt = generateClothingTransferPrompt(
    clothingImageUrls.length
  );

  // 6. EachLabs API'ye istek gönder
  const response = await fetch(EACHLABS_API_URL, {
    method: 'POST',
    headers: {
      'X-API-Key': eachlabsApiKey.value(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'p-image-edit',
      version: '0.0.1',
      input: {
        images: [userImageUrl, ...clothingImageUrls],
        prompt: finalPrompt,
        turbo: true,
      },
    }),
  });

  // 7. Prediction ID'yi kaydet ve döndür
  return { success: true, predictionId };
});
```

### 6. Polling (Durum Sorgulama)
```typescript
// Her 5 saniyede bir status sorgulanır
const result = await getPredictionStatusFn({ predictionId });

if (result.data.status === 'completed') {
  // Sonuç hazır
  router.replace({
    pathname: '/outfit-try-result',
    params: { imageUrl: result.data.resultUrl },
  });
}
```

## 🎨 Intelligent Prompt Generation

Cloud Function otomatik olarak akıllı promptlar oluşturur:

```typescript
function generateClothingTransferPrompt(clothingItemsCount: number): string {
  // Koruma talimatları
  const preservationParts = [
    'maintaining the person\'s exact facial features, skin tone, and facial structure',
    'preserving the exact hair color, hairstyle, and hair texture',
    'keeping the natural body proportions and posture'
  ];

  // Kıyafet sayısına göre talimatlar
  let mainInstruction = '';
  if (clothingItemsCount === 1) {
    mainInstruction = 'Dress the person in the clothing item...';
  } else if (clothingItemsCount === 2) {
    mainInstruction = 'Dress the person in the clothing items and accessories...';
  } else {
    mainInstruction = 'Dress the person in all the clothing items, accessories...';
  }

  // Detay talimatları
  const clothingDetails = [
    'Apply any dresses, tops, bottoms, or outerwear exactly as shown',
    'Include all visible accessories such as jewelry, bags, belts...',
    'Apply footwear including shoes, boots, heels...',
    'Preserve any glasses, hats, or headwear...',
    'Match the fabric textures, patterns, colors...'
  ].join('. ');

  // Kalite talimatları
  const qualityInstructions = [
    'Ensure photorealistic quality with natural lighting and shadows',
    'Maintain proper clothing fit and draping on the body',
    'Keep the background and environment unchanged',
    'Preserve the original photo\'s composition and framing'
  ].join('. ');

  return `${mainInstruction}, while ${preservationClause}. ${clothingDetails}. ${qualityInstructions}.`;
}
```

## 📊 Firestore Veri Yapısı

### Predictions Collection
```typescript
predictions/{predictionId}/
{
  userId: string,
  predictionId: string,
  status: 'processing' | 'completed' | 'failed',
  input: {
    userImageUrl: string,
    clothingImageUrls: string[],
    prompt: string,
    aspectRatio: string,
    turbo: boolean,
  },
  resultUrl?: string,  // Tamamlandığında
  error?: string,      // Başarısız olursa
  createdAt: Timestamp,
  completedAt?: Timestamp,
}
```

## 🎭 Animasyonlar

### 1. Flying Images Animation
```typescript
// components/processing/FlyingImagesAnimation.tsx
// Kıyafetler ekranın farklı köşelerinden merkeze uçar
// - Staggered timing (120ms arayla)
// - Bezier curved paths
// - Scale interpolation
// - Rotation effects
```

### 2. Enhanced Radar Scan
```typescript
// components/processing/EnhancedRadarScan.tsx
// AI işlerken radar tarama animasyonu
// - 2200ms döngü
// - Pulse effects
// - Glow intensity
```

## ⚡ Performans Optimizasyonları

### 1. Image Compression
```typescript
// Görseller Firebase Storage'a yüklenmeden önce sıkıştırılır
const compressedImage = await compressImage(uri, {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
});
```

### 2. Parallel Uploads
```typescript
// Görseller paralel yüklenir
const uploadPromises = clothingImageUris.map((uri, i) =>
  uploadLocalImage(uri, i + 1)
);
const urls = await Promise.all(uploadPromises);
```

### 3. Memoization
```typescript
// Componentler memoize edilir
const AddPhotoButton = memo(({ onPress, label }) => { ... });
const TargetImagesGrid = memo(({ images, onAddPress }) => { ... });
```

## 🔍 Error Handling

### Client-Side
```typescript
try {
  const result = await generateOutfitTryOn(...);
  if (!result.success) {
    Alert.alert('Hata', result.error);
  }
} catch (error) {
  // Firebase Functions errors
  const errorMessages = {
    'functions/unauthenticated': 'Giriş yapmanız gerekiyor',
    'functions/resource-exhausted': 'Çok fazla istek',
    'functions/internal': 'Sunucu hatası',
  };
  Alert.alert('Hata', errorMessages[error.code] || 'Beklenmeyen hata');
}
```

### Server-Side
```typescript
// Cloud Functions'da comprehensive error handling
try {
  // API call
} catch (error) {
  console.error('TryOutfit error:', error);

  if (error instanceof HttpsError) {
    throw error;
  }

  throw new HttpsError('internal', 'Kiyafet deneme sirasinda hata olustu');
}
```

## 📈 Rate Limiting

### Client-Side
```typescript
// Her kullanıcı için dakikada max 10 istek
const rateLimitKey = `tryoutfit_${uid}`;
if (!checkRateLimit(rateLimitKey)) {
  throw new HttpsError('resource-exhausted', 'Çok fazla istek');
}
```

## 🧪 Testing

### Lokal Test (Emulator)
```bash
# Functions emulator'ı başlat
cd functions
npm run serve

# Client'ta emulator kullan
# services/firebase/config.ts'de uncomment:
// connectFunctionsEmulator(functions, 'localhost', 5001);
```

### Production Test
```bash
# Functions'ı deploy et
firebase deploy --only functions

# Logs'u izle
firebase functions:log --only tryOutfit,getPredictionStatus
```

## 📱 Platform Desteği

- ✅ iOS 15.1+
- ✅ Android API 24+
- ✅ Expo SDK 54

## 🎁 Özellikler

- ✅ Multiple clothing items (1-10)
- ✅ Smart face & hair preservation
- ✅ Accessories support (jewelry, shoes, bags, etc.)
- ✅ Real-time progress tracking
- ✅ Beautiful animations
- ✅ Error recovery
- ✅ Gallery integration
- ✅ Share functionality
- ✅ Firebase Authentication
- ✅ Rate limiting
- ✅ Usage tracking
- ✅ Premium/Free tier support

## 🔗 İlgili Linkler

- [Firebase Secrets Setup](./FIREBASE_SECRETS_SETUP.md)
- [EachLabs P-IMAGE Docs](https://docs.eachlabs.ai/p-image)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

## 👨‍💻 Geliştirici Notları

### Environment Variables
```bash
# .env dosyasında SADECE Firebase config
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
# etc.

# EachLabs API key Firebase secrets'da!
# firebase functions:secrets:set EACHLABS_API_KEY
```

### Debugging
```bash
# Cloud Functions logs
firebase functions:log

# Specific function
firebase functions:log --only tryOutfit

# Real-time
firebase functions:log --only tryOutfit --tail
```

### Common Issues

**1. "Secret not found" hatası**
```bash
firebase functions:secrets:set EACHLABS_API_KEY
```

**2. Timeout hatası**
- Cloud Function timeout'u 60s (tryOutfit)
- Polling timeout'u 5 dakika (300s)
- EachLabs API genelde 30-60s içinde döner

**3. Görsel yüklenmiyor**
- Firebase Storage rules'u kontrol edin
- İnternet bağlantısını kontrol edin
- Image compression ayarlarını kontrol edin

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

**Son Güncelleme:** 7 Ocak 2026
**Versiyon:** 1.0.0
