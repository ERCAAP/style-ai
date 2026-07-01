# Frontend - Backend İletişim Mimarisi

BOHO uygulamasının frontend (React Native) ve backend (Firebase + Cloud Functions) arasındaki tüm iletişim akışlarının detaylı dokümantasyonu.

## 🏗️ Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT NATIVE APP                          │
│                      (Frontend)                              │
│  - Expo SDK 54                                               │
│  - React 19.1.0                                              │
│  - TypeScript 5.9.2                                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─────────────┬──────────────┬──────────────┬─────────────┐
             ▼             ▼              ▼              ▼             ▼
     ┌──────────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────┐ ┌────────────┐
     │   Firebase   │ │  Firebase  │ │Firebase  │ │  Firebase   │ │ RevenueCat │
     │   Firestore  │ │    Auth    │ │ Storage  │ │   Remote    │ │    SDK     │
     │   (NoSQL)    │ │(Anonymous) │ │ (Images) │ │   Config    │ │ (Paywall)  │
     └──────┬───────┘ └─────┬──────┘ └────┬─────┘ └──────┬──────┘ └──────┬─────┘
            │               │               │              │               │
            └───────────────┴───────────────┴──────────────┴───────────────┘
                                           │
                             ┌─────────────▼─────────────────┐
                             │    Firebase Cloud Functions    │
                             │      (Backend Logic)           │
                             │    - Region: europe-west1      │
                             │    - Node.js Runtime           │
                             └─────────┬───────┬─────────────┘
                                       │       │
                                       ▼       ▼
                             ┌──────────────┐ ┌──────────────┐
                             │   OpenAI     │ │  EachLabs    │
                             │   GPT-4o     │ │  P-IMAGE     │
                             │    API       │ │     API      │
                             └──────────────┘ └──────────────┘
```

---

## 📡 İletişim Kanalları

### 1. Firebase Firestore (Veritabanı)

**Kullanım**: Kullanıcı profilleri, analiz geçmişi, job tracking

**İletişim Yöntemi**: Firebase SDK (Client-side)

```typescript
import { db } from '@/services/firebase/config';
import { collection, doc, getDoc, setDoc, updateDoc, query, where } from 'firebase/firestore';

// Okuma örneği
const userDoc = await getDoc(doc(db, 'users', userId));
const userData = userDoc.data();

// Yazma örneği
await setDoc(doc(db, 'users', userId), {
  email: 'user@example.com',
  createdAt: serverTimestamp()
});

// Query örneği
const q = query(
  collection(db, 'jobs'),
  where('userId', '==', userId),
  where('status', '==', 'completed')
);
const querySnapshot = await getDocs(q);
```

**Firestore Koleksiyonları**:

```
users/
  {userId}/
    - email: string
    - subscription: { status, expiresAt, productId }
    - usage: { totalJobs, jobsToday, dailyLimit, lastJobDate }
    - preferences: { stylePreferences, bodyType, favoriteColors }
    - flags: { isBlocked, isPremium }
    - createdAt, updatedAt

jobs/
  {jobId}/
    - userId: string
    - type: 'outfit_analysis' | 'dress_change'
    - status: 'pending' | 'processing' | 'completed' | 'failed'
    - input: { imageUrl, imagePath }
    - output: { analysis, resultImageUrl }
    - createdAt, completedAt, processingTime

predictions/
  {predictionId}/
    - userId: string
    - status: 'processing' | 'completed' | 'failed'
    - input: { imageCount, prompt }
    - resultUrl: string
    - createdAt, completedAt

referrals/
  {referralId}/
    - referrerUsername: string
    - referredUserId: string
    - status: 'pending' | 'completed'
    - createdAt, convertedAt
```

**Güvenlik**: Firestore Security Rules ile korunuyor

```javascript
// firestore.rules
match /users/{userId} {
  // Kullanıcı sadece kendi verisini okuyabilir/yazabilir
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

match /jobs/{jobId} {
  // Kullanıcı sadece kendi job'larını görebilir
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow write: if request.auth != null;
}
```

---

### 2. Firebase Authentication

**Kullanım**: Kullanıcı kimlik doğrulama

**İletişim Yöntemi**: Firebase Auth SDK

```typescript
import { auth } from '@/services/firebase/config';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Anonymous sign-in
const userCredential = await signInAnonymously(auth);
const user = userCredential.user;
console.log('User ID:', user.uid);

// Auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User logged in:', user.uid);
  } else {
    console.log('User logged out');
  }
});
```

**Auth Akışı**:

```
App Başlatılıyor
    ↓
Auth State Kontrolü
    ↓
Kullanıcı var mı?
    ├── Evet → Mevcut session kullan
    └── Hayır → Anonymous sign-in yap
        ↓
User ID oluşturuldu (uid)
    ↓
Firestore'da user document oluştur
    ↓
App kullanıma hazır
```

**Persistence**: AsyncStorage ile otomatik session yönetimi

```typescript
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
```

---

### 3. Firebase Storage

**Kullanım**: Görsel yükleme ve depolama

**İletişim Yöntemi**: Firebase Storage SDK

```typescript
import { storage } from '@/services/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Görsel yükleme
async function uploadImage(uri: string): Promise<string> {
  // 1. URI'yi blob'a çevir
  const response = await fetch(uri);
  const blob = await response.blob();

  // 2. Benzersiz dosya adı oluştur
  const fileName = `outfit-analysis/${Date.now()}-${Math.random().toString(36)}.jpg`;

  // 3. Storage'a yükle
  const storageRef = ref(storage, fileName);
  await uploadBytes(storageRef, blob, {
    contentType: 'image/jpeg'
  });

  // 4. Public URL al
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}
```

**Storage Yapısı**:

```
/outfit-analysis/
  {timestamp}-{randomId}.jpg       # Kullanıcı yüklenen görseller

/dress-change/
  {userId}/
    input-{jobId}.jpg              # Try-on input görseller
    output-{jobId}.jpg             # Try-on sonuç görseller

/user-photos/
  {userId}/
    {photoId}.jpg                  # Wardrobe fotoğrafları
```

**Lifecycle Rules**: Otomatik temizleme

```json
// storage-lifecycle.rules.json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 90,
          "matchesPrefix": ["outfit-analysis/"]
        }
      }
    ]
  }
}
```

---

### 4. Firebase Cloud Functions (Ana Backend Logic)

**Kullanım**: AI analiz, try-on processing, business logic

**İletişim Yöntemi**: Firebase Functions SDK - `httpsCallable`

#### 4.1. Outfit Analysis Function

```typescript
// Frontend: services/api/secureAnalysis.ts
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(app, 'europe-west1');
const analyzeOutfitFn = httpsCallable(functions, 'analyzeOutfit');

// Function çağrısı
const result = await analyzeOutfitFn({
  imageUrl: 'https://storage.googleapis.com/...',
  language: 'tr',
  userPreferences: {
    stylePreferences: ['Bohemian', 'Casual'],
    bodyType: 'Hourglass',
    favoriteColors: ['Blue', 'White']
  },
  purposes: ['dinner', 'party']
});

console.log(result.data);
// {
//   success: true,
//   analysis: { ... },
//   timestamp: 1704729600000
// }
```

```typescript
// Backend: functions/src/index.ts
export const analyzeOutfit = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 120,
    memory: '512MiB',
    secrets: [openaiApiKey]
  },
  async (request) => {
    // 1. Auth check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required');
    }

    const uid = request.auth.uid;

    // 2. Rate limiting
    if (!checkRateLimit(uid)) {
      throw new HttpsError('resource-exhausted', 'Too many requests');
    }

    // 3. User verification
    const userStatus = await verifyUser(uid);
    if (userStatus.isBlocked) {
      throw new HttpsError('permission-denied', 'Account blocked');
    }

    // 4. Daily limit check (temporarily disabled for development)
    // if (!userStatus.isPremium && userStatus.remainingJobs <= 0) {
    //   throw new HttpsError('resource-exhausted', 'Daily limit reached');
    // }

    // 5. OpenAI GPT-4o analysis
    const { imageUrl, language, userPreferences, purposes } = request.data;

    const openai = getOpenAIClient(openaiApiKey.value());
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: buildAnalysisPrompt(language, userPreferences, purposes) },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' }
            }
          ]
        }
      ]
    });

    // 6. Parse JSON response
    const analysis = JSON.parse(response.choices[0].message.content);

    // 7. Update usage stats
    await incrementUsage(uid);

    // 8. Send notification
    await sendAnalysisCompleteNotification(uid, analysis.overallScore);

    return {
      success: true,
      analysis,
      timestamp: Date.now()
    };
  }
);
```

**Akış Diyagramı**:

```
Frontend (useAnalysis hook)
    │
    ├─ 1. Görsel seç (ImagePicker)
    ├─ 2. Storage'a yükle
    ├─ 3. Download URL al
    │
    ▼
Frontend → Cloud Function (analyzeOutfit)
    │
    ├─ Request:
    │   {
    │     imageUrl: "https://...",
    │     language: "tr",
    │     userPreferences: {...},
    │     purposes: ["dinner"]
    │   }
    │
    ▼
Cloud Function
    │
    ├─ 1. Auth kontrolü (request.auth.uid)
    ├─ 2. Rate limiting (1 dakikada max 10 istek)
    ├─ 3. Firestore'dan user bilgisi çek
    ├─ 4. Günlük limit kontrolü
    ├─ 5. OpenAI GPT-4o API çağrısı
    │      └─ Vision model ile görsel analizi
    ├─ 6. JSON response parse et
    ├─ 7. Firestore usage stats güncelle
    ├─ 8. Push notification gönder
    │
    ▼
Cloud Function → Frontend
    │
    └─ Response:
        {
          success: true,
          analysis: {
            overallScore: 8.5,
            colorHarmony: {...},
            styleMatch: {...},
            suggestions: [...]
          },
          timestamp: 1704729600000
        }
    │
    ▼
Frontend
    │
    ├─ 1. Analysis result göster
    ├─ 2. Local storage'a kaydet
    ├─ 3. Firestore job'u complete yap
    └─ 4. Navigation → result screen
```

#### 4.2. Try-On Function (Outfit Deneme)

```typescript
// Frontend: Outfit try-on request
const tryOutfitFn = httpsCallable(functions, 'tryOutfit');

const result = await tryOutfitFn({
  userImageBase64: 'data:image/jpeg;base64,...',
  clothingImageBase64s: [
    'data:image/jpeg;base64,...',  // Elbise
    'data:image/jpeg;base64,...'   // Ayakkabı
  ],
  aspectRatio: 'match_input_image',
  turbo: true
});

console.log(result.data);
// {
//   success: true,
//   predictionId: 'pred_xyz123',
//   status: 'processing'
// }
```

```typescript
// Backend: Try-on processing
export const tryOutfit = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 60,
    secrets: [eachlabsApiKey]
  },
  async (request) => {
    // 1. Validations
    const { userImageBase64, clothingImageBase64s } = request.data;

    // 2. Base64 → Data URI formatına çevir
    const allImages = [userImageBase64, ...clothingImageBase64s];

    // 3. AI prompt oluştur
    const prompt = generateClothingTransferPrompt(clothingImageBase64s.length);

    // 4. EachLabs P-IMAGE API çağrısı
    const response = await fetch('https://api.eachlabs.ai/v1/prediction/', {
      method: 'POST',
      headers: {
        'X-API-Key': eachlabsApiKey.value(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'p-image-edit',
        version: '0.0.1',
        input: {
          aspect_ratio: 'match_input_image',
          images: allImages,
          prompt: prompt,
          turbo: true
        }
      })
    });

    const result = await response.json();
    const predictionId = result.predictionID;

    // 5. Firestore'a kaydet
    await db.collection('predictions').doc(predictionId).set({
      userId: request.auth.uid,
      status: 'processing',
      createdAt: Timestamp.now()
    });

    return {
      success: true,
      predictionId,
      status: 'processing'
    };
  }
);
```

**Try-On Polling Akışı**:

```
Frontend
    │
    ├─ 1. tryOutfit() çağır
    │      └─ predictionId al
    │
    ├─ 2. Her 2 saniyede polling yap
    │      │
    │      ▼
    │   getPredictionStatus(predictionId)
    │      │
    │      └─ Cloud Function
    │            │
    │            ├─ EachLabs API'den status sor
    │            │   GET /v1/prediction/{predictionId}
    │            │
    │            └─ Response:
    │                ├─ status: 'processing' → Devam et
    │                ├─ status: 'success' → resultUrl döndür
    │                └─ status: 'failed' → Hata göster
    │
    └─ 3. Status 'completed' olunca:
           └─ Result görselini göster
```

---

### 5. Firebase Remote Config

**Kullanım**: Dinamik app konfigürasyonu (force update, maintenance mode, paywall offering)

**İletişim Yöntemi**: Firebase Remote Config SDK

```typescript
// services/firebase/remoteConfig.ts
import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';

const remoteConfig = getRemoteConfig(app);
remoteConfig.settings.minimumFetchIntervalMillis = __DEV__ ? 0 : 3600000;

// Fetch and activate
await fetchAndActivate(remoteConfig);

// Get values
const maintenanceMode = getValue(remoteConfig, 'maintenance_mode').asBoolean();
const forceUpdateEnabled = getValue(remoteConfig, 'force_update_enabled').asBoolean();
const minimumVersion = getValue(remoteConfig, 'minimum_app_version').asString();
const activeOfferingId = getValue(remoteConfig, 'active_offering_id').asString();
```

**Config Parameters**:

```json
{
  "maintenance_mode": false,
  "maintenance_title": "Bakım Çalışması",
  "maintenance_message": "...",

  "force_update_enabled": false,
  "minimum_app_version": "1.0.0",
  "force_update_title": "Güncelleme Gerekli",
  "force_update_message": "...",

  "active_offering_id": "pro_a",
  "use_fallback_offering": true
}
```

**AppGate Flow**:

```
App Launch
    ↓
Remote Config Initialize
    ↓
Force Update Check
    ├─ Aktif + Version < Minimum → Force Update Screen
    └─ Değil → Devam
        ↓
Maintenance Mode Check
    ├─ Aktif → Maintenance Screen
    └─ Değil → Normal App Flow
```

---

### 6. RevenueCat (Paywall & Subscriptions)

**Kullanım**: In-app purchases, subscription yönetimi

**İletişim Yöntemi**: RevenueCat SDK (3rd party)

```typescript
// services/purchases.ts
import Purchases from 'react-native-purchases';

// Initialize
await Purchases.configure({
  apiKey: Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
  })!
});

// Get offerings
const offerings = await Purchases.getOfferings();
const offering = offerings.all['pro_a'];

// Purchase
const { customerInfo } = await Purchases.purchasePackage(offering.availablePackages[0]);
const isPro = customerInfo.entitlements.active['pro'] !== undefined;

// Restore purchases
const customerInfo = await Purchases.restorePurchases();
```

**RevenueCat → Firebase Sync**:

```
User Purchase
    ↓
RevenueCat processes payment
    ↓
Frontend: onPurchaseCompleted callback
    ↓
Frontend → Firestore
    └─ Update user document:
        {
          subscription: {
            status: 'active',
            productId: 'pro_monthly',
            expiresAt: Timestamp
          }
        }
    ↓
Frontend → Firebase Analytics
    └─ Track purchase event
```

**Paywall Offering Control** (Remote Config):

```typescript
// app/paywall.tsx
const activeOfferingId = getActiveOfferingId(); // Remote Config'den
const offerings = await Purchases.getOfferings();
const offering = offerings.all[activeOfferingId]; // Dinamik offering seçimi

// RevenueCat Console'dan offering oluştur
// Firebase Remote Config'den aktif offering ID'sini değiştir
// Uygulama güncelleme gerekmeden yeni paywall aktif olur
```

---

## 🔐 Güvenlik & Authentication Flow

### Complete Auth Flow

```
1. App Launch
   └─ AuthProvider initialize
      └─ onAuthStateChanged listener

2. No User?
   └─ signInAnonymously()
      └─ Anonymous User ID created
         └─ Firestore user document created

3. Authenticated User
   └─ All API calls include auth token
      └─ Cloud Functions: request.auth.uid
      └─ Firestore: security rules check
      └─ Storage: security rules check

4. Purchase/Upgrade
   └─ RevenueCat processes
      └─ Update Firestore subscription status
         └─ Cloud Functions check isPremium flag
```

### Security Rules Example

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Jobs can be read by owner, written by authenticated users
    match /jobs/{jobId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 📊 Data Flow Examples

### Example 1: Complete Analysis Flow

```
USER ACTION: "Analyze my outfit"
    │
    ▼
Frontend (Home Screen)
    │
    ├─ 1. ImagePicker.launchCameraAsync()
    │      └─ Local URI: file:///data/user/0/.../image.jpg
    │
    ├─ 2. useAnalysis.startAnalysis(uri)
    │      │
    │      ├─ Check auth: auth.currentUser
    │      ├─ Upload to Storage: uploadUserImage()
    │      │   └─ Returns: https://storage.googleapis.com/.../image.jpg
    │      │
    │      ├─ Create job in Firestore
    │      │   └─ jobs/{jobId}: { userId, status: 'pending', ... }
    │      │
    │      ├─ Call Cloud Function: analyzeOutfitFn()
    │      │   │
    │      │   ▼
    │      │ Cloud Function (europe-west1)
    │      │   │
    │      │   ├─ Auth check: request.auth.uid
    │      │   ├─ Rate limit check
    │      │   ├─ Firestore: Get user data
    │      │   ├─ Check daily limit
    │      │   │
    │      │   ├─ OpenAI API call
    │      │   │   POST https://api.openai.com/v1/chat/completions
    │      │   │   {
    │      │   │     model: "gpt-4o",
    │      │   │     messages: [
    │      │   │       { role: "user", content: [
    │      │   │         { type: "text", text: "Analiz et..." },
    │      │   │         { type: "image_url", image_url: { url: imageUrl } }
    │      │   │       ]}
    │      │   │     ]
    │      │   │   }
    │      │   │   │
    │      │   │   └─ Response: { choices: [{ message: { content: "{...}" } }] }
    │      │   │
    │      │   ├─ Parse JSON
    │      │   ├─ Update Firestore usage stats
    │      │   ├─ Send push notification
    │      │   │
    │      │   └─ Return { success: true, analysis: {...} }
    │      │
    │      ├─ Update job status: 'completed'
    │      ├─ Save to AsyncStorage (local cache)
    │      │
    │      └─ Navigate to result screen
    │
    ▼
Result Screen
    └─ Display analysis with scores, suggestions, etc.
```

### Example 2: Try-On Flow

```
USER ACTION: "Try this outfit on me"
    │
    ▼
Frontend (Dress Change Screen)
    │
    ├─ 1. Select user photo (selfie)
    ├─ 2. Select 1-3 clothing items
    │
    ├─ 3. Convert images to base64
    │      const base64 = await FileSystem.readAsStringAsync(uri, {
    │        encoding: FileSystem.EncodingType.Base64
    │      });
    │
    ├─ 4. Call tryOutfit function
    │      const result = await tryOutfitFn({
    │        userImageBase64: 'data:image/jpeg;base64,...',
    │        clothingImageBase64s: ['data:image/jpeg;base64,...']
    │      });
    │      │
    │      └─ Returns: { predictionId: 'pred_xyz' }
    │
    ├─ 5. Start polling (every 2 seconds)
    │      │
    │      ▼
    │   getPredictionStatusFn({ predictionId })
    │      │
    │      └─ Cloud Function
    │            │
    │            ├─ Check Firestore cache first
    │            │
    │            ├─ EachLabs API status check
    │            │   GET https://api.eachlabs.ai/v1/prediction/{id}
    │            │   │
    │            │   └─ Response:
    │            │       {
    │            │         status: "processing" | "success" | "failed",
    │            │         output: "https://result-image-url.jpg"
    │            │       }
    │            │
    │            ├─ Update Firestore if completed
    │            ├─ Send push notification
    │            │
    │            └─ Return status
    │
    └─ 6. When status = 'success'
           └─ Display result image
           └─ Save to wardrobe (optional)
```

---

## 🚀 Performance Optimizations

### 1. Caching Strategy

```typescript
// Local cache (AsyncStorage)
const CACHE_KEY = '@boho_analysis_cache';

// Save analysis result
await AsyncStorage.setItem(
  `${CACHE_KEY}_${imageHash}`,
  JSON.stringify(analysisResult)
);

// Check cache before API call
const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${imageHash}`);
if (cached) {
  return JSON.parse(cached);
}
```

### 2. Image Optimization

```typescript
// Compress before upload
import * as ImageManipulator from 'expo-image-manipulator';

const manipResult = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 1024 } }],
  { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
);
```

### 3. Batch Operations

```typescript
// Firestore batch write
const batch = db.batch();
batch.set(userRef, userData);
batch.update(jobRef, { status: 'completed' });
await batch.commit();
```

### 4. Remote Config Caching

```typescript
// Production: 1 hour cache
remoteConfig.settings.minimumFetchIntervalMillis = 3600000;

// Development: Instant fetch
remoteConfig.settings.minimumFetchIntervalMillis = 0;
```

---

## 🐛 Error Handling

### Cloud Function Errors

```typescript
// Frontend error handling
try {
  const result = await analyzeOutfitFn({ imageUrl });
} catch (error: any) {
  const errorCode = error?.code;

  switch (errorCode) {
    case 'functions/unauthenticated':
      // Show login prompt
      break;
    case 'functions/resource-exhausted':
      // Show daily limit message
      break;
    case 'functions/permission-denied':
      // Show blocked account message
      break;
    default:
      // Generic error message
  }
}
```

### Retry Logic

```typescript
async function retryableFetch(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}
```

---

## 📈 Monitoring & Logging

### Console Logs (Development)

```typescript
// Cloud Functions
console.log('[analyzeOutfit] Starting analysis for user:', uid);
console.log('[analyzeOutfit] OpenAI response:', response);
console.log('[analyzeOutfit] Analysis completed in', processingTime, 'ms');

// Frontend
console.log('📊 Analysis started');
console.log('✅ Analysis completed:', result);
console.error('❌ Analysis failed:', error);
```

### Firebase Analytics Events

```typescript
import { logEvent } from 'firebase/analytics';

// Track key events
logEvent(analytics, 'analysis_started', { userId });
logEvent(analytics, 'analysis_completed', { score: 8.5 });
logEvent(analytics, 'purchase_completed', { productId: 'pro_monthly' });
```

---

## 🎯 Best Practices

### 1. Always Check Auth Before API Calls

```typescript
if (!auth.currentUser) {
  await signInAnonymously(auth);
}
```

### 2. Use TypeScript Types

```typescript
interface AnalysisRequest {
  imageUrl: string;
  language: 'tr' | 'en';
  userPreferences?: UserPreferences;
}

interface AnalysisResponse {
  success: boolean;
  analysis: OutfitAnalysis | null;
  error?: string;
}
```

### 3. Handle Offline Mode

```typescript
import NetInfo from '@react-native-community/netinfo';

const netInfo = await NetInfo.fetch();
if (!netInfo.isConnected) {
  throw new Error('No internet connection');
}
```

### 4. Graceful Degradation

```typescript
// Try cloud function first, fallback to local if fails
try {
  const result = await cloudAnalysis();
  return result;
} catch (error) {
  console.warn('Cloud analysis failed, using local cache');
  return localCache();
}
```

---

## 📞 API Endpoints Summary

| Service | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| Firebase Auth | POST | `/identitytoolkit/v3/...` | Anonymous sign-in |
| Firestore | GET/POST | `/v1/projects/.../databases/...` | CRUD operations |
| Storage | POST | `/v0/b/.../o/...` | Upload images |
| Cloud Functions | POST | `/europe-west1/analyzeOutfit` | AI analysis |
| Cloud Functions | POST | `/europe-west1/tryOutfit` | Virtual try-on |
| Cloud Functions | POST | `/europe-west1/getPredictionStatus` | Status check |
| Remote Config | GET | `/v1/projects/.../remoteConfig` | Fetch config |
| RevenueCat | GET/POST | `https://api.revenuecat.com/v1/...` | Purchases |
| OpenAI | POST | `https://api.openai.com/v1/chat/completions` | GPT-4o (from backend) |
| EachLabs | POST | `https://api.eachlabs.ai/v1/prediction/` | P-IMAGE (from backend) |

---

**Created by Claude Code**
Version 1.0.0 - January 2026
