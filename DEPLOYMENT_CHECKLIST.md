# 🚀 Final Deployment Checklist

Bu checklist'i kullanarak sistemi production'a hazırlayın.

## ✅ Tamamlanan Adımlar

### Mobile App
- [x] ReferralContext oluşturuldu
- [x] Deeplink handling implement edildi
- [x] Firebase analytics service yazıldı
- [x] Purchase tracking entegre edildi (`services/purchases.ts`)
- [x] Analysis tracking entegre edildi (`app/analyzing.tsx`)
- [x] App.json deeplink configuration tamamlandı
- [x] iOS Universal Links yapılandırması hazır
- [x] Android App Links yapılandırması hazır

### Website
- [x] User profile page (`user.html`)
- [x] Analytics dashboard (`analytics.html`)
- [x] Link generator (index.html içinde)
- [x] Firebase SDK entegrasyonu
- [x] Deeplink tracking
- [x] Apple App Site Association dosyası
- [x] Android Asset Links dosyası
- [x] Website production'a deploy edildi ✨

### Firebase
- [x] Firebase Analytics service (`services/firebase/analytics.ts`)
- [x] Collections schema tasarlandı
- [x] Firestore security rules yazıldı (`firestore.rules`)
- [x] Firestore indexes yapılandırıldı (`firestore.indexes.json`)

### Documentation
- [x] Ana entegrasyon dokümantasyonu (`DEEPLINK_INTEGRATION.md`)
- [x] Apple Team ID kılavuzu (`GET_APPLE_TEAM_ID.md`)
- [x] Android SHA256 kılavuzu (`GET_ANDROID_SHA256.md`)

---

## 🔧 Yapılması Gerekenler

### 1. Firebase Configuration

#### Firestore Rules Deploy

```bash
# Firebase CLI kurulu değilse:
npm install -g firebase-tools

# Firebase'e giriş yapın:
firebase login

# Project'i seçin:
firebase use outfit-planner-bf4d8

# Rules ve indexes'i deploy edin:
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

**Doğrulama:**
```bash
# Rules'ları test edin
firebase emulators:start --only firestore
```

### 2. Apple Team ID Update

1. Apple Team ID'nizi alın (bkz: `GET_APPLE_TEAM_ID.md`)
2. Dosyayı güncelleyin:

```bash
# Dosya: website/public/.well-known/apple-app-site-association
# Şu satırı bulun:
"appID": "9VHZC2S946.com.outfit.planner.app"

# Team ID'nizi girin:
"appID": "YOUR_TEAM_ID.com.outfit.planner.app"
```

3. Website'i yeniden deploy edin:

```bash
cd website
vercel --prod
```

### 3. Android SHA256 Update

1. SHA256 fingerprint'inizi alın (bkz: `GET_ANDROID_SHA256.md`)
2. Dosyayı güncelleyin:

```bash
# Dosya: website/public/.well-known/assetlinks.json
# Şu satırı bulun:
"sha256_cert_fingerprints": ["REPLACE_WITH_YOUR_SHA256_CERTIFICATE_FINGERPRINT"]

# SHA256'nızı girin:
"sha256_cert_fingerprints": ["11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:..."]
```

3. Website'i yeniden deploy edin:

```bash
cd website
vercel --prod
```

### 4. Domain Configuration (Vercel)

**IMPORTANT:** Şu anda website bu URL'de: `website-bkjk42wal-omers-projects-aecc2aa3.vercel.app`

Ancak `bohoapp.online` domain'ini kullanmanız gerekiyor:

#### Vercel Dashboard'da Domain Ekleyin:

1. [Vercel Dashboard](https://vercel.com/dashboard) açın
2. `website` projesini seçin
3. **Settings > Domains** sayfasına gidin
4. `bohoapp.online` domain'ini ekleyin
5. DNS kayıtlarını yapılandırın:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

6. Domain'in aktif olmasını bekleyin (5-10 dakika)

#### DNS Doğrulama:

```bash
# DNS propagation'ı kontrol edin
nslookup bohoapp.online
dig bohoapp.online

# HTTPS'in çalıştığını doğrulayın
curl -I https://bohoapp.online
```

### 5. Mobile App Build

#### iOS Build:

```bash
# Production build
eas build --profile production --platform ios

# Veya development build test için
eas build --profile development --platform ios
```

**Build tamamlandıktan sonra:**
- TestFlight'a upload edin
- Internal testing yapın
- App Store Review'e gönderin

#### Android Build:

```bash
# Production build
eas build --profile production --platform android

# Veya development build test için
eas build --profile development --platform android
```

**Build tamamlandıktan sonra:**
- Internal testing track'e upload edin
- Internal testing yapın
- Google Play Review'e gönderin

---

## 🧪 Testing Checklist

### Web Testing

- [ ] Link generator çalışıyor mu?
  - Test: https://bohoapp.online/#link-generator
  
- [ ] User profile sayfası açılıyor mu?
  - Test: https://bohoapp.online/user?user=testuser
  
- [ ] Analytics dashboard çalışıyor mu?
  - Test: https://bohoapp.online/analytics?user=testuser
  
- [ ] Universal Links dosyası erişilebilir mi?
  - Test: https://bohoapp.online/.well-known/apple-app-site-association
  
- [ ] App Links dosyası erişilebilir mi?
  - Test: https://bohoapp.online/.well-known/assetlinks.json

### iOS Testing

```bash
# Simulator'de deeplink test
xcrun simctl openurl booted "styleai://user?user=testuser"

# Universal Link test
xcrun simctl openurl booted "https://bohoapp.online/user?user=testuser"

# Device'da test
# Safari'de açın: https://bohoapp.online/user?user=testuser
# "Open in App" banner görünmeli
```

**Test adımları:**
1. [ ] Referral link'e tıkla (web'den)
2. [ ] App Store'a yönlendiriliyor mu?
3. [ ] App'i indir ve aç
4. [ ] App açılınca deeplink çalışıyor mu?
5. [ ] Analytics'te install kaydedildi mi?
6. [ ] Bir outfit analizi yap
7. [ ] Analytics'te analysis kaydedildi mi?
8. [ ] Premium satın al (test purchase)
9. [ ] Analytics'te purchase kaydedildi mi?

### Android Testing

```bash
# Emulator'de deeplink test
adb shell am start -W -a android.intent.action.VIEW -d "styleai://user?user=testuser" com.outfit.planner.app

# App Link test
adb shell am start -W -a android.intent.action.VIEW -d "https://bohoapp.online/user?user=testuser" com.outfit.planner.app

# App Links doğrulama
adb shell pm verify-app-links --re-verify com.outfit.planner.app
adb shell pm get-app-links com.outfit.planner.app
```

**Test adımları:**
1. [ ] Referral link'e tıkla (web'den)
2. [ ] Play Store'a yönlendiriliyor mu?
3. [ ] App'i indir ve aç
4. [ ] App açılınca deeplink çalışıyor mu?
5. [ ] Analytics'te install kaydedildi mi?
6. [ ] Bir outfit analizi yap
7. [ ] Analytics'te analysis kaydedildi mi?
8. [ ] Premium satın al (test purchase)
9. [ ] Analytics'te purchase kaydedildi mi?

### Firebase Testing

- [ ] Firestore rules çalışıyor mu?
  ```bash
  # Firebase Console > Firestore > Rules
  # "Publish" butonuna basın
  ```

- [ ] Collections oluşturuldu mu?
  - [ ] `users`
  - [ ] `userAnalytics`
  - [ ] `referralEvents`
  - [ ] `deeplinkTracking`

- [ ] Test verisi ekleyin ve okuyun:
  ```javascript
  // Firebase Console > Firestore > Data
  // Manuel test verisi ekleyin
  ```

---

## 🎯 Analytics Test Senaryosu

### Tam Akış Testi:

1. **User A - Referrer:**
   - App'te hesap oluştur
   - Profile git ve referral link al
   - Link'i kopyala

2. **User B - Yeni Kullanıcı:**
   - User A'nın linkine tıkla: `https://bohoapp.online/user?user=userA`
   - "Download App" butonuna tıkla
   - App Store/Play Store'dan indir
   - App'i aç (deeplink otomatik çalışmalı)
   - Bir outfit fotoğrafı çek
   - Analiz yap
   - Premium satın al

3. **User A - Analytics Kontrolü:**
   - Analytics sayfasına git: `https://bohoapp.online/analytics?user=userA`
   - Şunları görmelisin:
     - [x] 1 Install
     - [x] 1+ App Opens
     - [x] 1 Analysis
     - [x] 1 Purchase
     - [x] Revenue tutarı

---

## 🔐 Security Checklist

- [x] Firebase rules production'a uygun
- [x] API keys environment variables'da
- [ ] RevenueCat keys doğru mu?
  - iOS: `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
  - Android: `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
- [ ] OpenAI API key ayarlandı mı?
  - `EXPO_PUBLIC_OPENAI_API_KEY`
- [ ] Firebase config public ama güvenli mi?
  - Config public olabilir (normal)
  - Rules ile güvenlik sağlanır

---

## 📊 Monitoring & Analytics

### Firebase Console

1. **Firestore Usage:**
   - [Firebase Console > Firestore > Usage](https://console.firebase.google.com/project/outfit-planner-bf4d8/firestore/usage)
   - Günlük okuma/yazma sayılarını izleyin

2. **Analytics:**
   - [Firebase Console > Analytics](https://console.firebase.google.com/project/outfit-planner-bf4d8/analytics)
   - Kullanıcı davranışlarını izleyin

### Vercel Analytics

1. **Website Traffic:**
   - [Vercel Dashboard > Analytics](https://vercel.com/dashboard)
   - Sayfa görüntülemelerini izleyin

### RevenueCat Dashboard

1. **Revenue Tracking:**
   - [RevenueCat Dashboard](https://app.revenuecat.com/)
   - Satışları ve subscriptions'ları izleyin

---

## 🐛 Troubleshooting

### Universal Links Çalışmıyor (iOS)

1. Apple App Site Association dosyasını kontrol edin:
   ```bash
   curl https://bohoapp.online/.well-known/apple-app-site-association
   ```

2. Team ID doğru mu kontrol edin

3. App'i temiz build edin:
   ```bash
   eas build --profile production --platform ios --clear-cache
   ```

### App Links Çalışmıyor (Android)

1. Asset Links dosyasını kontrol edin:
   ```bash
   curl https://bohoapp.online/.well-known/assetlinks.json
   ```

2. SHA256 fingerprint doğru mu kontrol edin

3. App Links'i yeniden doğrulayın:
   ```bash
   adb shell pm verify-app-links --re-verify com.outfit.planner.app
   ```

### Analytics Görünmüyor

1. Firebase Console'da collections var mı?
2. Browser console'da hata var mı?
3. Network tab'de Firebase request'ler gidiyor mu?
4. Firestore rules publish edildi mi?

---

## 🎉 Launch Hazır!

Tüm checklistler tamamlandığında:

1. [ ] Beta testing yapıldı
2. [ ] Tüm özellikler test edildi
3. [ ] Analytics çalışıyor
4. [ ] Purchases track ediliyor
5. [ ] Deeplinks çalışıyor
6. [ ] Website live
7. [ ] Mobile app stores'da

**🚀 LAUNCH!**

---

## 📞 Support & Resources

- **Firebase Console:** https://console.firebase.google.com/project/outfit-planner-bf4d8
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Apple Developer:** https://developer.apple.com/account
- **Google Play Console:** https://play.google.com/console
- **RevenueCat:** https://app.revenuecat.com/

**Documentation:**
- `DEEPLINK_INTEGRATION.md` - Ana entegrasyon dökümanı
- `GET_APPLE_TEAM_ID.md` - Apple Team ID kılavuzu
- `GET_ANDROID_SHA256.md` - Android SHA256 kılavuzu
