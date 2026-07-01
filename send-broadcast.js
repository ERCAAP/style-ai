/**
 * Broadcast Notification Sender
 *
 * Bu script Firebase Admin SDK kullanarak doğrudan broadcast gönderir.
 *
 * Kullanım:
 * node send-broadcast.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./nanobanana-max-firebase-adminsdk-fbsvc-f78ffefe54.json');

// Firebase Admin SDK'yı başlat
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ============================================
// BROADCAST FONKSİYONLARI
// ============================================

/**
 * Basit broadcast - Tüm kullanıcılara aynı mesaj
 */
async function sendSimpleBroadcast(title, body, language = null) {
  console.log('\n=== BASIT BROADCAST GÖNDERILIYOR ===');
  console.log('Başlık:', title);
  console.log('İçerik:', body);
  console.log('Dil filtresi:', language || 'Tüm diller');

  try {
    // Kullanıcıları al
    let query = db.collection('users').where('pushToken', '!=', null);

    if (language) {
      query = query.where('language', '==', language);
    }

    const usersSnapshot = await query.get();
    console.log(`\nToplam ${usersSnapshot.size} kullanıcıya gönderilecek...`);

    if (usersSnapshot.size === 0) {
      console.log('❌ Push token olan kullanıcı bulunamadı!');
      return;
    }

    let sent = 0;
    let failed = 0;

    // 100'lük batch'ler halinde gönder
    const batchSize = 100;
    const users = usersSnapshot.docs;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`\nBatch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)} işleniyor...`);

      const promises = batch.map(async (userDoc) => {
        const userData = userDoc.data();

        // Bildirim ayarları kontrolü
        const notificationSettings = userData.notificationSettings || {};
        if (notificationSettings.enabled === false) {
          console.log(`  - ${userDoc.id}: Bildirimler kapalı, atlandı`);
          failed++;
          return;
        }

        const token = userData.pushToken;
        const tokenType = userData.pushTokenType || 'expo';
        const platform = userData.pushTokenPlatform || 'ios';

        try {
          if (platform === 'ios' && tokenType === 'expo') {
            // iOS - Expo Push
            await sendExpoPush(token, title, body);
            console.log(`  ✓ ${userDoc.id}: iOS bildirim gönderildi`);
            sent++;
          } else if (platform === 'android' && tokenType === 'fcm') {
            // Android - FCM
            await sendFCMPush(token, title, body);
            console.log(`  ✓ ${userDoc.id}: Android bildirim gönderildi`);
            sent++;
          } else {
            // Fallback - Expo
            await sendExpoPush(token, title, body);
            console.log(`  ✓ ${userDoc.id}: Bildirim gönderildi (fallback)`);
            sent++;
          }
        } catch (error) {
          console.log(`  ✗ ${userDoc.id}: Hata - ${error.message}`);
          failed++;
        }
      });

      await Promise.all(promises);

      // Batch'ler arası kısa bekleme
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n=== SONUÇ ===');
    console.log(`✅ Başarılı: ${sent}`);
    console.log(`❌ Başarısız: ${failed}`);
    console.log(`📊 Toplam: ${sent + failed}`);

  } catch (error) {
    console.error('❌ Broadcast hatası:', error);
  }
}

/**
 * Çok dilli broadcast - Her kullanıcı kendi dilinde alır
 */
async function sendLocalizedBroadcast(messages) {
  console.log('\n=== ÇOK DİLLİ BROADCAST GÖNDERILIYOR ===');
  console.log('TR:', messages.tr.title);
  console.log('EN:', messages.en.title);

  try {
    const usersSnapshot = await db.collection('users')
      .where('pushToken', '!=', null)
      .get();

    console.log(`\nToplam ${usersSnapshot.size} kullanıcıya gönderilecek...`);

    let sent = 0;
    let failed = 0;

    const promises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();

      // Bildirim ayarları kontrolü
      const notificationSettings = userData.notificationSettings || {};
      if (notificationSettings.enabled === false) {
        failed++;
        return;
      }

      // Kullanıcının dilini al
      const userLanguage = userData.language || userData.pushTokenLanguage || 'tr';
      const message = messages[userLanguage] || messages.tr;

      const token = userData.pushToken;
      const tokenType = userData.pushTokenType || 'expo';
      const platform = userData.pushTokenPlatform || 'ios';

      try {
        if (platform === 'ios' && tokenType === 'expo') {
          await sendExpoPush(token, message.title, message.body);
        } else if (platform === 'android' && tokenType === 'fcm') {
          await sendFCMPush(token, message.title, message.body);
        } else {
          await sendExpoPush(token, message.title, message.body);
        }
        sent++;
      } catch (error) {
        failed++;
      }
    });

    await Promise.all(promises);

    console.log('\n=== SONUÇ ===');
    console.log(`✅ Başarılı: ${sent}`);
    console.log(`❌ Başarısız: ${failed}`);
    console.log(`📊 Toplam: ${sent + failed}`);

  } catch (error) {
    console.error('❌ Broadcast hatası:', error);
  }
}

// ============================================
// PLATFORM-SPECIFIC SENDERS
// ============================================

/**
 * Expo Push gönder (iOS)
 */
async function sendExpoPush(token, title, body) {
  const fetch = (await import('node-fetch')).default;

  const message = {
    to: token,
    sound: 'default',
    title: title,
    body: body,
    data: { type: 'broadcast' },
    priority: 'high',
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  const result = await response.json();

  if (result.data?.[0]?.status !== 'ok') {
    throw new Error(result.data?.[0]?.message || 'Expo push failed');
  }
}

/**
 * FCM Push gönder (Android)
 */
async function sendFCMPush(token, title, body) {
  const message = {
    token: token,
    notification: {
      title: title,
      body: body,
    },
    data: {
      type: 'broadcast',
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'default',
        sound: 'default',
        priority: 'high',
      },
    },
  };

  await admin.messaging().send(message);
}

// ============================================
// ÖRNEK KULLANIM
// ============================================

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   BROADCAST BİLDİRİM SİSTEMİ              ║');
  console.log('╚═══════════════════════════════════════════╝');

  // Kullanmak istediğiniz yöntemi seçin:

  // ====== YÖNTEM 1: Basit Broadcast (Tek dil) ======
  await sendSimpleBroadcast(
    '🎉 Yeni Güncelleme!',
    'Uygulamada harika yeni özellikler sizi bekliyor!',
    null // 'tr', 'en' veya null (tüm diller) - null kullanıyoruz çünkü index yok
  );

  // ====== YÖNTEM 2: Çok Dilli Broadcast ======
  // await sendLocalizedBroadcast({
  //   tr: {
  //     title: '🎉 Yeni Güncelleme!',
  //     body: 'Uygulamada harika yeni özellikler sizi bekliyor!'
  //   },
  //   en: {
  //     title: '🎉 New Update!',
  //     body: 'Amazing new features are waiting for you in the app!'
  //   }
  // });

  console.log('\n✅ İşlem tamamlandı!');
  process.exit(0);
}

// Script'i çalıştır
main().catch((error) => {
  console.error('❌ Kritik hata:', error);
  process.exit(1);
});
