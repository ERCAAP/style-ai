# 🚀 Hızlı Başlangıç - Boho App Website

## 📦 Dosya Yapısı

```
website/
├── public/
│   ├── index.html          ✅ Ana sayfa
│   ├── privacy-policy.html ✅ Gizlilik politikası
│   ├── robots.txt          ✅ SEO için
│   └── sitemap.xml         ✅ SEO için
├── vercel.json             ✅ Vercel ayarları
├── package.json            ✅ Proje bilgileri
├── DEPLOYMENT.md           📖 Detaylı deployment rehberi
├── README.md               📖 Genel bilgiler
└── QUICKSTART.md           📖 Bu dosya
```

## ⚡ 3 Adımda Deploy Et

### 1️⃣ Vercel CLI Yükle
```bash
npm install -g vercel
```

### 2️⃣ Website Klasörüne Git
```bash
cd website
```

### 3️⃣ Deploy Et
```bash
vercel --prod
```

İşte bu kadar! 🎉

## 🌐 Domain Ayarla (bohoapp.online)

### Vercel'de:
1. Dashboard > Settings > Domains
2. `bohoapp.online` ekle

### Domain Sağlayıcında (GoDaddy, Namecheap vs.):

**A Kaydı:**
- Type: A
- Name: @
- Value: 76.76.21.21

**CNAME Kaydı:**
- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com

10-30 dakika içinde aktif olur! ⏱️

## 🎨 Özelleştirme

### App Store Linklerini Güncelle

`public/index.html` dosyasını aç ve değiştir:

```javascript
// Satır ~385-386 civarında
const IOS_STORE_URL = 'BURAYA_IOS_LINK';
const ANDROID_STORE_URL = 'BURAYA_ANDROID_LINK';
```

### Email Adreslerini Güncelle

`public/privacy-policy.html` dosyasında email adreslerini değiştir.

### Renkleri Değiştir

Ana gradient rengi (her iki dosyada):
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## 📱 Özellikler

Web sitesi şunları içeriyor:

✅ **Modern Tasarım**
- Gradient-based modern UI
- Smooth animations
- Fully responsive

✅ **SEO Optimize**
- Meta tags
- Open Graph
- Sitemap & robots.txt

✅ **Sayfalar**
- Ana sayfa (features, how it works)
- Privacy Policy
- Terms of Service

✅ **Özellikler Bölümü**
- 👗 Outfit Analysis
- ✨ Virtual Try-On
- 🎨 Style Recommendations
- 📸 Smart Wardrobe
- 🌈 Color Matching
- 💡 Trend Insights

## 🧪 Local Test

```bash
# Python ile
cd public
python3 -m http.server 8000

# Sonra tarayıcıda aç:
# http://localhost:8000
```

## 📊 Analytics Ekle (Opsiyonel)

1. Vercel Dashboard'da
2. Analytics sekmesi
3. Enable butonuna tıkla
4. Ücretsiz! 📈

## ✅ Deployment Checklist

Deployment öncesi:
- [ ] Vercel hesabı var
- [ ] Domain satın alındı (bohoapp.online)
- [ ] App store linkleri güncellendi
- [ ] Email adresleri güncellendi

Deployment:
- [ ] `vercel --prod` çalıştırıldı
- [ ] Domain Vercel'e eklendi
- [ ] DNS kayıtları güncellendi

Test:
- [ ] https://bohoapp.online açılıyor
- [ ] Privacy policy sayfası çalışıyor
- [ ] Mobil'de düzgün görünüyor
- [ ] SSL aktif (🔒 ikonu var)

## 🆘 Sorun mu Var?

### Site açılmıyor
1. DNS kayıtlarını kontrol et
2. 1-2 saat bekle
3. Vercel dashboard'da domain statusü yeşil mi?

### Deployment hatası
1. Root directory `website` mi?
2. `vercel.json` dosyası var mı?

### Başka sorun?
Detaylı rehber: `DEPLOYMENT.md` dosyasına bak

## 🎉 Başarılı Deploy Sonrası

Siteni paylaş:
- 📱 App store sayfalarından link ver
- 📣 Social media'da duyur
- 🔗 Email imzana ekle

## 📞 İletişim

Website ile ilgili sorular:
- support@bohoapp.online

---

**Pro Tip:** Her değişiklik yaptığında sadece git push yapman yeterli.
Vercel otomatik olarak yeni versiyonu deploy eder! 🚀
