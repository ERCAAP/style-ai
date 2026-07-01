# 🚀 Vercel Deployment Rehberi

## Adım 1: Vercel Hesabı Oluştur

1. [vercel.com](https://vercel.com) adresine git
2. GitHub hesabınla giriş yap (önerilen)
3. Ücretsiz hesap oluştur

## Adım 2: Proje Deploy Et

### Seçenek A: GitHub üzerinden (Önerilen)

1. Bu `website` klasörünü GitHub'a push'la
2. Vercel dashboard'a git
3. "New Project" butonuna tıkla
4. GitHub reposunu seç
5. **Root Directory'yi `website` olarak ayarla** (önemli!)
6. "Deploy" butonuna tıkla
7. Deploy tamamlanana kadar bekle (1-2 dakika)

### Seçenek B: Vercel CLI ile (Hızlı)

```bash
# 1. Vercel CLI'yi yükle
npm install -g vercel

# 2. website klasörüne git
cd website

# 3. Deploy et
vercel

# İlk defa kullanıyorsan:
# - Email adresini gir
# - Verification code'u onayla
# - Proje ayarlarını kabul et

# Production'a deploy etmek için:
vercel --prod
```

## Adım 3: Custom Domain Ekle (bohoapp.online)

### Vercel'de Domain Ekle

1. Vercel project dashboard'a git
2. "Settings" sekmesine tıkla
3. "Domains" menüsüne git
4. `bohoapp.online` yaz ve ekle
5. DNS kayıtlarını kopyala

### Domain Sağlayıcında DNS Ayarları

Domain'ini satın aldığın yerde (GoDaddy, Namecheap, etc.) bu DNS kayıtlarını ekle:

#### A Kaydı (Root Domain için):
```
Type: A
Name: @ (veya boş)
Value: 76.76.21.21
TTL: Automatic veya 3600
```

#### CNAME Kaydı (WWW için):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Automatic veya 3600
```

### DNS Propagation

- DNS değişiklikleri 5 dakika - 48 saat arası sürebilir
- Genellikle 10-30 dakikada tamamlanır
- Kontrol etmek için: [whatsmydns.net](https://whatsmydns.net)

## Adım 4: SSL Sertifikası

Vercel otomatik olarak SSL sertifikası ekler:
- Domain ekledikten sonra 1-2 dakika içinde aktif olur
- Hem `bohoapp.online` hem `www.bohoapp.online` için çalışır
- Ücretsiz ve otomatik yenilenir

## Adım 5: Test Et

Deployment tamamlandıktan sonra:

```bash
# Domain'i test et
curl -I https://bohoapp.online

# Veya tarayıcıda aç:
# https://bohoapp.online
# https://www.bohoapp.online
```

## 🔄 Güncelleme Nasıl Yapılır?

### GitHub ile:
1. Değişiklikleri yap
2. Git'e commit et ve push'la
3. Vercel otomatik olarak yeni versiyonu deploy eder
4. 1-2 dakika içinde canlıya alınır

### Vercel CLI ile:
```bash
cd website
vercel --prod
```

## ⚙️ Önemli Ayarlar

### App Store Linklerini Güncelle

`public/index.html` dosyasını aç ve şu satırları bul:

```javascript
const IOS_STORE_URL = 'https://apps.apple.com/';
const ANDROID_STORE_URL = 'https://play.google.com/store';
```

Kendi app store linklerinle değiştir.

### Email Adreslerini Güncelle

`public/privacy-policy.html` dosyasında:

```html
<p><strong>Email:</strong> privacy@bohoapp.online</p>
<p><strong>Support:</strong> support@bohoapp.online</p>
```

## 📊 Analytics (Opsiyonel)

Vercel Analytics eklemek için:

1. Vercel dashboard'a git
2. Projeyi seç
3. "Analytics" sekmesine tıkla
4. "Enable" butonuna tıkla
5. Ücretsiz! Otomatik çalışır

## 🐛 Sorun Giderme

### Domain çalışmıyor
- DNS kayıtlarını kontrol et
- 24 saat bekle (DNS propagation)
- Vercel dashboard'da domain durumunu kontrol et

### Deployment başarısız
- Root directory'nin `website` olduğundan emin ol
- `vercel.json` dosyasının doğru konumda olduğunu kontrol et

### SSL çalışmıyor
- Domain'in DNS kayıtlarının doğru olduğundan emin ol
- 1-2 saat bekle
- Vercel otomatik olarak SSL ekler

## 📞 Destek

Sorun yaşarsan:
- [Vercel Discord](https://vercel.com/discord)
- [Vercel Support](https://vercel.com/support)
- Vercel documentation çok detaylı ve faydalı

## ✅ Checklist

Deployment öncesi:
- [ ] GitHub reposu oluşturuldu
- [ ] `website` klasörü repo'da
- [ ] Vercel hesabı oluşturuldu
- [ ] Domain satın alındı (bohoapp.online)

Deployment sonrası:
- [ ] Proje Vercel'de
- [ ] Domain eklendi
- [ ] DNS kayıtları güncellendi
- [ ] SSL aktif
- [ ] Site erişilebilir
- [ ] Privacy policy sayfası çalışıyor

## 🎉 Tamamlandı!

Artık siten `https://bohoapp.online` adresinde yayında!

Mobil uygulamanla entegre etmeyi unutma:
- App Store linklerini güncelle
- Deep linking ekle (opsiyonel)
- Social media'da paylaş
