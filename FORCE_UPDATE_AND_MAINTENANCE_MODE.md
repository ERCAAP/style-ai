# Force Update & Maintenance Mode

BOHO uygulamanız için Firebase Remote Config tabanlı Force Update (Zorunlu Güncelleme) ve Maintenance Mode (Bakım Modu) özellikleri eklendi.

## 🎯 Özellikler

### 1. Force Update (Zorunlu Güncelleme)
- Kullanıcıların belirli bir minimum versiyonun altındaki uygulamayı kullanmasını engeller
- Kullanıcıları App Store veya Google Play'e yönlendirir
- Semver (semantic versioning) karşılaştırması ile çalışır
- Backend'den (Firebase Remote Config) kontrol edilebilir

### 2. Maintenance Mode (Bakım Modu)
- Uygulamayı geçici olarak kullanıma kapatır
- Özelleştirilmiş bakım mesajı gösterir
- "Tekrar Dene" butonu ile kullanıcılar bakımın bitip bitmediğini kontrol edebilir
- Backend'den anında açılıp kapatılabilir

### 3. Remote Config Entegrasyonu
- Tüm ayarlar Firebase Remote Config üzerinden yönetilir
- Paywall offering ID'si de Remote Config'den kontrol edilir
- Uygulama güncellemeden ayarlar değiştirilebilir

## 📁 Eklenen Dosyalar

```
services/firebase/remoteConfig.ts          # Remote Config servisi
components/AppGate.tsx                     # Ana kontrol komponenti
app/force-update.tsx                       # Force update ekranı
app/maintenance.tsx                        # Maintenance mode ekranı
firebase-remote-config-template.json       # Remote Config template (güncellenmiş)
```

## 🔧 Teknik Detaylar

### Remote Config Parametreleri

#### Force Update Parametreleri
```json
{
  "force_update_enabled": false,           // Force update aktif mi?
  "minimum_app_version": "1.0.0",          // Minimum gerekli versiyon
  "force_update_title": "Güncelleme Gerekli",
  "force_update_message": "Uygulamayı kullanmaya devam etmek için lütfen son sürüme güncelleyin."
}
```

#### Maintenance Mode Parametreleri
```json
{
  "maintenance_mode": false,               // Bakım modu aktif mi?
  "maintenance_title": "Bakım Çalışması",
  "maintenance_message": "Uygulamamız şu anda bakım çalışması nedeniyle kullanılamıyor. Lütfen daha sonra tekrar deneyin."
}
```

#### Paywall Parametreleri
```json
{
  "active_offering_id": "pro_a",           // Aktif offering ID
  "use_fallback_offering": true            // Fallback kullan mı?
}
```

### AppGate Akışı

```
App Başlatılıyor
    ↓
Remote Config Initialize
    ↓
Force Update Kontrolü (En yüksek öncelik)
    ├── Aktif ise → /force-update ekranı
    └── Değilse → Devam
        ↓
Maintenance Mode Kontrolü
    ├── Aktif ise → /maintenance ekranı
    └── Değilse → Normal uygulama akışı
        ↓
Her 60 saniyede bir kontrol tekrarı
```

### Version Karşılaştırma

Semver formatı kullanılır: `MAJOR.MINOR.PATCH` (örn: `1.2.3`)

```typescript
// Örnek:
Current Version: "1.0.0"
Minimum Version: "1.2.0"
Result: Force update gerekli ✓

Current Version: "1.5.3"
Minimum Version: "1.2.0"
Result: Güncelleme gerekmiyor ✗
```

## 🚀 Deployment

### 1. Firebase Remote Config'i Güncelleyin

```bash
# Firebase Console'da veya Firebase CLI ile
firebase deploy --only remoteconfig
```

Veya Firebase Console'dan:
1. Firebase Console → Remote Config
2. Template'i import edin: `firebase-remote-config-template.json`
3. Publish edin

### 2. App Store Linkleri

Force update ekranında kullanılan store linklerini güncelleyin:

`app/force-update.tsx` dosyasında:

```typescript
const storeUrl = Platform.select({
  ios: 'https://apps.apple.com/app/id6742742442', // ← Buraya kendi App Store ID'nizi yazın
  android: 'https://play.google.com/store/apps/details?id=com.outfit.planner.app',
  default: 'https://bohoapp.online',
});
```

### 3. Uygulama Versiyonunu Güncelleyin

Her yeni release için `app.json` dosyasındaki version'ı güncelleyin:

```json
{
  "expo": {
    "version": "1.0.0",  // ← Burası
    "ios": {
      "buildNumber": "1"  // ← iOS build number
    },
    "android": {
      "versionCode": 1    // ← Android version code
    }
  }
}
```

## 📱 Kullanım Senaryoları

### Senaryo 1: Acil Güncelleme Gerektiren Bug

1. Yeni versiyon yayınlandı: `1.1.0`
2. Eski versiyonda kritik bug bulundu: `1.0.0`
3. Firebase Remote Config'de:
   ```json
   {
     "force_update_enabled": true,
     "minimum_app_version": "1.1.0"
   }
   ```
4. Publish yap
5. 1-2 dakika içinde tüm `1.0.0` kullanıcıları force update ekranı görecek

### Senaryo 2: Server Bakımı

1. Backend'de kritik bakım yapılacak
2. Firebase Remote Config'de:
   ```json
   {
     "maintenance_mode": true,
     "maintenance_message": "Sunucu bakımı devam ediyor. 2 saat içinde tamamlanacak."
   }
   ```
3. Publish yap
4. Tüm kullanıcılar bakım ekranı görecek
5. Bakım tamamlandıkında:
   ```json
   {
     "maintenance_mode": false
   }
   ```
6. Publish yap
7. Kullanıcılar "Tekrar Dene" ile uygulamaya dönebilir

### Senaryo 3: Paywall Offering Değişikliği

1. RevenueCat'te yeni offering oluşturdunuz: `pro_b`
2. Test etmek için:
   ```json
   {
     "active_offering_id": "pro_b",
     "use_fallback_offering": true
   }
   ```
3. Publish yap
4. Uygulama güncellemeden yeni offering kullanılacak

### Senaryo 4: A/B Testing

```json
// Grup A için
{
  "active_offering_id": "pro_a"
}

// Grup B için (condition ile)
{
  "active_offering_id": "pro_b"
}
```

## 🔍 Monitoring & Debugging

### Console Logları

```javascript
// Remote Config initialization
[RemoteConfig] Initialized and activated

// Force Update Check
Force update required: true/false
Current version: 1.0.0
Minimum version: 1.1.0

// Maintenance Mode Check
Maintenance mode enabled: true/false

// AppGate Status
[AppGate] Status check error: ...

// Paywall Offering
Selected offering: pro_a (from Remote Config)
```

### Test Etme

#### Development Modda:
- Remote Config değerleri anında güncellenir (cache yok)
- Console loglarını takip edin

#### Production Modda:
- Remote Config cache süresi: 1 saat
- Test için Firebase Console'da "forced fetch" yapabilirsiniz

#### Force Update Testi:

1. `app.json`'da version'ı düşürün: `"version": "0.9.0"`
2. Remote Config'de:
   ```json
   {
     "force_update_enabled": true,
     "minimum_app_version": "1.0.0"
   }
   ```
3. Uygulamayı açın → Force update ekranı görünmeli

#### Maintenance Mode Testi:

1. Remote Config'de:
   ```json
   {
     "maintenance_mode": true
   }
   ```
2. Uygulamayı açın → Maintenance ekranı görünmeli
3. "Tekrar Dene" butonuna basın
4. Remote Config'i false yap ve tekrar "Tekrar Dene"

## 🎨 Özelleştirme

### Force Update Ekranı

`app/force-update.tsx` dosyasını düzenleyin:
- Renkler: `Colors` constantından
- İkonlar: Ionicons library'den
- Text'ler: Remote Config'den veya direkt koda yazabilirsiniz

### Maintenance Ekranı

`app/maintenance.tsx` dosyasını düzenleyin:
- Animasyonlu dots efekti
- Retry logic
- Custom mesajlar

### Remote Config Default Values

`services/firebase/remoteConfig.ts` dosyasındaki `defaultConfig` objesini düzenleyin:

```typescript
const defaultConfig = {
  maintenance_mode: false,
  maintenance_title: 'Bakım Çalışması',
  // ... diğer default değerler
};
```

## 🔐 Güvenlik

- Remote Config değerleri client-side'da okunur (public)
- Kritik iş mantığı için server-side validation yapın
- Force update mantıksal olarak güvenlidir (version check)
- Maintenance mode bypass edilemez (AppGate her route'da kontrol eder)

## 📊 Analytics

Şu anki implementasyonda:
- Paywall açılışları log'lanır
- Purchase completion track edilir
- Maintenance retry sayısı izlenebilir (özelleştirme gerekir)

İsterseniz ekleyebileceğiniz analytics:
```typescript
// Force update gösterildi
logEvent('force_update_shown', {
  current_version: currentVersion,
  required_version: minimumVersion
});

// Maintenance mode aktif
logEvent('maintenance_mode_shown', {
  timestamp: Date.now()
});

// Retry attempt
logEvent('maintenance_retry', {
  attempt: retryCount
});
```

## 🐛 Troubleshooting

### Remote Config değerleri güncellenmiyor
- Cache süresi dolana kadar bekleyin (prod: 1 saat)
- Veya `refreshRemoteConfig()` çağırın
- Dev modda minimumFetchIntervalMillis: 0

### Force update ekranı görünmüyor
- `app.json` version'ını kontrol edin
- Remote Config'deki `force_update_enabled` true mu?
- Console loglarını kontrol edin
- Version comparison logic doğru mu?

### Maintenance ekranından çıkamıyorum
- Firebase Console'dan `maintenance_mode: false` yapın
- 1-2 dakika bekleyin (propagation)
- "Tekrar Dene" butonuna basın

### Paywall offering yüklenmiyor
- `active_offering_id` doğru mu?
- RevenueCat dashboard'da offering var mı?
- `use_fallback_offering: true` ise fallback çalışmalı

## 🚀 Gelecek Geliştirmeler

- [ ] Multi-language support (EN/TR dinamik)
- [ ] Custom scheduled maintenance (belirli saatte otomatik aktif)
- [ ] Force update için "Later" butonu (N gün sonra tekrar göster)
- [ ] Regional maintenance (sadece belirli ülkeler için)
- [ ] Version-specific messages (her versiyon için özel mesaj)
- [ ] Analytics integration (Firebase Analytics)

## 📞 Support

Sorularınız için:
- GitHub Issues
- Documentation
- Firebase Console Logs

---

**Created by Claude Code**
Version 1.0.0 - January 2026
