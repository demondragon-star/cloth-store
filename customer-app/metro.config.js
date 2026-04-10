const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude admin-web folder from Metro bundler
config.watchFolders = [__dirname];
config.resolver.blockList = [
  /admin-web\/.*/,
  /\.next\/.*/,
];

module.exports = config;
