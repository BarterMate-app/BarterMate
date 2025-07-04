const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  // Map aliases to folders, matching your tsconfig.json paths
  alias: {
    '@components': './src/components',
    '@screens': './src/screens',
    '@services': './src/services',
    '@constants': './src/constants',
    '@utils': './src/utils',
    '@navigation': './src/navigation',
  },
};

module.exports = config;
