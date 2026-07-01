# 🤖 Android SHA256 Certificate Fingerprint Nasıl Alınır

Android App Links için SHA256 certificate fingerprint'inize ihtiyacınız var.

## Yöntem 1: Debug Keystore (Development)

Development için debug keystore'un fingerprint'ini alın:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Sonuç örneği:**
```
Certificate fingerprints:
         SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
         SHA256: 11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00
```

SHA256 değerini kopyalayın (tüm `:` karakterleriyle birlikte).

## Yöntem 2: Release Keystore (Production)

Production build için release keystore'u kullanın:

```bash
keytool -list -v -keystore /path/to/your-release-key.keystore
```

Şifrenizi girmeniz istenecek. Sonra SHA256 değerini kopyalayın.

## Yöntem 3: Google Play Console

Eğer uygulamanız zaten Google Play'de yayındaysa:

1. [Google Play Console](https://play.google.com/console) açın
2. Uygulamanızı seçin
3. **Setup > App signing** sayfasına gidin
4. **"App signing key certificate"** altında SHA-256 fingerprint'i göreceksiniz

## Yöntem 4: EAS Build (Expo)

EAS Build kullanıyorsanız:

```bash
# Credentials'ları listele
eas credentials

# Android keystore bilgilerini görüntüle
eas credentials -p android
```

Veya EAS Build'in otomatik oluşturduğu keystore için:

```bash
# Build sonrasında build detaylarını kontrol edin
eas build:view
```

## ⚙️ SHA256'yı Güncellemek

SHA256 fingerprint'i aldıktan sonra:

### 1. Asset Links dosyasını güncelleyin

**Dosya:** `website/public/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.outfit.planner.app",
    "sha256_cert_fingerprints": [
      "YOUR_SHA256_FINGERPRINT_HERE"
    ]
  }
}]
```

**Örnek:**
```json
"sha256_cert_fingerprints": [
  "11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00"
]
```

### 2. Birden fazla keystore için

Development ve production keystore'larınız varsa, ikisini de ekleyin:

```json
"sha256_cert_fingerprints": [
  "DEBUG_KEYSTORE_SHA256",
  "RELEASE_KEYSTORE_SHA256"
]
```

### 3. Website'i yeniden deploy edin

```bash
cd website
vercel --prod
```

### 4. App'i yeniden build edin

```bash
# Android
eas build --profile production --platform android

# Veya development build
eas build --profile development --platform android
```

## ✅ Doğrulama

Güncellemeden sonra doğrulamak için:

```bash
# URL'i test edin
curl https://bohoapp.online/.well-known/assetlinks.json

# JSON formatında olmalı ve SHA256 görünmeli
```

### Android'de test etme

```bash
# App Links'i test et
adb shell pm verify-app-links --re-verify com.outfit.planner.app

# Sonuçları görüntüle
adb shell pm get-app-links com.outfit.planner.app
```

## 🚨 Dikkat

- SHA256 fingerprint 64 karakter (32 byte) uzunluğundadır
- `:` karakterleriyle ayrılmış 32 hex değerdir
- MD5 veya SHA1 ile karıştırmayın (SHA256 daha uzundur)
- Her keystore'un kendine özgü SHA256'sı vardır
- Development ve production keystore'lar farklıdır

## 📱 Keystore Oluşturma (Eğer yoksa)

Yeni bir keystore oluşturmak için:

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Önemli:** Bu keystore'u güvenli bir yerde saklayın! Kaybederseniz uygulamanızı güncelleyemezsiniz.

## 📚 Daha Fazla Bilgi

- [Android App Links Documentation](https://developer.android.com/training/app-links)
- [Verify Android App Links](https://developer.android.com/training/app-links/verify-android-applinks)
- [Generate Upload Key](https://developer.android.com/studio/publish/app-signing)
