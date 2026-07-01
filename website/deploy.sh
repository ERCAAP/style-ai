#!/bin/bash

# Boho App Website - Quick Deploy Script
# =======================================

echo "🚀 Boho App Website Deployment"
echo "================================"
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI bulunamadı!"
    echo ""
    echo "Yüklemek için:"
    echo "  npm install -g vercel"
    echo ""
    exit 1
fi

echo "✅ Vercel CLI bulundu"
echo ""

# Confirm deployment
echo "📦 Deploy edilecek:"
echo "   Domain: bohoapp.online"
echo "   Environment: Production"
echo ""
read -p "Devam etmek istiyor musun? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Deployment iptal edildi"
    exit 0
fi

echo ""
echo "🔨 Deployment başlatılıyor..."
echo ""

# Deploy to production
vercel --prod

echo ""
echo "✅ Deployment tamamlandı!"
echo ""
echo "🌐 Site şu adreste yayında:"
echo "   https://bohoapp.online"
echo ""
echo "📊 Kontrol için:"
echo "   • https://bohoapp.online"
echo "   • https://www.bohoapp.online"
echo ""
echo "🎉 Başarılı!"
