# Firebase Remote Config Import Rehberi

Bu dokümantasyon `firebase-remote-config-template.json` dosyasını Firebase Console'a nasıl import edeceğinizi gösterir.

## Yöntem 1: Firebase Console Üzerinden (Önerilen)

### Adım 1: Firebase Console'a Gidin
1. https://console.firebase.google.com/ adresini açın
2. Projenizi seçin
3. Sol menüden **Engage** > **Remote Config** seçeneğini tıklayın

### Adım 2: Template'i Import Edin
1. Sağ üst köşede **3 nokta (⋮)** menüsüne tıklayın
2. **"Download current config"** seçeneğini görürseniz, aynı menüde **"Publish from file"** veya **"Import from file"** seçeneğini arayın
3. Alternatif olarak: Aşağı kaydırın ve **"Import config"** butonunu bulun
4. `firebase-remote-config-template.json` dosyasını seçin
5. **"Publish changes"** butonuna tıklayın

### Adım 3: Parametreleri Kontrol Edin
Import ettikten sonra şu parametreleri göreceksiniz:
- ✅ `active_offering_id` = `pro_a`
- ✅ `use_fallback_offering` = `true`

---

## Yöntem 2: Firebase CLI ile Import (Terminal)

### Ön Gereksinimler
Firebase CLI'nın kurulu olması gerekiyor:
```bash
npm install -g firebase-tools
```

### Adım 1: Firebase'e Login Olun
```bash
firebase login
```

### Adım 2: Projenizi Seçin
```bash
firebase use --add
```
Listeden projenizi seçin.

### Adım 3: Remote Config'i Deploy Edin
```bash
firebase deploy --only remoteconfig
```

**NOT**: Bu komutun çalışması için projenizde `firebase.json` dosyası olması gerekir.

---

## Yöntem 3: Manuel Firebase Console Ekleme

Eğer import çalışmazsa, manuel olarak ekleyin:

### Parametre 1: active_offering_id
1. **"Add parameter"** butonuna tıklayın
2. **Parameter key**: `active_offering_id`
3. **Data type**: String
4. **Default value**: `pro_a`
5. **Description**: Active RevenueCat offering identifier for paywall. Options: mira_model_test, pro_a, mira_icon
6. **"Save"** butonuna tıklayın

### Parametre 2: use_fallback_offering
1. **"Add parameter"** butonuna tıklayın
2. **Parameter key**: `use_fallback_offering`
3. **Data type**: Boolean
4. **Default value**: `true` (toggle'ı aktif edin)
5. **Description**: Fallback to current offering if specified offering is not found
6. **"Save"** butonuna tıklayın

### Son Adım: Yayınlayın
Sağ üstteki **"Publish changes"** butonuna tıklayın.

---

## Doğrulama

Import'un başarılı olup olmadığını kontrol etmek için:

1. Firebase Console > Remote Config sayfasında parametreleri görüyor musunuz?
2. Mobil uygulamanızı açın ve console loglarına bakın:
   ```
   Paywall config from Remote Config: { offeringId: 'pro_a', useFallback: true }
   ```

---

## Farklı Offering'leri Test Etme

### Test 1: Model Test Paywall
Firebase Console'da:
- `active_offering_id` = `mira_model_test` olarak değiştirin
- **Publish changes** yapın
- Uygulamayı yeniden başlatın

### Test 2: Mira Icon Paywall
Firebase Console'da:
- `active_offering_id` = `mira_icon` olarak değiştirin
- **Publish changes** yapın
- Uygulamayı yeniden başlatın

### Test 3: Fallback'i Kapatma
Firebase Console'da:
- `use_fallback_offering` = `false` yapın
- **Publish changes** yapın
- Uygulamayı yeniden başlatın

---

## Sorun Giderme

### Problem: "Import from file" seçeneği görünmüyor
**Çözüm**:
- Firebase Console'un güncel sürümünü kullandığınızdan emin olun
- Farklı bir tarayıcı deneyin (Chrome önerilir)
- Manuel ekleme yöntemini kullanın (Yöntem 3)

### Problem: Import başarısız oluyor
**Çözüm**:
- JSON dosyasının geçerli olduğundan emin olun
- JSON dosyasını bir text editor'de açıp syntax hatası var mı kontrol edin
- Manuel ekleme yöntemini kullanın (Yöntem 3)

### Problem: Değişiklikler uygulamada görünmüyor
**Çözüm**:
- **Publish changes** yaptığınızdan emin olun (import sonrası mutlaka!)
- Uygulamayı tamamen kapatıp yeniden açın
- Cache süresinin dolmasını bekleyin (1 saat) veya development modunda minimum fetch interval'i 0 yapın

---

## Hızlı Komutlar

### Firebase Projeni Kontrol Et
```bash
firebase projects:list
```

### Mevcut Remote Config'i İndir
```bash
firebase remoteconfig:get > current-config.json
```

### Template'i Deploy Et
```bash
firebase deploy --only remoteconfig
```

### Firebase Console'u Aç
```bash
firebase open remoteconfig
```

---

## Başarı Mesajları

Import başarılı olursa göreceğiniz mesajlar:
- ✅ "2 parameters added"
- ✅ "Changes published successfully"
- ✅ Console'da yeşil onay işareti

Uygulamada göreceğiniz log:
```
Paywall config from Remote Config: { offeringId: 'pro_a', useFallback: true }
Selected offering: pro_a
```
