#!/bin/bash

# Firebase Deployment Script
# Bu script tüm Firebase servislerini deploy eder

set -e  # Hata durumunda dur

echo "🔥 Firebase Deployment Başlıyor..."
echo ""

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Firebase CLI kontrolü
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI bulunamadı!${NC}"
    echo "Yüklemek için: npm install -g firebase-tools"
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI bulundu${NC}"
echo ""

# Login kontrolü
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Firebase'e giriş yapmanız gerekiyor${NC}"
    firebase login
fi

echo -e "${GREEN}✅ Firebase'e giriş yapıldı${NC}"
echo ""

# Project seçimi
echo "📋 Firebase project seçiliyor..."
firebase use outfit-planner-bf4d8

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Deployment Başlıyor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Firestore Rules
echo "1️⃣  Firestore Rules deploy ediliyor..."
if firebase deploy --only firestore:rules; then
    echo -e "${GREEN}✅ Firestore Rules başarıyla deploy edildi${NC}"
else
    echo -e "${RED}❌ Firestore Rules deploy edilemedi${NC}"
    exit 1
fi
echo ""

# 2. Firestore Indexes
echo "2️⃣  Firestore Indexes deploy ediliyor..."
if firebase deploy --only firestore:indexes; then
    echo -e "${GREEN}✅ Firestore Indexes başarıyla deploy edildi${NC}"
else
    echo -e "${RED}❌ Firestore Indexes deploy edilemedi${NC}"
    exit 1
fi
echo ""

# 3. Storage Rules
echo "3️⃣  Storage Rules deploy ediliyor..."
if firebase deploy --only storage; then
    echo -e "${GREEN}✅ Storage Rules başarıyla deploy edildi${NC}"
else
    echo -e "${RED}❌ Storage Rules deploy edilemedi${NC}"
    exit 1
fi
echo ""

# 4. Remote Config (opsiyonel)
if [ -f "firebase-remote-config-template.json" ]; then
    echo "4️⃣  Remote Config deploy ediliyor..."
    if firebase deploy --only remoteconfig; then
        echo -e "${GREEN}✅ Remote Config başarıyla deploy edildi${NC}"
    else
        echo -e "${YELLOW}⚠️  Remote Config deploy edilemedi (opsiyonel)${NC}"
    fi
    echo ""
fi

# 5. Functions (varsa)
if [ -d "functions" ]; then
    echo "5️⃣  Cloud Functions deploy ediliyor..."
    echo -e "${YELLOW}⚠️  Bu işlem birkaç dakika sürebilir...${NC}"
    if firebase deploy --only functions; then
        echo -e "${GREEN}✅ Cloud Functions başarıyla deploy edildi${NC}"
    else
        echo -e "${YELLOW}⚠️  Cloud Functions deploy edilemedi (opsiyonel)${NC}"
    fi
    echo ""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Deployment Tamamlandı!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📊 Kontroller:"
echo "  1. Firestore Rules: https://console.firebase.google.com/project/outfit-planner-bf4d8/firestore/rules"
echo "  2. Firestore Indexes: https://console.firebase.google.com/project/outfit-planner-bf4d8/firestore/indexes"
echo "  3. Storage Rules: https://console.firebase.google.com/project/outfit-planner-bf4d8/storage/rules"
echo ""

echo -e "${GREEN}✅ Firebase servisleri production'a hazır!${NC}"
