# 🔥 Firebase Console Kurulum Rehberi

Firebase Console'da yapılması gereken tüm ayarlar.

## 📋 Genel Bakış

**Firebase Project:** `outfit-planner-bf4d8`
**Console URL:** https://console.firebase.google.com/project/outfit-planner-bf4d8

---

## 1️⃣ Authentication Ayarları

### Sign-in Methods

1. **Firebase Console > Authentication > Sign-in method** sayfasına git
2. Aşağıdaki providers'ları aktif et:

#### ✅ Email/Password
- **Status:** Enabled
- **Email link (passwordless sign-in):** Optional (kapalı kalabilir)

#### ✅ Anonymous
- **Status:** Enabled
- **Açıklama:** Kullanıcılar önce anonim giriş yapıyor, sonra hesap oluşturuyor

#### ⚙️ Authorized Domains

Şu domainleri ekle:
- `localhost` (development için)
- `bohoapp.online` (production website)
- Expo Go için: `expo.dev` (opsiyonel)

**Nasıl eklenir:**
1. Authentication > Settings > Authorized domains
2. "Add domain" butonuna tıkla
3. Domain'i ekle ve kaydet

---

## 2️⃣ Firestore Database

### Rules Deploy

```bash
# Terminal'de çalıştır
firebase deploy --only firestore:rules
```

**Kontrol:**
1. Firebase Console > Firestore Database > Rules
2. Son deployment zamanını kontrol et
3. Rules'ın güncel olduğundan emin ol

### Indexes Deploy

```bash
# Terminal'de çalıştır
firebase deploy --only firestore:indexes
```

**Kontrol:**
1. Firebase Console > Firestore Database > Indexes
2. Composite tab'inde şu indexes'leri görmelisin:
   - users (referralCode, createdAt)
   - referralEvents (referrerId, timestamp)
   - referralEvents (referrerId, eventType, timestamp)
   - deeplinkTracking (referrer, clickedAt)
   - deeplinkTracking (referrer, converted, clickedAt)
   - analyses (userId, createdAt)
   - jobs (userId, status, createdAt)

### Manuel Collections Oluşturma (Opsiyonel)

İlk kullanıcı oluşturulduğunda otomatik oluşacaklar ama manuel de oluşturabilirsin:

1. Firestore Database > Data
2. "Start collection" tıkla
3. Şu collection'ları oluştur:
   - `users`
   - `userAnalytics`
   - `referralEvents`
   - `deeplinkTracking`

---

## 3️⃣ Storage

### Rules Deploy

```bash
# Terminal'de çalıştır
firebase deploy --only storage
```

**Kontrol:**
1. Firebase Console > Storage > Rules
2. Son deployment zamanını kontrol et

### Bucket Ayarları

1. Storage > Files sayfasına git
2. Default bucket: `outfit-planner-bf4d8.firebasestorage.app`
3. CORS ayarları (gerekirse):

```bash
# cors.json oluştur
cat > cors.json << 'CORS'
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
CORS

# CORS'u deploy et
gsutil cors set cors.json gs://outfit-planner-bf4d8.firebasestorage.app
```

---

## 4️⃣ Remote Config (Opsiyonel)

Remote Config kullanıyorsanız:

1. Firebase Console > Remote Config
2. Parameters ekle
3. Template'i deploy et:

```bash
firebase deploy --only remoteconfig
```

---

## 5️⃣ Analytics & Monitoring

### Google Analytics

1. Firebase Console > Analytics > Dashboard
2. "Enable Google Analytics" (zaten aktif olmalı)
3. Events'leri izlemeye başla

### Performance Monitoring (Opsiyonel)

```bash
# Uygulamaya eklemek için
npm install @react-native-firebase/perf
```

---

## 6️⃣ Security & Compliance

### App Check (Önerilen - Sonradan)

Production'a geçerken mutlaka aktif et:

1. Firebase Console > App Check
2. iOS app için: DeviceCheck
3. Android app için: Play Integrity API
4. "Enforce" modunu aktif et

**Not:** Şimdilik "Monitoring" modunda bırakabilirsin.

### Security Rules Test

```bash
# Firestore rules test
firebase emulators:start --only firestore

# Storage rules test
firebase emulators:start --only storage
```

---

## 🚀 Tek Komutla Deploy

Tüm Firebase servislerini deploy etmek için:

```bash
firebase deploy
```

Veya seçici deploy:

```bash
# Sadece rules ve indexes
firebase deploy --only firestore:rules,firestore:indexes,storage

# Functions dahil (varsa)
firebase deploy --only functions

# Her şey
firebase deploy
```

---

## 📊 Monitoring & Quotas

### Firestore Quotas

**Kontrol:** Firebase Console > Firestore Database > Usage

**Ücretsiz Plan Limitleri:**
- 50,000 reads/gün
- 20,000 writes/gün
- 20,000 deletes/gün
- 1 GB stored data

**Referral sistemi için tahmini kullanım:**
- Her referral click: ~3 writes
- Her app install: ~5 writes
- Her purchase: ~4 writes
- Her analysis: ~3 writes
- Analytics görüntüleme: ~3 reads

**1000 aktif kullanıcı için:** ~50K writes/gün (ücretli plana geçmek gerekebilir)

### Storage Quotas

**Ücretsiz Plan:**
- 5 GB stored
- 1 GB/day download

**Kullanım tahmini:**
- Outfit görseli: ~2-5 MB
- 1000 kullanıcı x 10 görsel: ~25-50 GB (ücretli plan gerekli)

### Upgrade to Blaze Plan

Büyüdüğünüzde:

1. Firebase Console > Settings (dişli ikonu) > Usage and billing
2. "Modify plan" tıkla
3. "Blaze - Pay as you go" seç
4. Kredi kartı bilgilerini ekle
5. Budget alerts kur (örn: $50/ay limit)

---

## 🔐 Service Account (Functions için)

Eğer Cloud Functions kullanıyorsanız:

1. Firebase Console > Project Settings > Service Accounts
2. "Generate new private key" tıkla
3. JSON dosyasını güvenli bir yerde sakla
4. Functions'ta kullan:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

---

## ✅ Checklist

### Zorunlu Ayarlar
- [ ] Authentication > Email/Password enabled
- [ ] Authentication > Anonymous enabled
- [ ] Authentication > Authorized domains: bohoapp.online eklendi
- [ ] Firestore Rules deploy edildi
- [ ] Firestore Indexes deploy edildi
- [ ] Storage Rules deploy edildi

### Önerilen Ayarlar
- [ ] Google Analytics aktif
- [ ] Budget alerts kuruldu
- [ ] CORS ayarları yapıldı (gerekirse)
- [ ] Collections oluşturuldu (otomatik olacak)

### Sonradan Yapılacaklar
- [ ] App Check aktif edildi (production'da)
- [ ] Performance Monitoring eklendi
- [ ] Blaze plan'a upgrade (gerektiğinde)
- [ ] Cloud Functions deploy edildi (varsa)

---

## 🆘 Troubleshooting

### "Permission denied" Hatası

**Firestore:**
```bash
# Rules'ları tekrar deploy et
firebase deploy --only firestore:rules

# Console'dan kontrol et
# Firestore > Rules > Publish
```

**Storage:**
```bash
# Rules'ları tekrar deploy et
firebase deploy --only storage

# Bucket permissions kontrol et
```

### "Index required" Hatası

```bash
# Konsol'daki error mesajındaki linke tıkla
# Otomatik index oluşturulacak

# Veya manuel:
firebase deploy --only firestore:indexes
```

### Authentication Hatası

1. Console > Authentication > Settings
2. Authorized domains kontrol et
3. API key kontrol et (`.env` dosyasında)

---

## 📞 Resources

- **Firebase Console:** https://console.firebase.google.com/project/outfit-planner-bf4d8
- **Documentation:** https://firebase.google.com/docs
- **Pricing:** https://firebase.google.com/pricing
- **Status:** https://status.firebase.google.com/

