/**
 * Broadcast Notification Test Script
 *
 * Bu script'i Firebase Functions'ı test etmek için kullanabilirsiniz.
 *
 * Kullanım:
 * 1. Firebase projenize login olun: firebase login
 * 2. Script'i çalıştırın: node broadcast-test.js
 */

const https = require('https');

// Firebase Functions URL'inizi buraya girin
const FIREBASE_FUNCTIONS_URL = 'https://europe-west1-<PROJECT_ID>.cloudfunctions.net';

// Admin secret key'inizi buraya girin (Firebase Secret Manager'dan alın)
const ADMIN_SECRET_KEY = 'your-admin-secret-key-here';

// ============================================
// 1. BASIT BROADCAST (Tek dil, tüm kullanıcılar)
// ============================================
async function sendSimpleBroadcast() {
  const data = JSON.stringify({
    adminKey: ADMIN_SECRET_KEY,
    title: '🎉 Yeni Güncelleme!',
    body: 'Uygulamada harika yeni özellikler sizi bekliyor!',
    language: 'tr', // Opsiyonel: sadece Türkçe kullanıcılara gönder
    data: {
      action: 'open_app',
      screen: 'home',
    }
  });

  const options = {
    hostname: FIREBASE_FUNCTIONS_URL.replace('https://', ''),
    path: '/sendBroadcast',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('✅ Basit broadcast gönderildi:');
        console.log(JSON.parse(body));
        resolve();
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ============================================
// 2. ÇOK DİLLİ BROADCAST (Her kullanıcı kendi dilinde alır)
// ============================================
async function sendLocalizedBroadcast() {
  const data = JSON.stringify({
    adminKey: ADMIN_SECRET_KEY,
    messages: {
      tr: {
        title: '🎉 Yeni Güncelleme!',
        body: 'Uygulamada harika yeni özellikler sizi bekliyor!',
      },
      en: {
        title: '🎉 New Update!',
        body: 'Amazing new features are waiting for you in the app!',
      },
    },
    data: {
      action: 'open_app',
      screen: 'home',
    }
  });

  const options = {
    hostname: FIREBASE_FUNCTIONS_URL.replace('https://', ''),
    path: '/sendLocalizedBroadcastNotification',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('✅ Çok dilli broadcast gönderildi:');
        console.log(JSON.parse(body));
        resolve();
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Test komutları
async function main() {
  console.log('=== BROADCAST NOTIFICATION TEST ===\n');

  try {
    // Basit broadcast gönder
    console.log('1. Basit broadcast gönderiliyor...');
    await sendSimpleBroadcast();
    console.log('');

    // Çok dilli broadcast gönder
    console.log('2. Çok dilli broadcast gönderiliyor...');
    await sendLocalizedBroadcast();
    console.log('');

    console.log('✅ Tüm testler tamamlandı!');
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

// Script'i çalıştır
if (require.main === module) {
  main();
}

module.exports = { sendSimpleBroadcast, sendLocalizedBroadcast };
