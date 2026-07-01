# 🔔 Bildirim Sistemi - Kurulum ve Test Kılavuzu

Bu dokümantasyon, BOHO uygulamasındaki **hybrid bildirim sistemini** (iOS Expo Push + Android FCM) kurmak ve test etmek için adım adım rehberdir.

---

## 📋 İçindekiler

1. [Sistem Mimarisi](#-sistem-mimarisi)
2. [Firebase Console Ayarları](#-firebase-console-ayarları)
3. [Expo Ayarları](#-expo-ayarları)
4. [Secret Keys Yapılandırması](#-secret-keys-yapılandırması)
5. [Cloud Functions Deploy](#-cloud-functions-deploy)
6. [Firestore Security Rules Deploy](#-firestore-security-rules-deploy)
7. [Client-Side Entegrasyon](#-client-side-entegrasyon)
8. [Test Senaryoları](#-test-senaryoları)
9. [Admin Broadcast Kullanımı](#-admin-broadcast-kullanımı)
10. [Troubleshooting](#-troubleshooting)

---

## 🏗️ Sistem Mimarisi

### Platform-Specific Notification Delivery

```
┌─────────────────────────────────────────────────┐
│          HYBRID NOTIFICATION SYSTEM             │
└─────────────────────────────────────────────────┘

iOS Device                           Android Device
─────────────                        ──────────────

App Launch                           App Launch
  ↓                                    ↓
expo-notifications                   expo-notifications
  ↓                                    ↓
getExpoPushTokenAsync()              getExpoPushTokenAsync()
  ↓                                    ↓
ExponentPushToken[xxx]               FCM Token (via Expo)
  ↓                                    ↓
Firestore:                           Firestore:
  pushToken: "ExponentPush..."         pushToken: "fcm-token..."
  pushTokenType: "expo"                pushTokenType: "fcm"
  pushTokenPlatform: "ios"             pushTokenPlatform: "android"
  language: "tr"                       language: "tr"

───────────── SERVER-SIDE ─────────────

Cloud Function Triggered (AI Analysis / Try-On Complete)
  ↓
notificationService.sendNotificationToUser(userId)
  ↓
Get user push token from Firestore
  ↓
┌─────────────────┴─────────────────┐
│                                   │
iOS Platform                 Android Platform
  ↓                                ↓
sendExpoPushNotification()   sendFCMNotification()
  ↓                                ↓
Expo Push API                Firebase Admin SDK
(https://exp.host/...)       admin.messaging().send()
  ↓                                ↓
APNS (Apple)                 FCM (Google)
  ↓                                ↓
User receives notification   User receives notification
```

### Bildirim Türleri

| Tür | Açıklama | Trigger |
|-----|----------|---------|
| `analysis_complete` | AI analiz tamamlandı | `analyzeOutfit` Cloud Function |
| `tryon_complete` | Virtual try-on hazır | `getPredictionStatus` Cloud Function |
| `wardrobe_added` | Gardıroba kıyafet eklendi | *(İleride eklenebilir)* |
| `broadcast` | Admin toplu bildirim | `sendBroadcast` Cloud Function |
| `system` | Sistem bildirimleri | Manuel API çağrısı |

---

## 🔥 Firebase Console Ayarları

### 1. Firebase Cloud Messaging (FCM) Aktifleştirme

#### Android için FCM Setup

1. **Firebase Console'a git**: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Projenizi seçin: `BOHO` (veya proje adınız)
3. Sol menüden **Build → Cloud Messaging** seçin
4. **Android App** kısmında:
   - Package name kontrol edin: `com.outfit.planner.app`
   - `google-services.json` dosyasını indirin
   - Dosyayı projenize ekleyin (aşağıda detay)

#### iOS için APNS Setup

1. Firebase Console'da **Project Settings → Cloud Messaging**
2. **iOS app configuration** bölümüne gidin
3. **APNs Authentication Key** yükleyin:
   - Apple Developer Account'a giriş yapın
   - Certificates, Identifiers & Profiles → Keys
   - Yeni key oluşturun (Apple Push Notifications service enabled)
   - `.p8` dosyasını indirin
   - Firebase Console'a yükleyin
   - Key ID ve Team ID'yi girin

### 2. Firebase Admin SDK Service Account

1. Firebase Console → **Project Settings → Service Accounts**
2. **Generate New Private Key** butonuna tıklayın
3. JSON dosyasını indirin (GÜVENLİ tutun!)
4. Bu dosya Cloud Functions'ın Firebase Admin SDK için gerekli

---

## 📱 Expo Ayarları

### 1. `google-services.json` Ekleme (Android için)

```bash
# Firebase Console'dan indirdiğiniz google-services.json dosyasını projeye ekleyin
mv ~/Downloads/google-services.json /Users/omerercan/Documents/GitHub/dress-identifier/dress-identifer/
```

### 2. `app.json` Güncellemesi

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.outfit.planner.app"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#6366F1",
          "sounds": ["./assets/notification.wav"],
          "mode": "production"
        }
      ]
    ]
  }
}
```

### 3. iOS için `GoogleService-Info.plist` (Opsiyonel)

Eğer iOS için manuel APNS yapılandırması yapıyorsanız:

```bash
# Firebase Console'dan indirdiğiniz GoogleService-Info.plist dosyasını ekleyin
mv ~/Downloads/GoogleService-Info.plist /Users/omerercan/Documents/GitHub/dress-identifier/dress-identifer/
```

`app.json`:
```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.outfit.planner.app"
    }
  }
}
```

---

## 🔐 Secret Keys Yapılandırması

Firebase Cloud Functions, API key'leri güvenli bir şekilde saklamak için **Secret Manager** kullanır.

### 1. Secret Keys Oluşturma

```bash
# OPENAI_API_KEY (zaten var)
firebase functions:secrets:set OPENAI_API_KEY
# Prompt: OpenAI API key'inizi girin

# EACHLABS_API_KEY (zaten var)
firebase functions:secrets:set EACHLABS_API_KEY
# Prompt: EachLabs API key'inizi girin

# ADMIN_SECRET_KEY (YENİ - broadcast için)
firebase functions:secrets:set ADMIN_SECRET_KEY
# Prompt: Güçlü bir secret key oluşturun (örn: mytree-admin-2024-super-secure-key)
```

### 2. Secrets'ı Doğrulama

```bash
# Tüm secret'ları listele
firebase functions:secrets:access

# Belirli bir secret'ı görüntüle
firebase functions:secrets:access ADMIN_SECRET_KEY
```

---

## ☁️ Cloud Functions Deploy

### 1. Build Kontrolü

```bash
cd /Users/omerercan/Documents/GitHub/dress-identifier/dress-identifer/functions
npm run build
```

Hata yoksa devam edin.

### 2. Deploy

```bash
# Sadece functions deploy et
npm run deploy

# Veya Firebase CLI ile
firebase deploy --only functions
```

### 3. Deploy Edilen Functions Listesi

```bash
firebase functions:list
```

Şu fonksiyonlar görünmeli:
- ✅ `analyzeOutfit` - AI analizi + bildirim
- ✅ `tryOutfit` - Virtual try-on başlat
- ✅ `getPredictionStatus` - Try-on durumu + bildirim
- ✅ `sendBroadcast` - Admin broadcast (tek dil)
- ✅ `sendLocalizedBroadcastNotification` - Admin broadcast (çok dilli)

---

## 🛡️ Firestore Security Rules Deploy

### 1. Rules Dosyasını Kontrol Et

```bash
cd /Users/omerercan/Documents/GitHub/dress-identifier/dress-identifer
cat firestore.rules
```

### 2. Deploy

```bash
firebase deploy --only firestore:rules
```

### 3. Doğrulama

Firebase Console → **Firestore Database → Rules** sekmesine gidin ve yeni kuralları görün.

---

## 📲 Client-Side Entegrasyon

### 1. AuthContext'te Token Kaydetme

`/contexts/AuthContext.tsx` dosyasında, kullanıcı giriş yaptıktan sonra push token'ı kaydedin:

```typescript
import { notificationService } from '../services/notifications';

// AuthProvider içinde
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      // ... mevcut user setup kodu

      // Push token kaydet
      await notificationService.initialize();
      const token = await notificationService.registerForPushNotifications();

      if (token && firebaseUser.uid) {
        const language = user?.preferences?.language || 'tr';
        await notificationService.savePushTokenToFirebase(firebaseUser.uid, language);
      }
    }
  });

  return unsubscribe;
}, []);
```

### 2. App.tsx veya _layout.tsx'de Notification Listeners

```typescript
import { notificationService } from './services/notifications';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Initialize notifications
    notificationService.initialize();

    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      if (data.type === 'analysis_complete' && data.analysisId) {
        router.push(`/analysis-result?id=${data.analysisId}`);
      } else if (data.type === 'tryon_complete' && data.predictionId) {
        router.push(`/outfit-try-result?id=${data.predictionId}`);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    // ... layout
  );
}
```

### 3. Language Tracking

Kullanıcının dil tercihi değiştiğinde push token'ı güncelleyin:

```typescript
// Dil değiştiğinde
const handleLanguageChange = async (newLanguage: 'tr' | 'en') => {
  // ... mevcut dil güncelleme kodu

  // Push token language'ini güncelle
  if (user?.uid) {
    await notificationService.savePushTokenToFirebase(user.uid, newLanguage);
  }
};
```

---

## 🧪 Test Senaryoları

### Test 1: AI Analiz Bildirimi

**Amaç**: Kullanıcı bir kıyafet analizi yaptığında bildirim alsın.

#### Adımlar:

1. **Uygulamayı aç** (iOS veya Android cihazda)
2. **Home ekranından** "Kıyafetimi Analiz Et" butonuna tıkla
3. **Bir fotoğraf seç** ve analiz başlat
4. **Analyzing ekranını bekle** (GPT-4o işlemi yapıyor)
5. **Bildirim kontrolü**:
   - Uygulama background'daysa → OS bildirimi gelir
   - Uygulama foreground'daysa → Local bildirim görünür
6. **Bildirimi tıkla** → Analysis result sayfasına yönlendir

#### Beklenen Bildirim:

**Türkçe**:
```
Başlık: ✨ Analiz Tamamlandı
Mesaj: Kombinin 8.5/10 puan aldı! 🎉
```

**İngilizce**:
```
Title: ✨ Analysis Complete
Message: Your outfit scored 8.5/10! 🎉
```

#### Debug:

```bash
# Cloud Functions logs
firebase functions:log --only analyzeOutfit

# Son 50 log satırı
firebase functions:log --limit 50
```

---

### Test 2: Virtual Try-On Bildirimi

**Amaç**: Kullanıcı kıyafet deneme yaptığında işlem tamamlandığında bildirim alsın.

#### Adımlar:

1. **Home ekranından** "Kıyafeti Dene" butonuna tıkla
2. **1 kullanıcı fotoğrafı** + **1-10 kıyafet fotoğrafı** seç
3. **Processing ekranını bekle** (EachLabs işlemi yapıyor, 30-60 saniye sürebilir)
4. **Background'a geç** (home button veya app switcher)
5. **Bildirim gelir**: "👔 Sanal Deneme Hazır"
6. **Bildirimi tıkla** → Try-on result sayfasına yönlendir

#### Beklenen Bildirim:

**Türkçe**:
```
Başlık: 👔 Sanal Deneme Hazır
Mesaj: Kıyafet deneme işleminiz tamamlandı! Sonucu görmek için tıklayın.
```

**İngilizce**:
```
Title: 👔 Virtual Try-On Ready
Message: Your try-on is complete! Tap to see the result.
```

#### Debug:

```bash
# Prediction status logs
firebase functions:log --only getPredictionStatus
```

---

### Test 3: Platform-Specific Token Detection

**Amaç**: iOS ve Android'in farklı token türlerini kullandığını doğrula.

#### iOS Test:

1. **iOS cihazda uygulamayı aç**
2. **Console logs**:
   ```
   [NotificationService] Push token registered
   [NotificationService] Platform: ios
   [NotificationService] Token type: expo
   [NotificationService] Token: ExponentPushToken[xxxxxx]
   ```
3. **Firestore'da kontrol**:
   ```
   users/{userId}:
     pushToken: "ExponentPushToken[...]"
     pushTokenType: "expo"
     pushTokenPlatform: "ios"
   ```

#### Android Test:

1. **Android cihazda uygulamayı aç**
2. **Console logs**:
   ```
   [NotificationService] Push token registered
   [NotificationService] Platform: android
   [NotificationService] Token type: fcm
   [NotificationService] Token: [FCM TOKEN STRING]
   ```
3. **Firestore'da kontrol**:
   ```
   users/{userId}:
     pushToken: "[FCM TOKEN]"
     pushTokenType: "fcm"
     pushTokenPlatform: "android"
   ```

---

## 🎯 Admin Broadcast Kullanımı

### 1. Basit Broadcast (Tek Dil)

Tüm kullanıcılara aynı mesajı gönderin (dil filtresi opsiyonel).

#### API Çağrısı (Postman / cURL):

```bash
# Tüm kullanıcılara (dil fark etmeksizin)
curl -X POST https://europe-west1-[PROJECT-ID].cloudfunctions.net/sendBroadcast \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "your-admin-secret-key-here",
    "title": "Yeni Özellik! 🎉",
    "body": "Sanal deneme özelliğimizi keşfedin!",
    "data": {
      "action": "open_app",
      "screen": "home"
    }
  }'
```

#### Sadece Türkçe Kullanıcılara:

```bash
curl -X POST https://europe-west1-[PROJECT-ID].cloudfunctions.net/sendBroadcast \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "your-admin-secret-key-here",
    "title": "İndirim Kampanyası! 💰",
    "body": "Premium üyeliğe %50 indirim!",
    "language": "tr",
    "data": {
      "action": "open_paywall"
    }
  }'
```

#### Response:

```json
{
  "success": true,
  "sent": 1234,
  "failed": 12,
  "total": 1246
}
```

---

### 2. Localized Broadcast (Çok Dilli)

Her kullanıcı kendi dilinde bildirim alır.

#### API Çağrısı:

```bash
curl -X POST https://europe-west1-[PROJECT-ID].cloudfunctions.net/sendLocalizedBroadcastNotification \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "your-admin-secret-key-here",
    "messages": {
      "tr": {
        "title": "Yeni Güncelleme 🚀",
        "body": "Uygulamanızı güncelleyin ve yeni özellikleri keşfedin!"
      },
      "en": {
        "title": "New Update 🚀",
        "body": "Update your app to discover new features!"
      }
    },
    "data": {
      "action": "check_update",
      "version": "2.0.0"
    }
  }'
```

#### Response:

```json
{
  "success": true,
  "sent": 2453,
  "failed": 34,
  "total": 2487
}
```

---

### 3. Firebase Console'dan Test

Firebase Console → **Cloud Messaging** → **Send your first message**:

1. **Notification title**: Test Bildirimi
2. **Notification text**: Bu bir test mesajıdır
3. **Target**: Select topic → *(Topic yoksa "all" oluşturun)*
4. **Send test message**: Cihazınızın FCM token'ını girin

---

## 🚨 Troubleshooting

### Problem 1: iOS'ta Bildirim Gelmiyor

**Sebep**: APNS certificate eksik veya hatalı

**Çözüm**:
1. Firebase Console → Project Settings → Cloud Messaging
2. iOS APNS Authentication Key doğru yüklenmiş mi kontrol edin
3. Key ID ve Team ID doğru mu?
4. Bundle ID doğru mu: `com.outfit.planner.app`

---

### Problem 2: Android'de Bildirim Gelmiyor

**Sebep**: `google-services.json` eksik veya hatalı

**Çözüm**:
1. Firebase Console'dan güncel `google-services.json` indirin
2. Proje root'una koyun
3. `app.json` içinde `android.googleServicesFile` ayarlandı mı?
4. Uygulamayı yeniden build edin:
   ```bash
   eas build --platform android --profile development
   ```

---

### Problem 3: "Permission Denied" Hatası

**Sebep**: Admin secret key yanlış

**Çözüm**:
```bash
# Secret'ı kontrol edin
firebase functions:secrets:access ADMIN_SECRET_KEY

# Eğer yanlışsa yeniden ayarlayın
firebase functions:secrets:set ADMIN_SECRET_KEY

# Functions'ı yeniden deploy edin
firebase deploy --only functions
```

---

### Problem 4: Bildirimler Çok Geç Geliyor

**Sebep**: Expo Push Service gecikme yapıyor

**Çözüm**:
1. **Android için**: FCM direkt kullanıldığı için hızlı olmalı
2. **iOS için**: Expo Push Service'in limitleri var
   - Production build kullanın (development değil)
   - APNS certificate doğru yapılandırın
3. **Rate limiting**: Cloud Functions'da 100 user/batch var, artırabilirsiniz:
   ```typescript
   // notificationService.ts, sendBroadcastNotification()
   const batchSize = 200; // 100'den 200'e çıkar
   ```

---

### Problem 5: Token Kayboldu

**Sebep**: App reinstall veya token expiry

**Çözüm**:
1. Her app launch'ta token'ı kontrol edin
2. Değişmişse Firestore'u güncelleyin:
   ```typescript
   // AuthContext'te her seferinde check et
   useEffect(() => {
     const checkToken = async () => {
       const storedToken = await AsyncStorage.getItem('@styleai_push_token');
       const currentToken = await notificationService.registerForPushNotifications();

       if (storedToken !== currentToken && user?.uid) {
         await notificationService.savePushTokenToFirebase(user.uid);
       }
     };

     checkToken();
   }, [user]);
   ```

---

## 📊 Monitoring & Analytics

### Firebase Console Monitoring

1. **Cloud Functions Logs**:
   - Firebase Console → Functions → Logs
   - Filter: `sendNotificationToUser`, `Notification sent`, `Expo Push`, `FCM`

2. **Cloud Messaging Stats**:
   - Firebase Console → Cloud Messaging → Reports
   - Delivery rate, open rate, vs.

### Custom Analytics

Firestore'a notification analytics collection ekleyin:

```typescript
// notificationService.ts içinde
await admin.firestore().collection('notification_analytics').add({
  userId,
  type,
  platform: tokenInfo.platform,
  tokenType: tokenInfo.type,
  success,
  sentAt: admin.firestore.Timestamp.now(),
});
```

---

## ✅ Setup Checklist

Deploy etmeden önce bu listeyi kontrol edin:

- [ ] Firebase Console'da FCM aktif
- [ ] APNS certificate yüklendi (iOS için)
- [ ] `google-services.json` proje root'unda (Android için)
- [ ] `app.json` içinde `googleServicesFile` ayarları yapıldı
- [ ] Firebase secrets ayarlandı: `OPENAI_API_KEY`, `EACHLABS_API_KEY`, `ADMIN_SECRET_KEY`
- [ ] Cloud Functions build başarılı: `npm run build`
- [ ] Cloud Functions deploy edildi: `firebase deploy --only functions`
- [ ] Firestore rules deploy edildi: `firebase deploy --only firestore:rules`
- [ ] Client-side notification service initialize ediliyor (AuthContext)
- [ ] iOS cihazda test edildi
- [ ] Android cihazda test edildi
- [ ] Admin broadcast test edildi
- [ ] Logs kontrol edildi, hata yok

---

## 🎉 Sonuç

Bu sistem artık tamamen operasyonel! Kullanıcılarınız:

✅ **AI analizi tamamlandığında** bildirim alacak
✅ **Virtual try-on hazır olduğunda** bildirim alacak
✅ **iOS'ta Expo Push** ile bildirim alacak
✅ **Android'de FCM** ile bildirim alacak
✅ **Kendi dillerinde** bildirim görecekler
✅ **Admin broadcast** ile toplu bildirim alabilecekler

Herhangi bir sorun yaşarsanız, **Troubleshooting** bölümüne bakın veya Firebase Functions logs'ları inceleyin.

---

**Hazırlayan**: Claude Code
**Tarih**: 2026-01-07
**Versiyon**: 1.0
