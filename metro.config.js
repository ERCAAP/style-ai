const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Firebase compatibility fix for Expo SDK 53+
// Add 'cjs' extension support for Firebase modules
config.resolver.sourceExts.push('cjs');

// Disable package exports to fix Firebase Auth resolution
config.resolver.unstable_enablePackageExports = false;

// Functions klasörünü Metro bundler'dan hariç tut (node_modules hariç)
config.resolver.blockList = [
  // Sadece root seviyesindeki functions klasörünü engelle, node_modules içindekileri değil
  new RegExp(`^${path.resolve(__dirname, 'functions')}/.*`),
];

// Watchman'e functions klasörünü izlememesini söyle
config.watchFolders = [__dirname];

module.exports = config;
