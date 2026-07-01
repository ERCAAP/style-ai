# Firebase Remote Config - Paywall Yapılandırması

Bu dokümantasyon, Firebase Remote Config kullanarak paywall ekranını uzaktan nasıl yapılandıracağınızı açıklar.

## Firebase Console'da Yapılandırma

### 1. Firebase Console'a Giriş Yapın
https://console.firebase.google.com/ adresine gidin ve projenizi seçin.

### 2. Remote Config'e Gidin
Sol menüden **Engage** > **Remote Config** seçeneğini tıklayın.

### 3. Parametreleri Ekleyin

#### Parametre 1: `active_offering_id`
- **Parameter key**: `active_offering_id`
- **Data type**: String
- **Default value**: `pro_a`
- **Description**: Hangi paywall offering'inin gösterileceğini belirler

**Kullanılabilir değerler:**
- `mira_model_test` - Model test paywall
- `pro_a` - Mira Pro paywall
- `mira_icon` - Mira Icon paywall

#### Parametre 2: `use_fallback_offering`
- **Parameter key**: `use_fallback_offering`
- **Data type**: Boolean
- **Default value**: `true`
- **Description**: Belirtilen offering bulunamazsa, current offering'e fallback yapılsın mı?

### 4. Değişiklikleri Yayınlayın
Parametreleri ekledikten sonra sağ üstteki **"Publish changes"** butonuna tıklayın.

## Örnek Kullanım Senaryoları

### Senaryo 1: Farklı Paywall'ları Test Etmek
1. Firebase Console'da `active_offering_id` parametresini `mira_model_test` olarak değiştirin
2. Publish changes yapın
3. Uygulama bir sonraki açılışta yeni paywall'u gösterecektir

### Senaryo 2: A/B Test
Firebase Remote Config'in **A/B Testing** özelliğini kullanarak:
1. Remote Config > A/B Testing sekmesine gidin
2. Yeni bir A/B test oluşturun
3. `active_offering_id` parametresi için farklı değerler belirleyin:
   - **Control group**: `pro_a`
   - **Variant A**: `mira_model_test`
   - **Variant B**: `mira_icon`
4. Hedef kitle ve metrik belirleyin
5. Test'i başlatın

### Senaryo 3: Kullanıcı Segmentasyonu
Farklı kullanıcı gruplarına farklı paywall'lar göstermek için:
1. Remote Config > Conditions sekmesine gidin
2. Yeni bir koşul oluşturun (örn: "Premium Users", "New Users")
3. `active_offering_id` parametresi için koşullu değerler belirleyin
4. Publish changes yapın

## Teknik Detaylar

### Cache Süresi
Remote Config değerleri 1 saat cache'lenir. Daha hızlı test için:
```typescript
// services/firebase/remoteConfig.ts dosyasında
remoteConfig.settings.minimumFetchIntervalMillis = 0; // Development için
```

### Debug Modu
Console'da Remote Config değerlerini görmek için:
```typescript
console.log('Paywall config from Remote Config:', paywallConfig);
```

### Fallback Mekanizması
1. Remote Config'den değer çekilir
2. Bu değerle offering aranır
3. Bulunamazsa ve `use_fallback_offering: true` ise current offering kullanılır
4. O da yoksa hata gösterilir

## Sorun Giderme

### Problem: Yeni değerler uygulamada görünmüyor
**Çözüm**:
- Uygulamayı tamamen kapatıp yeniden açın
- Cache süresinin dolmasını bekleyin (1 saat)
- Debug modunda minimumFetchIntervalMillis'i 0 yapın

### Problem: Offering bulunamıyor
**Çözüm**:
- RevenueCat Dashboard'da offering identifier'ın doğru olduğunu kontrol edin
- `use_fallback_offering`'i `true` yapın
- Console logları kontrol edin

### Problem: Remote Config çalışmıyor
**Çözüm**:
- Firebase Console'da parametrelerin publish edildiğinden emin olun
- İnternet bağlantısını kontrol edin
- Firebase API key'lerinin `.env` dosyasında doğru olduğunu kontrol edin

## Kod Yapısı

```
constants/revenueCat.ts          # Local fallback değerler
services/firebase/remoteConfig.ts # Remote Config service
app/paywall.tsx                   # Paywall ekranı (Remote Config kullanıyor)
```

## Güncelleme Sıklığı
- **Minimum fetch interval**: 1 saat
- **Önerilen güncelleme sıklığı**: Günlük/haftalık testler için
- **A/B testler**: 1-2 haftalık dönemler
