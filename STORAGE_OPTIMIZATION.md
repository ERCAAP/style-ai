# 💰 Firebase Storage Maliyet Optimizasyonu

## 🎯 Durum Özeti

### ✅ Analiz Özelliği (OpenAI)
- **Yöntem**: Base64 Data URL
- **Storage Kullanımı**: YOK
- **Maliyet**: $0 (sadece OpenAI API ücreti)
- **Dosya**: `services/api/secureAnalysis.ts`

### ⚠️ Kıyafet Dene Özelliği (EachLabs P-IMAGE)
- **Yöntem**: Firebase Storage → Public URL
- **Sebep**: EachLabs API sadece public URL kabul ediyor
- **Maliyet**: Her denemede upload + storage ücreti
- **Dosya**: `services/api/pImageCloudService.ts`

---

## 🔧 Uygulanan Optimizasyonlar

### 1. **Otomatik Cleanup (Anında Silme)**

Upload edilen dosyalar işlem bitince **otomatik olarak siliniyor**:

```typescript
// services/api/pImageCloudService.ts
export async function generateOutfitTryOn(...) {
  let uploadedPaths: string[] = [];

  try {
    // Upload images
    // Process with API
    // Poll for result

    // ✅ Cleanup: İşlem bitince sil
    if (uploadedPaths.length > 0) {
      await Promise.allSettled(
        uploadedPaths.map(path => deleteFile(path))
      );
    }
  } catch (error) {
    // ✅ Hata durumunda da sil
    await Promise.allSettled(
      uploadedPaths.map(path => deleteFile(path))
    );
  }
}
```

**Sonuç**: Dosyalar sadece 1-2 dakika storage'da kalıyor!

### 2. **Firebase Storage Lifecycle Rules**

Eğer cleanup başarısız olursa, Firebase otomatik olarak 1 gün sonra siliyor:

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 1,
          "matchesPrefix": ["outfit-try-on/"]
        }
      }
    ]
  }
}
```

**Kurulum**:
1. [Firebase Console](https://console.firebase.google.com/) → Storage → Lifecycle
2. `storage-lifecycle.rules.json` dosyasını upload et
3. VEYA manuel olarak rule ekle:
   - Prefix: `outfit-try-on/`
   - Action: Delete
   - Age: 1 day

---

## 📊 Maliyet Karşılaştırması

### Öncesi (Optimizasyon Yok):
```
100 Try-On İşlemi:
├─ 100 user photo upload (her biri 2MB)
├─ 300 clothing photo upload (ortalama 3 kıyafet, her biri 1MB)
├─ Toplam: 500MB upload
├─ Storage: 500MB kalıcı (temizlenmedi)
└─ Maliyet: ~$0.026 upload + ~$0.013/ay storage = $0.039
```

### Sonrası (Otomatik Cleanup):
```
100 Try-On İşlemi:
├─ 100 user photo upload (her biri 2MB)
├─ 300 clothing photo upload (ortalama 3 kıyafet, her biri 1MB)
├─ Toplam: 500MB upload
├─ Storage: ~0MB (2 dk sonra silindi)
└─ Maliyet: ~$0.026 upload + ~$0.000 storage = $0.026
```

**Tasarruf**: %33 (storage maliyeti tamamen elimine edildi!)

---

## 🚀 Firebase Storage Pricing (Güncel)

| İşlem | Fiyat | Not |
|-------|-------|-----|
| Upload | $0.026/GB | Her try-on'da ödenir |
| Download | $0.12/GB | EachLabs API tarafından |
| Storage | $0.026/GB/ay | Artık ~$0 (anında siliniyor) |

**Örnek**: 1000 try-on/ay × 4 görsel × 1.5MB = 6GB upload = **$0.16/ay**

---

## ✅ Yapılanlar Özeti

1. ✅ **Otomatik Cleanup Eklendi**
   - İşlem bitince anında silme
   - Hata durumunda da silme
   - `uploadedPaths` tracking

2. ✅ **Lifecycle Rules Oluşturuldu**
   - 1 gün sonra otomatik silme
   - Backup cleanup mekanizması
   - `storage-lifecycle.rules.json`

3. ✅ **Storage Rules Güncellendi**
   - `outfit-try-on/` path'ine write izni
   - Authenticated users only
   - 10MB max file size

4. ✅ **Error Handling İyileştirildi**
   - Permission hatalarında net mesajlar
   - Auth kontrolü eklendi
   - Cleanup garantisi

---

## 🔄 Alternatif Çözüm (Gelecek)

### EachLabs API Base64 Desteği?

**Kontrol Edildi**: EachLabs P-IMAGE API dokumentasyonunda base64 desteği bulunamadı.

**Eğer destekleseydi**:
```typescript
// Base64 approach (şu an mümkün değil)
const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: FileSystem.EncodingType.Base64,
});

await fetch('https://api.eachlabs.ai/v1/prediction/', {
  body: JSON.stringify({
    input: {
      images: [
        `data:image/jpeg;base64,${base64}`,  // ❌ Desteklenmiyor
      ],
    },
  }),
});
```

**Sonuç**: Firebase Storage kullanımı şu an **zorunlu**.

---

## 📈 İzleme ve Monitoring

### Firebase Console'da Kontrol
1. Storage → Files → `outfit-try-on/`
2. Dosyalar 1-2 dakika içinde silinmeli
3. Eğer kalıcı dosya varsa lifecycle rules çalışıyor

### Logs Kontrolü
```bash
# Client logs
console.log('Cleaning up uploaded images...');
console.log('Cleaned up X uploaded images');

# Hata durumu
console.warn('Cleanup error:', err);
```

---

## 🎯 Best Practices

1. **Her Upload'tan Sonra Cleanup**
   - ✅ Başarılı işlemde sil
   - ✅ Hata durumunda sil
   - ✅ Try-catch bloğunda sil

2. **Lifecycle Rules Backup**
   - Otomatik cleanup başarısız olursa
   - 1 gün sonra Firebase siler
   - Manuel müdahale gerekmez

3. **Monitoring**
   - Storage kullanımını takip et
   - Eğer artıyorsa cleanup çalışmıyor demektir
   - Firebase Console → Storage → Metrics

---

## 📝 Notlar

- OpenAI Analysis için **hiçbir değişiklik yok** - zaten optimize
- Try-On için Storage **zorunlu** (EachLabs API gereksinimi)
- Otomatik cleanup ile **%33 maliyet tasarrufu**
- Lifecycle rules **backup** mekanizması

**Son Güncelleme**: 7 Ocak 2026
**Optimizasyon Durumu**: ✅ Tamamlandı
