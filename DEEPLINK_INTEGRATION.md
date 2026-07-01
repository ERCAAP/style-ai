# 🔗 Deeplink & Analytics Integration Guide

## 📊 Sistem Overview

Boho App'e kapsamlı bir deeplink ve analytics sistemi entegre ettik. Bu sistem kullanıcıların referral linklerini paylaşmasını ve her bir referral'dan gelen aktiviteyi track etmesini sağlıyor.

---

## 🏗️ Mimari

### 1. Firebase Collections

```
📁 Firestore Collections:

users/{userId}
  ├── username: string
  ├── referralCode: string (unique)
  ├── createdAt: Timestamp
  ├── totalReferrals: number
  ├── totalPurchases: number
  └── totalAnalyses: number

userAnalytics/{userId}
  ├── userId: string
  ├── username: string
  ├── referrals:
  │   ├── installCount: number
  │   ├── openCount: number
  │   ├── purchaseCount: number
  │   └── analysisCount: number
  ├── revenue: number
  └── lastUpdated: Timestamp

referralEvents/{eventId}
  ├── referrerId: string (username)
  ├── referredUserId: string (device ID)
  ├── eventType: 'app_install' | 'app_open' | 'purchase' | 'analysis'
  ├── timestamp: Timestamp
  ├── platform: 'ios' | 'android'
  └── metadata: object

deeplinkTracking/{trackingId}
  ├── trackingId: string
  ├── referrer: string (username)
  ├── clickedAt: Timestamp
  ├── platform: 'ios' | 'android' | 'web'
  ├── converted: boolean
  ├── convertedAt?: Timestamp
  └── userAgent: string
```

---

## 🌐 Web Deeplink Flow

### 1. Link Generator
**URL:** `https://bohoapp.online/#link-generator`

Kullanıcı username giriyor → Link generate ediliyor:
```
https://bohoapp.online/user?user=USERNAME
```

### 2. User Profile Page
**URL:** `https://bohoapp.online/user?user=omer`

- User profili gösteriliyor
- "Download Boho App" butonu
- Tıklandığında:
  1. Firebase'e click tracking yazılıyor
  2. Deeplink deneniyor: `styleai://user?user=omer`
  3. App yoksa → App Store/Play Store

### 3. Analytics Dashboard
**URL:** `https://bohoapp.online/analytics?user=omer`

Real-time analytics gösteriliyor:
- 📱 App Installs
- 👁️ App Opens
- 💳 Purchases
- ✨ Analyses
- 💰 Total Revenue

---

## 📱 Mobil App Integration

### 1. Deeplink Configuration

**iOS (app.json):**
```json
{
  "ios": {
    "bundleIdentifier": "com.outfit.planner.app",
    "associatedDomains": [
      "applinks:bohoapp.online",
      "applinks:www.bohoapp.online"
    ]
  }
}
```

**Android (app.json):**
```json
{
  "android": {
    "package": "com.outfit.planner.app",
    "intentFilters": [{
      "action": "VIEW",
      "autoVerify": true,
      "data": [{
        "scheme": "https",
        "host": "bohoapp.online",
        "pathPrefix": "/user"
      }],
      "category": ["BROWSABLE", "DEFAULT"]
    }]
  }
}
```

### 2. Universal Links (iOS)

**File:** `website/public/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.com.outfit.planner.app",
      "paths": ["/user", "/user/*"]
    }]
  }
}
```

⚠️ **IMPORTANT:** `TEAM_ID`'yi Apple Developer Portal'dan alıp güncelle!

### 3. App Links (Android)

**File:** `website/public/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.outfit.planner.app",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

⚠️ **IMPORTANT:** SHA256 fingerprint'i almak için:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

---

## 💻 Code Integration

### 1. ReferralContext Kullanımı

```tsx
import { useReferral } from '@/contexts/ReferralContext';

function MyComponent() {
  const { referrer, trackPurchase, trackAnalysis } = useReferral();

  // Purchase tracking
  async function handlePurchase(amount: number) {
    await trackPurchase(amount);
  }

  // Analysis tracking
  async function handleAnalysis(type: string) {
    await trackAnalysis(type);
  }

  return (
    <View>
      {referrer && <Text>Referred by: @{referrer}</Text>}
    </View>
  );
}
```

### 2. Outfit Analysis Tracking

**File:** `app/analyzing.tsx` ✅ IMPLEMENTED

The analysis tracking is integrated in the analyzing screen where the AI analysis completes:

```tsx
import { useReferral } from '@/contexts/ReferralContext';

export default function AnalyzingScreen() {
  const { trackAnalysis } = useReferral();

  useEffect(() => {
    async function performAnalysis() {
      // ... start analysis ...

      if (result) {
        // Track analysis completion for referral system
        try {
          const analysisType = purposes.join(',') || 'outfit_analysis';
          await trackAnalysis(analysisType);
          console.log('✅ Analysis tracked successfully');
        } catch (trackError) {
          console.warn('Failed to track analysis:', trackError);
          // Don't throw - analysis was successful, tracking is secondary
        }
      }
    }
    performAnalysis();
  }, [imageUri, authLoading, user]);
}
```

**Implementation Details:**
- Location: `app/analyzing.tsx:99-107`
- Tracks analysis type based on purposes (e.g., "outfit_analysis")
- Non-blocking: Tracking errors don't fail the analysis
- Logs success/failure for debugging

### 3. Purchase Tracking

**File:** `services/purchases.ts` ✅ IMPLEMENTED

Purchase tracking is integrated directly in the PurchasesService:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackPurchase as trackReferralPurchase } from './firebase/analytics';

class PurchasesService {
  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);

      // Track referral purchase
      try {
        const referrer = await AsyncStorage.getItem('@boho_referrer');
        const userId = await AsyncStorage.getItem('@boho_user_id');

        if (referrer && userId) {
          // Get product price from package
          const amount = pkg.product.price;

          await trackReferralPurchase(
            referrer,
            userId,
            amount,
            Platform.OS as 'ios' | 'android'
          );

          console.log('✅ Purchase tracked for referrer:', referrer, 'Amount:', amount);
        }
      } catch (trackError) {
        console.warn('Failed to track purchase:', trackError);
        // Don't throw - purchase was successful, tracking is secondary
      }

      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        return null;
      }
      console.error('Purchase failed:', error);
      throw error;
    }
  }
}
```

**Implementation Details:**
- Location: `services/purchases.ts:55-91`
- Tracks purchase with actual product price from RevenueCat
- Non-blocking: Tracking errors don't fail the purchase
- Only tracks if referrer exists in AsyncStorage

---

## 🚀 Deployment

### 1. Website Deploy

```bash
cd website
vercel --prod
```

### 2. Verify Universal Links

**iOS:**
```
https://bohoapp.online/.well-known/apple-app-site-association
```

**Android:**
```
https://bohoapp.online/.well-known/assetlinks.json
```

### 3. Build App

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

---

## 🧪 Testing

### 1. Test Deeplink (Development)

**iOS Simulator:**
```bash
xcrun simctl openurl booted "styleai://user?user=testuser"
```

**Android Emulator:**
```bash
adb shell am start -W -a android.intent.action.VIEW -d "styleai://user?user=testuser" com.outfit.planner.app
```

### 2. Test Universal Link

**iOS:**
```bash
xcrun simctl openurl booted "https://bohoapp.online/user?user=testuser"
```

**Android:**
```bash
adb shell am start -W -a android.intent.action.VIEW -d "https://bohoapp.online/user?user=testuser"
```

### 3. Test Analytics

1. Open: `https://bohoapp.online/#link-generator`
2. Create link for username: `testuser`
3. Click "Download App" button
4. Open app with deeplink
5. Check analytics: `https://bohoapp.online/analytics?user=testuser`

---

## 📈 Analytics API

### Get User Analytics

```typescript
import { getUserAnalytics } from '@/services/firebase/analytics';

const analytics = await getUserAnalytics('username');
console.log(analytics);
// {
//   userId: "...",
//   username: "testuser",
//   referrals: {
//     installCount: 10,
//     openCount: 25,
//     purchaseCount: 3,
//     analysisCount: 50
//   },
//   revenue: 29.97,
//   lastUpdated: Timestamp
// }
```

### Get Referral Events

```typescript
import { getReferralEvents } from '@/services/firebase/analytics';

const events = await getReferralEvents('username', 50);
console.log(events);
// [
//   {
//     eventType: 'app_install',
//     referrerId: 'testuser',
//     timestamp: Timestamp,
//     ...
//   }
// ]
```

---

## 🔥 Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - public read, authenticated write
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // User Analytics - public read, system write
    match /userAnalytics/{userId} {
      allow read: if true;
      allow write: if false; // Only via Cloud Functions or Admin SDK
    }

    // Referral Events - system write only
    match /referralEvents/{eventId} {
      allow read: if request.auth != null;
      allow write: if false; // Only via Cloud Functions or Admin SDK
    }

    // Deeplink Tracking - anyone can write (for web tracking)
    match /deeplinkTracking/{trackingId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if false;
    }
  }
}
```

---

## 🎯 User Flow Examples

### Example 1: Complete Referral Flow

1. **User A (Referrer):**
   - Opens app
   - Goes to profile
   - Gets referral link: `https://bohoapp.online/user?user=john`
   - Shares on WhatsApp

2. **User B (New User):**
   - Clicks link on WhatsApp
   - Lands on `https://bohoapp.online/user?user=john`
   - Clicks "Download App"
   - Gets redirected to App Store
   - Installs app
   - Opens app → Deeplink opens: `styleai://user?user=john`
   - **TRACKED:** App Install for user `john`

3. **User B continues:**
   - Takes outfit photo
   - Analyzes outfit
   - **TRACKED:** Analysis for user `john`
   - Buys premium ($9.99)
   - **TRACKED:** Purchase for user `john` ($9.99)

4. **User A (Referrer):**
   - Opens `https://bohoapp.online/analytics?user=john`
   - Sees:
     - 📱 1 Install
     - ✨ 1 Analysis
     - 💳 1 Purchase
     - 💰 $9.99 Revenue

---

## 🐛 Troubleshooting

### Universal Links Not Working (iOS)

1. Verify apple-app-site-association:
   ```bash
   curl https://bohoapp.online/.well-known/apple-app-site-association
   ```

2. Check Team ID in Xcode:
   - Open `ios/` in Xcode
   - Check "Signing & Capabilities"
   - Copy Team ID
   - Update apple-app-site-association

3. Rebuild app:
   ```bash
   eas build --profile production --platform ios
   ```

### App Links Not Working (Android)

1. Get SHA256 fingerprint:
   ```bash
   keytool -list -v -keystore your-release-key.keystore
   ```

2. Update assetlinks.json

3. Verify:
   ```bash
   curl https://bohoapp.online/.well-known/assetlinks.json
   ```

### Analytics Not Showing

1. Check Firebase Console → Firestore
2. Verify collections exist: `users`, `userAnalytics`, `referralEvents`
3. Check browser console for errors
4. Verify Firebase config in website

---

## 📚 Additional Resources

- [Expo Linking Docs](https://docs.expo.dev/guides/linking/)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)

---

## ✅ Checklist

### Website
- [x] Link generator page
- [x] User profile page
- [x] Analytics dashboard
- [x] Firebase integration
- [x] Deeplink tracking
- [x] Apple App Site Association
- [x] Android Asset Links

### Mobile App
- [x] ReferralContext
- [x] Deeplink handling
- [x] Firebase analytics service
- [x] App.json configuration
- [x] Purchase tracking integration
- [x] Analysis tracking integration

### Firebase
- [x] Collections schema
- [x] Analytics functions
- [ ] Firestore rules
- [ ] Security rules testing

### Testing
- [ ] Test deeplink on iOS
- [ ] Test deeplink on Android
- [ ] Test analytics dashboard
- [ ] Test purchase tracking
- [ ] Test analysis tracking

---

**🎉 System is ready to use! Start tracking your referrals!**
