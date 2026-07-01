const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceIcon = './assets/images/Voo_AppIcon.png';
const assetsDir = './assets/images';

async function generateIcons() {
  console.log('🎨 Icon oluşturma başladı...\n');

  // 1. iOS App Icon (1024x1024)
  console.log('📱 iOS icon oluşturuluyor...');
  await sharp(sourceIcon)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('✅ icon.png oluşturuldu (1024x1024)');

  // 2. Android Adaptive Icon - Foreground (1024x1024)
  console.log('\n🤖 Android adaptive icon foreground oluşturuluyor...');
  await sharp(sourceIcon)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(assetsDir, 'android-icon-foreground.png'));
  console.log('✅ android-icon-foreground.png oluşturuldu');

  // 3. Android Adaptive Icon - Background (1024x1024 logo ile)
  console.log('\n🎨 Android adaptive icon background oluşturuluyor...');
  await sharp(sourceIcon)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(assetsDir, 'android-icon-background.png'));
  console.log('✅ android-icon-background.png oluşturuldu');

  // 4. Android Monochrome Icon (1024x1024)
  console.log('\n⚫ Android monochrome icon oluşturuluyor...');
  await sharp(sourceIcon)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .greyscale()
    .png()
    .toFile(path.join(assetsDir, 'android-icon-monochrome.png'));
  console.log('✅ android-icon-monochrome.png oluşturuldu');

  // 5. Splash Screen Icon (200x200)
  console.log('\n💦 Splash screen icon oluşturuluyor...');
  await sharp(sourceIcon)
    .resize(200, 200, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('✅ splash-icon.png oluşturuldu (200x200)');

  // 6. Favicon (48x48)
  console.log('\n🌐 Favicon oluşturuluyor...');
  await sharp(sourceIcon)
    .resize(48, 48, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✅ favicon.png oluşturuldu (48x48)');

  console.log('\n🎉 Tüm icon\'lar başarıyla oluşturuldu!');
  console.log('\n📋 Oluşturulan dosyalar:');
  console.log('  - icon.png (iOS app icon)');
  console.log('  - android-icon-foreground.png');
  console.log('  - android-icon-background.png');
  console.log('  - android-icon-monochrome.png');
  console.log('  - splash-icon.png');
  console.log('  - favicon.png');
}

generateIcons().catch(err => {
  console.error('❌ Hata:', err);
  process.exit(1);
});
