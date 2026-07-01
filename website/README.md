# Boho App Website

Modern, responsive website for Boho App - AI Fashion Style Analyzer

## 🚀 Quick Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Navigate to website folder:
```bash
cd website
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts and deploy!

### Method 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Set root directory to `website`
5. Click "Deploy"

## 🌐 Custom Domain Setup (bohoapp.online)

1. Go to your Vercel project dashboard
2. Click "Settings" → "Domains"
3. Add your domain: `bohoapp.online`
4. Add these DNS records to your domain registrar:

### For Root Domain (bohoapp.online):
```
Type: A
Name: @
Value: 76.76.21.21
```

### For WWW Subdomain (www.bohoapp.online):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

5. Wait for DNS propagation (up to 48 hours, usually much faster)

## 📁 Project Structure

```
website/
├── public/
│   ├── index.html          # Main landing page
│   └── privacy-policy.html # Privacy & Terms page
├── vercel.json             # Vercel configuration
└── README.md               # This file
```

## ✨ Features

- **Responsive Design**: Works perfectly on all devices
- **Modern UI**: Gradient-based design with smooth animations
- **SEO Optimized**: Meta tags and structured data
- **Fast Loading**: Minimal dependencies, optimized performance
- **Privacy First**: Comprehensive privacy policy

## 🎨 Customization

### Update App Store Links

Edit `index.html` and update these variables:

```javascript
const IOS_STORE_URL = 'YOUR_IOS_APP_STORE_LINK';
const ANDROID_STORE_URL = 'YOUR_ANDROID_PLAY_STORE_LINK';
```

### Change Colors

The main color gradient is defined in CSS:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Update Content

- Edit `index.html` for main page content
- Edit `privacy-policy.html` for legal pages
- All content is in HTML, easy to modify

## 🔧 Local Development

Simply open `public/index.html` in your browser, or use a local server:

```bash
# Using Python
cd public
python -m http.server 8000

# Using Node.js
npx serve public

# Using PHP
cd public
php -S localhost:8000
```

Then visit: `http://localhost:8000`

## 📱 App Features Highlighted

1. **Outfit Analysis** - AI-powered fashion analysis
2. **Virtual Try-On** - See clothes before buying
3. **Style Recommendations** - Personalized suggestions
4. **Smart Wardrobe** - Digital wardrobe management
5. **Color Matching** - Perfect color combinations
6. **Trend Insights** - Stay fashion-forward

## 🔒 Security

- HTTPS enforced by Vercel
- Security headers configured
- No sensitive data stored
- Privacy-focused design

## 📊 Analytics (Optional)

To add Vercel Analytics:

1. Go to Vercel project dashboard
2. Click "Analytics" tab
3. Enable analytics
4. Automatic tracking starts

## 🆘 Support

For questions or issues:
- Email: support@bohoapp.online
- Privacy: privacy@bohoapp.online

## 📄 License

© 2026 Boho App. All rights reserved.
