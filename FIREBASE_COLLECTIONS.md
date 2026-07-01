# 🔥 Firebase Collections Structure

Bu dokümanda Boho App için kullanılan tüm Firebase Firestore collection'ları ve yapıları açıklanmaktadır.

---

## 📊 Collections Listesi

### 1. `users`
Kullanıcı profil bilgileri

**Structure:**
```typescript
{
  uid: string,                    // Firebase Auth UID
  email: string,                  // User email
  displayName: string,            // User display name
  photoURL: string | null,        // Profile photo URL
  referralCode: string,           // Unique referral code (e.g., "omer")
  referredBy: string | null,      // Referrer's username
  createdAt: Timestamp,           // Account creation time
  updatedAt: Timestamp,           // Last update time
  isPremium: boolean,             // Premium subscription status
  premiumExpiresAt: Timestamp | null,  // Premium expiration date

  // Preferences
  preferences: {
    language: string,             // "en" | "tr"
    notifications: boolean,       // Push notifications enabled
    theme: string                 // "light" | "dark"
  }
}
```

**Indexes:**
- `referralCode` (ASC) + `createdAt` (DESC)

**Rules:**
- Read: Public (for referral system)
- Create: Authenticated users
- Update/Delete: Owner only

---

### 2. `userAnalytics`
Kullanıcı bazlı analytics özeti

**Structure:**
```typescript
{
  userId: string,                 // Document ID = username (e.g., "omer")
  username: string,               // Username

  // Counts
  totalClicks: number,            // Total deeplink clicks
  totalInstalls: number,          // Total app installs from referrals
  totalOpens: number,             // Total app opens from referrals
  totalPurchases: number,         // Total purchases from referrals
  totalAnalyses: number,          // Total analyses from referrals

  // Revenue
  totalRevenue: number,           // Total revenue from referrals ($)

  // Conversion
  conversionRate: number,         // Clicks to installs conversion rate (%)

  // Timestamps
  firstEventAt: Timestamp,        // First referral event
  lastEventAt: Timestamp,         // Last referral event
  updatedAt: Timestamp            // Last update time
}
```

**Rules:**
- Read: Public (for analytics dashboard)
- Write: System only (Cloud Functions/Admin SDK)

---

### 3. `referralEvents`
Tüm referral event'leri (installs, purchases, analyses, etc.)

**Structure:**
```typescript
{
  eventId: string,                // Auto-generated document ID
  eventType: string,              // "app_install" | "app_open" | "purchase" | "analysis"

  // User info
  referrerId: string,             // Referrer username (e.g., "omer")
  referredUserId: string,         // Referred user device ID

  // Platform
  platform: string,               // "ios" | "android"

  // Tracking
  trackingId: string | null,      // Deeplink tracking ID

  // Timestamp
  timestamp: Timestamp,           // Event time

  // Metadata (varies by event type)
  metadata: {
    // For "purchase" events:
    amount?: number,              // Purchase amount ($)
    productIdentifier?: string,   // Product ID (e.g., "com.bohoapp.premium.monthly")
    packageType?: string,         // "weekly" | "monthly" | "annual"

    // For "analysis" events:
    analysisType?: string,        // "outfit_analysis" | "outfit_try_on"
  }
}
```

**Indexes:**
- `referrerId` (ASC) + `timestamp` (DESC)
- `referrerId` (ASC) + `eventType` (ASC) + `timestamp` (DESC)

**Rules:**
- Read: Authenticated users
- Write: System only (Cloud Functions/Admin SDK)

**Example - Purchase Event:**
```json
{
  "eventId": "auto_generated_id",
  "eventType": "purchase",
  "referrerId": "omer",
  "referredUserId": "user_ios_1234567890_abc123",
  "platform": "ios",
  "trackingId": "omer_1234567890_xyz789",
  "timestamp": "2026-01-08T10:30:00Z",
  "metadata": {
    "amount": 9.99,
    "productIdentifier": "com.outfit.planner.app.premium.monthly",
    "packageType": "monthly"
  }
}
```

**Example - Analysis Event:**
```json
{
  "eventId": "auto_generated_id",
  "eventType": "analysis",
  "referrerId": "omer",
  "referredUserId": "user_android_1234567890_abc123",
  "platform": "android",
  "trackingId": "omer_1234567890_xyz789",
  "timestamp": "2026-01-08T11:15:00Z",
  "metadata": {
    "analysisType": "outfit_try_on"
  }
}
```

---

### 4. `deeplinkTracking`
Deeplink click tracking (web'den mobil'e geçiş)

**Structure:**
```typescript
{
  trackingId: string,             // Document ID = tracking ID
  referrer: string,               // Referrer username

  // Timestamp
  clickedAt: Timestamp,           // Click time

  // Platform
  platform: string,               // "ios" | "android" | "web"
  userAgent: string,              // Full user agent string

  // Conversion
  converted: boolean,             // Has user installed the app?
  convertedAt: Timestamp | null,  // Conversion time

  // Button tracking
  buttonType: string,             // "download" | "share"

  // Deferred Deep Linking (NEW)
  deviceFingerprint: string,      // Hashed device fingerprint
  screenResolution: string,       // "1080x1920x3"
  timezone: string,               // "America/New_York"
  language: string,               // "en-US"
  devicePlatform: string          // "iPhone" | "Linux armv8l"
}
```

**Indexes:**
- `referrer` (ASC) + `clickedAt` (DESC)
- `referrer` (ASC) + `converted` (ASC) + `clickedAt` (DESC)
- `platform` (ASC) + `converted` (ASC) + `clickedAt` (DESC) ← **NEW for deferred deep linking**

**Rules:**
- Read: Public
- Create: Public (web tracking)
- Update: Public (conversion updates)
- Delete: Not allowed

**Example:**
```json
{
  "trackingId": "omer_1704715200000_abc123xyz",
  "referrer": "omer",
  "clickedAt": "2026-01-08T10:00:00Z",
  "platform": "ios",
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)...",
  "converted": true,
  "convertedAt": "2026-01-08T10:15:00Z",
  "buttonType": "download",
  "deviceFingerprint": "aUlQaG9uZTE0LDEyODB4...",
  "screenResolution": "1170x2532x3",
  "timezone": "America/Los_Angeles",
  "language": "en-US",
  "devicePlatform": "iPhone"
}
```

---

### 5. `analyses`
Outfit analysis results

**Structure:**
```typescript
{
  analysisId: string,             // Auto-generated document ID
  userId: string,                 // Firebase Auth UID

  // Input
  imageUrl: string,               // Original outfit image URL

  // Analysis type
  type: string,                   // "outfit_analysis" | "color_analysis" | "style_analysis"

  // Results
  results: {
    colors: string[],             // Dominant colors
    style: string,                // Style category
    occasion: string,             // Suitable occasions
    season: string,               // Suitable seasons
    recommendations: string[],    // AI recommendations
    confidence: number            // Analysis confidence (0-1)
  },

  // Status
  status: string,                 // "pending" | "processing" | "completed" | "failed"

  // Timestamps
  createdAt: Timestamp,
  completedAt: Timestamp | null
}
```

**Indexes:**
- `userId` (ASC) + `createdAt` (DESC)

**Rules:**
- Read: Owner only
- Create: Authenticated users
- Update: Owner only
- Delete: Owner only

---

### 6. `jobs`
Background job tracking (for async operations)

**Structure:**
```typescript
{
  jobId: string,                  // Auto-generated document ID
  userId: string,                 // Firebase Auth UID
  createdBy: string,              // User who created the job

  // Job details
  type: string,                   // "outfit_analysis" | "outfit_tryon" | "image_processing"
  status: string,                 // "pending" | "processing" | "completed" | "failed"
  progress: number,               // Progress percentage (0-100)

  // Input/Output
  input: {
    imageUrls: string[],
    params: any
  },
  output: {
    resultUrl?: string,
    data?: any,
    error?: string
  },

  // Timestamps
  createdAt: Timestamp,
  startedAt: Timestamp | null,
  completedAt: Timestamp | null
}
```

**Indexes:**
- `userId` (ASC) + `status` (ASC) + `createdAt` (DESC)

**Rules:**
- Read: Owner or creator
- Create: Authenticated users
- Update: Owner or creator
- Delete: Owner or creator

---

### 7. `wardrobes`
User wardrobe items (subcollection under users)

**Path:** `wardrobes/{userId}/items/{itemId}`

**Structure:**
```typescript
{
  itemId: string,                 // Auto-generated document ID
  userId: string,                 // Owner user ID

  // Item details
  name: string,                   // Item name
  category: string,               // "tops" | "bottoms" | "shoes" | "accessories"
  imageUrl: string,               // Item image URL

  // Metadata
  colors: string[],               // Dominant colors
  style: string,                  // Style category
  brand: string | null,           // Brand name

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Rules:**
- Read: Owner only
- Write: Owner only

---

### 8. `userPreferences`
User app preferences

**Structure:**
```typescript
{
  userId: string,                 // Document ID = Firebase Auth UID

  // Style preferences
  stylePreferences: string[],     // Selected style preferences
  favoriteColors: string[],       // Favorite colors
  usageGoals: string[],           // App usage goals

  // Onboarding
  onboardingCompleted: boolean,
  onboardingStep: number,

  // Settings
  notificationsEnabled: boolean,
  analyticsEnabled: boolean,

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Rules:**
- Read: Owner only
- Write: Owner only

---

### 9. `templates`
Pre-defined outfit templates (admin managed)

**Structure:**
```typescript
{
  templateId: string,             // Auto-generated document ID
  name: string,                   // Template name
  description: string,            // Template description

  // Template data
  style: string,                  // Style category
  occasion: string,               // Suitable occasion
  imageUrl: string,               // Template image

  // Status
  active: boolean,                // Is template active?

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Rules:**
- Read: Public
- Write: Admin only

---

## 📊 Collection Size Estimates

| Collection | Est. Documents | Growth Rate | Storage Impact |
|------------|----------------|-------------|----------------|
| users | 10K - 100K | Medium | Low |
| userAnalytics | 1K - 10K | Low | Low |
| referralEvents | 100K - 1M | High | Medium |
| deeplinkTracking | 50K - 500K | High | Medium |
| analyses | 100K - 1M | High | Medium |
| jobs | 10K - 100K | Medium | Low |
| wardrobes | 50K - 500K | Medium | Low |
| userPreferences | 10K - 100K | Low | Low |
| templates | 100 - 1K | Very Low | Very Low |

---

## 🔒 Security Summary

| Collection | Read | Write | Notes |
|------------|------|-------|-------|
| users | Public | Owner | Public read for referral system |
| userAnalytics | Public | System | Dashboard access |
| referralEvents | Auth | System | Only via Cloud Functions |
| deeplinkTracking | Public | Public | Web tracking |
| analyses | Owner | Owner | Private data |
| jobs | Owner | Owner | Private data |
| wardrobes | Owner | Owner | Private data |
| userPreferences | Owner | Owner | Private data |
| templates | Public | Admin | Public templates |

---

## 📈 Indexing Strategy

### Required Indexes (Already Defined)

1. **users:** `referralCode` + `createdAt`
2. **referralEvents:** `referrerId` + `timestamp`
3. **referralEvents:** `referrerId` + `eventType` + `timestamp`
4. **deeplinkTracking:** `referrer` + `clickedAt`
5. **deeplinkTracking:** `referrer` + `converted` + `clickedAt`
6. **deeplinkTracking:** `platform` + `converted` + `clickedAt` ← **NEW**
7. **analyses:** `userId` + `createdAt`
8. **jobs:** `userId` + `status` + `createdAt`

### Auto-Generated Indexes

Firebase will automatically create single-field indexes for:
- All document ID fields
- All timestamp fields used in queries
- All boolean fields used in queries

---

## 🚀 Collection Initialization

Collections are **automatically created** when the first document is written.

### Test Data Creation (Optional)

Eğer test verisi oluşturmak isterseniz:

```javascript
// Firebase Admin SDK ile
const admin = require('firebase-admin');
const db = admin.firestore();

// Test user
await db.collection('users').doc('test_user').set({
  uid: 'test_user',
  email: 'test@bohoapp.com',
  displayName: 'Test User',
  referralCode: 'testuser',
  referredBy: null,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  isPremium: false,
  premiumExpiresAt: null,
  preferences: {
    language: 'en',
    notifications: true,
    theme: 'light'
  }
});

// Test analytics
await db.collection('userAnalytics').doc('testuser').set({
  userId: 'testuser',
  username: 'testuser',
  totalClicks: 0,
  totalInstalls: 0,
  totalOpens: 0,
  totalPurchases: 0,
  totalAnalyses: 0,
  totalRevenue: 0,
  conversionRate: 0,
  firstEventAt: admin.firestore.FieldValue.serverTimestamp(),
  lastEventAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

---

## 🔍 Common Queries

### Get user analytics
```typescript
const analytics = await db.collection('userAnalytics')
  .doc(username)
  .get();
```

### Get user's referral events
```typescript
const events = await db.collection('referralEvents')
  .where('referrerId', '==', username)
  .orderBy('timestamp', 'desc')
  .limit(20)
  .get();
```

### Get recent deeplink clicks for a referrer
```typescript
const clicks = await db.collection('deeplinkTracking')
  .where('referrer', '==', username)
  .orderBy('clickedAt', 'desc')
  .limit(50)
  .get();
```

### Get unconverted clicks for deferred deep linking
```typescript
const clicks = await db.collection('deeplinkTracking')
  .where('platform', '==', 'ios')
  .where('converted', '==', false)
  .orderBy('clickedAt', 'desc')
  .limit(50)
  .get();
```

### Get user's recent analyses
```typescript
const analyses = await db.collection('analyses')
  .where('userId', '==', userId)
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();
```

---

## 💾 Data Retention

### Automatic Cleanup (Recommended)

Firebase'de TTL (Time-To-Live) policies kullanarak eski verileri otomatik temizleyebilirsiniz:

```javascript
// Cloud Function ile eski deeplink tracking verilerini temizle
exports.cleanupOldDeeplinkTracking = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = db.collection('deeplinkTracking')
      .where('clickedAt', '<', thirtyDaysAgo);

    const snapshot = await query.get();
    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} old deeplink tracking records`);
  });
```

---

## 📊 Monitoring

Firebase Console'da şu metrikleri takip edin:

1. **Document Reads/Writes:** Quota limits
2. **Storage Size:** Each collection's size
3. **Index Performance:** Query performance
4. **Security Rules:** Failed access attempts

**Firebase Console URL:**
https://console.firebase.google.com/project/outfit-planner-bf4d8/firestore

---

## ✅ Checklist

Deployment öncesi kontrol listesi:

- [x] `firestore.rules` tanımlandı
- [x] `firestore.indexes.json` tanımlandı
- [x] `storage.rules` tanımlandı
- [x] `firebase.json` oluşturuldu
- [ ] Firebase project ID doğru: `outfit-planner-bf4d8`
- [ ] Firebase CLI authenticated
- [ ] Deploy: `firebase deploy --only firestore`

---

**Son Güncelleme:** 2026-01-08
**Deferred Deep Linking Update:** ✅ Eklendi
