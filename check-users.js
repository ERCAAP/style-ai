/**
 * Kullanıcı sayısını kontrol et
 */
const admin = require('firebase-admin');
const serviceAccount = require('./nanobanana-max-firebase-adminsdk-fbsvc-f78ffefe54.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUsers() {
  console.log('=== KULLANICI DURUMU ===\n');

  // Tüm kullanıcıları al
  const allUsers = await db.collection('users').get();
  console.log(`📊 Toplam kullanıcı: ${allUsers.size}`);

  // Push token olanları say
  let withToken = 0;
  let withoutToken = 0;
  let notificationsEnabled = 0;
  let notificationsDisabled = 0;

  allUsers.forEach(doc => {
    const data = doc.data();
    if (data.pushToken) {
      withToken++;
      const notifSettings = data.notificationSettings || {};
      if (notifSettings.enabled !== false) {
        notificationsEnabled++;
      } else {
        notificationsDisabled++;
      }
    } else {
      withoutToken++;
    }
  });

  console.log(`✅ Push token olan: ${withToken}`);
  console.log(`❌ Push token olmayan: ${withoutToken}`);
  console.log(`🔔 Bildirimler açık: ${notificationsEnabled}`);
  console.log(`🔕 Bildirimler kapalı: ${notificationsDisabled}`);

  // Örnek kullanıcıları göster
  if (withToken > 0) {
    console.log('\n=== ÖRNEK KULLANICILAR ===');
    let count = 0;
    for (const doc of allUsers.docs) {
      if (count >= 5) break; // İlk 5 kullanıcıyı göster
      const data = doc.data();
      if (data.pushToken) {
        console.log(`\n👤 ${doc.id}`);
        console.log(`  Dil: ${data.language || 'bilinmiyor'}`);
        console.log(`  Platform: ${data.pushTokenPlatform || 'bilinmiyor'}`);
        console.log(`  Token tipi: ${data.pushTokenType || 'bilinmiyor'}`);
        console.log(`  Bildirimler: ${data.notificationSettings?.enabled !== false ? 'Açık' : 'Kapalı'}`);
        count++;
      }
    }
  }

  process.exit(0);
}

checkUsers().catch(console.error);
