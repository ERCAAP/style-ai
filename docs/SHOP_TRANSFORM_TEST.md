# Mağazadan Dene - Transform Test Senaryosu

## 🎬 Akış Testi

### AŞAMA 1: Ekrana Giriş
```
✅ Ana ekrandan "Kıyafeti Dene" butonu
✅ outfit-try.tsx açılır
```

### AŞAMA 2: Kullanıcı Fotoğrafı
```
✅ "Senin Fotografin" bölümü görünür
✅ Fotograf ekle butonu çalışır
✅ Kamera/Galeri/URL seçenekleri
✅ Fotoğraf yüklenir
```

### AŞAMA 3: Mağaza Bölümü Görünür
```
✅ Fotoğraf yüklendikten sonra "Mağazadan Seç" bölümü açılır
✅ ShopOutfitsGrid render edilir
✅ Flat lay görsel (b.webp) gösterilir
✅ Yatay scroll çalışır
```

### AŞAMA 4: Kombin Seçimi
```
✅ Kullanıcı flat lay görseline tıklar
✅ handleSelectShopOutfit çalışır
✅ Transform modal açılır
```

### AŞAMA 5: Transform Animasyonu
```
✅ OutfitTransformModal render edilir
✅ Flat lay görsel (b.webp) gösterilir
✅ 600ms - Zoom in animasyonu
✅ 600-1000ms - Cross fade başlar
✅ Model görsel (c.webp) belirir
✅ 1400ms - Animasyon tamamlanır
✅ onComplete tetiklenir
```

### AŞAMA 6: Hedef Kıyafetlere Ekleme
```
✅ handleTransformComplete çalışır
✅ getAssetUri ile model URI alınır
✅ addTargetLocalImage çağrılır
✅ Model görseli (c.webp) hedef kıyafetlere eklenir
✅ Success haptic feedback
✅ Console log: "✅ Model görseli eklendi: Classic White Set"
```

### AŞAMA 7: Görsel Grid'de Görünme
```
✅ TargetImagesGrid'de c.webp modeli görünür
✅ Index badge "1" gösterir
✅ Remove butonu çalışır
```

### AŞAMA 8: Transform İşlemi
```
✅ "Kıyafetleri Dene" butonu aktif olur
✅ Processing ekranına geçer
✅ Kullanıcı fotoğrafı + c.webp modeli işlenir
```

## 🐛 Hata Senaryoları

### Senaryo 1: Asset URI Çözümlenemezse
```javascript
if (!modelUri) {
  throw new Error('Model görseli URI\'ye çevrilemedi');
}
```
**Beklenen**: Alert gösterilir, modal kapanır

### Senaryo 2: addTargetLocalImage Başarısız
```javascript
if (!result) {
  throw new Error('Görsel eklenemedi');
}
```
**Beklenen**: Error haptic, alert gösterilir

### Senaryo 3: Maximum Images
```javascript
const canAddMore = images.length < MAX_TARGET_IMAGES;
```
**Beklenen**: Add butonu disabled olur

## 📊 Doğrulama Noktaları

### 1. shopOutfits.ts
```typescript
✅ flatLayImage: b.webp
✅ modelImage: c.webp
✅ Single outfit tanımlı
```

### 2. OutfitTransformModal.tsx
```typescript
✅ Flat lay source: outfit.flatLayImage
✅ Model source: outfit.modelImage
✅ Animation timing doğru
✅ onComplete callback çalışır
```

### 3. outfit-try.tsx
```typescript
✅ getAssetUri import edilmiş
✅ transformModalVisible state var
✅ selectedOutfit state var
✅ handleSelectShopOutfit doğru
✅ handleTransformComplete try-catch ile korumalı
✅ Modal render ediliyor
```

## ✅ Başarı Kriterleri

- [ ] Flat lay görsel (b.webp) grid'de görünüyor
- [ ] Tıklayınca modal açılıyor
- [ ] Animasyon smooth çalışıyor
- [ ] Model (c.webp) fade in oluyor
- [ ] Hedef kıyafetlere c.webp ekleniyor
- [ ] Grid'de c.webp model görseli var
- [ ] Transform butonu çalışıyor

## 🔧 Debug Komutları

### Console Log Kontrolleri
```javascript
// handleSelectShopOutfit içinde
console.log('🎯 Seçilen outfit:', outfit.name);

// handleTransformComplete içinde
console.log('📦 Flat lay URI:', getAssetUri(selectedOutfit.flatLayImage));
console.log('👗 Model URI:', modelUri);
console.log('✅ Eklendi:', result);
```

### React DevTools
```
- OutfitTransformModal visible state
- selectedOutfit değeri
- targetImages array uzunluğu
```
