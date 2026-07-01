/**
 * Test kullanıcısına push token ekle
 */
const admin = require('firebase-admin');
const serviceAccount = require('./nanobanana-max-firebase-adminsdk-fbsvc-f78ffefe54.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addTestToken() {
  try {
    // İlk kullanıcıyı al
    const usersSnapshot = await db.collection('users').limit(1).get();

    if (usersSnapshot.empty) {
      console.log('❌ Hiç kullanıcı yok!');
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    console.log(`\n📝 Test token ekleniyor...`);
    console.log(`Kullanıcı ID: ${userId}`);

    // Test Expo Push Token (gerçek olmayan ama format olarak geçerli)
    const testToken = 'ExponentPushToken[TEST-TOKEN-FOR-BROADCAST-TEST]';

    await db.collection('users').doc(userId).update({
      pushToken: testToken,
      pushTokenType: 'expo',
      pushTokenPlatform: 'ios',
      pushTokenLanguage: 'tr',
      language: 'tr',
      pushTokenUpdatedAt: admin.firestore.Timestamp.now(),
      notificationSettings: {
        enabled: true,
        analysisComplete: true,
        dailyReminder: true,
        weeklyTips: true,
        promotions: true,
      }
    });

    console.log('✅ Test token eklendi!');
    console.log('Token:', testToken);
    console.log('\n⚠️  NOT: Bu gerçek bir token değil, sadece test için!');
    console.log('Gerçek bildirim göndermek için uygulamayı açıp izin verin.\n');

  } catch (error) {
    console.error('❌ Hata:', error);
  }

  process.exit(0);
}

addTestToken();
