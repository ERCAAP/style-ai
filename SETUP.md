# StyleAI - iOS & Android Kurulum Rehberi

Bu rehber, StyleAI uygulamasını iOS ve Android platformlarına nasıl kuracağınızı adım adım açıklar.

## Gereksinimler

### Genel
- Node.js 18+
- npm veya yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Expo hesabı (https://expo.dev)

### iOS için
- macOS işletim sistemi
- Xcode 15+
- Apple Developer hesabı ($99/yıl)
- CocoaPods (`sudo gem install cocoapods`)

### Android için
- Android Studio
- Java Development Kit (JDK) 17
- Android SDK (API 34)
- Google Play Console hesabı ($25 tek seferlik)

---

## 1. Proje Kurulumu

```bash
# Projeyi klonla
git clone <repo-url>
cd dress-identifer

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
```

## 2. Environment Variables

`.env` dosyasını aşağıdaki değerlerle doldurun:

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

---

## 3. Firebase Kurulumu

### 3.1 Firebase Console
1. https://console.firebase.google.com adresine gidin
2. Yeni proje oluşturun: "StyleAI"
3. Analytics'i etkinleştirin (opsiyonel)

### 3.2 iOS Uygulaması Ekleme
1. Project Settings > General > "Add app" > iOS
2. Bundle ID: `com.outfit.planner.app`
3. `GoogleService-Info.plist` dosyasını indirin
4. Dosyayı projenin kök dizinine koyun

### 3.3 Android Uygulaması Ekleme
1. Project Settings > General > "Add app" > Android
2. Package name: `com.outfit.planner.app`
3. SHA-1 (opsiyonel, Google Sign-In için)
4. `google-services.json` dosyasını indirin
5. Dosyayı projenin kök dizinine koyun

### 3.4 Firebase Servisleri
Aşağıdaki servisleri etkinleştirin:
- **Authentication**: Anonymous sign-in
- **Firestore Database**: Production mode
- **Storage**: Production mode

### 3.5 Firestore Kuralları
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Jobs collection
    match /jobs/{jobId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Templates collection (public read)
    match /templates/{templateId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### 3.6 Storage Kuralları
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 4. EAS Build Kurulumu

### 4.1 EAS'a Giriş
```bash
eas login
```

### 4.2 Proje Yapılandırması
```bash
eas build:configure
```

### 4.3 app.json'da Project ID Güncelleme
`app.json` dosyasındaki `extra.eas.projectId` değerini güncelleyin:
```json
"extra": {
  "eas": {
    "projectId": "your-actual-project-id"
  }
}
```

---

## 5. iOS Build

### 5.1 Apple Developer Hesabı Ayarları
1. https://developer.apple.com adresine gidin
2. Certificates, Identifiers & Profiles > Identifiers
3. Yeni App ID oluşturun: `com.outfit.planner.app`
4. Push Notifications capability ekleyin

### 5.2 Development Build
```bash
# Simulator için
npm run build:dev:ios

# Gerçek cihaz için
eas build --profile development --platform ios
```

### 5.3 Production Build
```bash
eas build --profile production --platform ios
```

### 5.4 App Store'a Gönderme
```bash
eas submit --platform ios
```

### 5.5 App Store Connect Ayarları
1. https://appstoreconnect.apple.com
2. Yeni uygulama oluşturun
3. Bundle ID: `com.outfit.planner.app`
4. Uygulama bilgilerini doldurun
5. Screenshots ekleyin
6. Review'a gönderin

---

## 6. Android Build

### 6.1 Keystore Oluşturma (İlk kez)
EAS otomatik olarak keystore oluşturur. Manuel oluşturmak için:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
```

### 6.2 Development Build
```bash
# APK olarak
npm run build:dev:android

# Development client
eas build --profile development --platform android
```

### 6.3 Production Build
```bash
eas build --profile production --platform android
```

### 6.4 Google Play'e Gönderme

#### Service Account Oluşturma
1. Google Cloud Console > IAM & Admin > Service Accounts
2. Yeni service account oluşturun
3. JSON key indirin
4. `google-play-service-account.json` olarak kaydedin

#### Play Console Ayarları
1. https://play.google.com/console
2. Yeni uygulama oluşturun
3. Service account'a erişim verin
4. Internal testing track'e yükleyin

```bash
eas submit --platform android
```

---

## 7. Push Notifications

### 7.1 iOS (APNs)
1. Apple Developer > Certificates > Create Certificate
2. APNs Key oluşturun
3. Key ID ve Team ID'yi not edin
4. `.p8` dosyasını indirin

EAS'a yükleyin:
```bash
eas credentials
# iOS > Push Notifications > Upload
```

### 7.2 Android (FCM)
1. Firebase Console > Project Settings > Cloud Messaging
2. "Manage Service Accounts" tıklayın
3. Service account JSON'ı indirin
4. `eas.json`'daki `googleServicesFile` yolunu güncelleyin

---

## 8. Test Etme

### Development Server
```bash
npm start
```

### iOS Simulator
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

### Gerçek Cihazda Test
```bash
# Development build yükledikten sonra
expo start --dev-client
```

---

## 9. Sorun Giderme

### iOS Build Hataları

**CocoaPods hatası:**
```bash
cd ios && pod install --repo-update
```

**Signing hatası:**
```bash
eas credentials --platform ios
```

### Android Build Hataları

**Gradle hatası:**
```bash
cd android && ./gradlew clean
```

**SDK hatası:**
Android Studio > SDK Manager > SDK 34 yükleyin

### Genel Hatalar

**Metro bundler hatası:**
```bash
npx expo start --clear
```

**Node modules hatası:**
```bash
rm -rf node_modules
npm install
```

---

## 10. Deployment Checklist

### iOS
- [ ] Bundle ID doğru: `com.outfit.planner.app`
- [ ] App Store Connect'te uygulama oluşturuldu
- [ ] Push notification certificate yüklendi
- [ ] Privacy Policy URL eklendi
- [ ] Screenshots hazırlandı (6.5", 5.5")
- [ ] App Review Guidelines kontrol edildi

### Android
- [ ] Package name doğru: `com.outfit.planner.app`
- [ ] Google Play Console'da uygulama oluşturuldu
- [ ] google-services.json eklendi
- [ ] Privacy Policy URL eklendi
- [ ] Screenshots hazırlandı
- [ ] Content rating tamamlandı
- [ ] Data safety form dolduruldu

---

## Komut Referansı

| Komut | Açıklama |
|-------|----------|
| `npm start` | Development server başlat |
| `npm run ios` | iOS simulator'da çalıştır |
| `npm run android` | Android emulator'da çalıştır |
| `npm run build:dev` | Development build (tüm platformlar) |
| `npm run build:preview` | Preview build (internal test) |
| `npm run build:prod` | Production build |
| `npm run submit:ios` | App Store'a gönder |
| `npm run submit:android` | Google Play'e gönder |
| `npm run prebuild` | Native projeleri oluştur |
| `npm run prebuild:clean` | Native projeleri temizle ve oluştur |

---

## Destek

Sorularınız için:
- Email: destek@styleai.com
- GitHub Issues: [repo-issues-url]
