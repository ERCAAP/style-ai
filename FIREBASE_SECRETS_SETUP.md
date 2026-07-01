# Firebase Secrets Setup - EachLabs API Key

Bu proje EachLabs P-IMAGE API'sini kullanarak kıyafet deneme (virtual try-on) özelliği sunuyor. API anahtarı güvenlik için Firebase secrets'da saklanıyor.

## 🔐 Neden Firebase Secrets?

- ✅ API anahtarı client-side'a asla expose edilmez
- ✅ Server-side'da güvenli bir şekilde saklanır
- ✅ Version control'e (Git) dahil edilmez
- ✅ Her environment için farklı key kullanabilirsiniz

## 📝 Kurulum Adımları

### 1. Firebase CLI'yi Kurun (Eğer yoksa)

```bash
npm install -g firebase-tools
```

### 2. Firebase'e Login Olun

```bash
firebase login
```

### 3. EachLabs API Key'i Secret Olarak Ekleyin

```bash
firebase functions:secrets:set EACHLABS_API_KEY
```

Komut çalıştırıldığında sizden API key'i girmeniz istenecek. EachLabs dashboard'unuzdan aldığınız API key'i girin.

### 4. Secret'ın Eklendiğini Doğrulayın

```bash
firebase functions:secrets:access EACHLABS_API_KEY
```

### 5. Cloud Functions'ı Deploy Edin

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 🔄 Secret Güncelleme

API key'i güncellemek isterseniz:

```bash
firebase functions:secrets:set EACHLABS_API_KEY
```

## 🗑️ Secret Silme

Secret'ı silmek isterseniz:

```bash
firebase functions:secrets:delete EACHLABS_API_KEY
```

## 📋 Mevcut Secrets'ları Görüntüleme

Tüm secrets'ları listelemek için:

```bash
firebase functions:secrets:list
```

## 🚀 Production vs Development

Firebase secrets farklı environments için farklı değerler alabilir:

```bash
# Development
firebase functions:secrets:set EACHLABS_API_KEY --project your-dev-project

# Production
firebase functions:secrets:set EACHLABS_API_KEY --project your-prod-project
```

## 📚 İlgili Dosyalar

- **Cloud Function**: `functions/src/index.ts` - `tryOutfit` ve `getPredictionStatus` fonksiyonları
- **Client Service**: `services/api/pImageCloudService.ts` - Cloud Function'ları çağırır
- **Processing Screen**: `app/processing.tsx` - Animasyonlu işlem ekranı

## 🔍 Nasıl Çalışır?

1. **Client** → Firebase Storage'a görselleri yükler
2. **Client** → Cloud Function'ı çağırır (Firebase Storage URL'leri ile)
3. **Cloud Function** → Firebase secrets'dan API key'i alır
4. **Cloud Function** → EachLabs P-IMAGE API'yi çağırır
5. **Cloud Function** → Prediction ID'yi döner
6. **Client** → Prediction status'u polling yapar
7. **Cloud Function** → EachLabs'dan status sorgulanır
8. **Client** → Sonuç görseli gösterilir

## ⚠️ Önemli Notlar

- API key'i asla `.env` dosyasına koymayın
- API key'i Git'e commit etmeyin
- Her developer kendi test API key'ini kullanmalı
- Production için ayrı bir API key kullanın

## 🆘 Sorun Giderme

### "Secret not found" hatası

```bash
firebase functions:secrets:set EACHLABS_API_KEY
```

komutuyla secret'ı yeniden oluşturun.

### Cloud Function çalışmıyor

```bash
firebase functions:log
```

komutuyla logları kontrol edin.

### Functions deploy hatası

```bash
cd functions
npm install
npm run build
firebase deploy --only functions --force
```

## 📞 Destek

Herhangi bir sorun yaşarsanız:
- Firebase Console → Functions → Logs
- EachLabs Dashboard → API Usage
- Firebase Documentation: https://firebase.google.com/docs/functions/config-env
