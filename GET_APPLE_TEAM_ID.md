# 🍎 Apple Team ID Nasıl Alınır

Apple Team ID'nizi almak için aşağıdaki yöntemlerden birini kullanabilirsiniz:

## Yöntem 1: Apple Developer Portal (En Kolay)

1. [Apple Developer Portal](https://developer.apple.com/account) adresine gidin
2. Hesabınızla giriş yapın
3. Sol menüden **"Membership"** sekmesine tıklayın
4. **"Team ID"** alanında 10 karakterli ID'nizi göreceksiniz (örnek: `9VHZC2S946`)

## Yöntem 2: Xcode

1. Xcode'u açın
2. **Xcode > Preferences > Accounts** menüsüne gidin
3. Apple ID hesabınızı seçin
4. Sağ tarafta **"Manage Certificates"** butonunun altında Team ID'yi göreceksiniz

## Yöntem 3: Terminal (macOS)

```bash
# App Store Connect API Key kullanarak
security find-identity -v -p codesigning

# veya daha basit:
cd ios
xcodebuild -showBuildSettings | grep DEVELOPMENT_TEAM
```

## ⚙️ Team ID'yi Güncellemek

Team ID'nizi aldıktan sonra:

### 1. Apple App Site Association dosyasını güncelleyin

**Dosya:** `website/public/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "YOUR_TEAM_ID.com.outfit.planner.app",
      "paths": ["/user", "/user/*"]
    }]
  }
}
```

`YOUR_TEAM_ID` kısmını gerçek Team ID'nizle değiştirin.

**Örnek:**
```json
"appID": "9VHZC2S946.com.outfit.planner.app"
```

### 2. Website'i yeniden deploy edin

```bash
cd website
vercel --prod
```

### 3. App'i yeniden build edin

```bash
# iOS
eas build --profile production --platform ios

# Veya development build
eas build --profile development --platform ios
```

## ✅ Doğrulama

Güncellemeden sonra doğrulamak için:

```bash
# URL'i test edin
curl https://bohoapp.online/.well-known/apple-app-site-association

# Sonuç JSON formatında olmalı ve Team ID'niz görünmeli
```

## 🚨 Dikkat

- Team ID 10 karakter uzunluğundadır
- Büyük harfler ve rakamlardan oluşur
- Bundle ID ile karıştırmayın (Bundle ID: `com.outfit.planner.app`)
- App ID şu formatta olmalı: `TEAM_ID.BUNDLE_ID`

## 📚 Daha Fazla Bilgi

- [Apple Universal Links Documentation](https://developer.apple.com/ios/universal-links/)
- [Associated Domains Entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_associated-domains)
