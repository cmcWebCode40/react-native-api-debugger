const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const root = path.resolve(__dirname, '..');

module.exports = (async () => {
  const { withMetroConfig } = await import('react-native-monorepo-config');

  /**
   * Metro configuration
   * https://facebook.github.io/metro/docs/configuration
   *
   * @type {import('metro-config').MetroConfig}
   */
  const config = withMetroConfig(getDefaultConfig(__dirname), {
    root,
    dirname: __dirname,
  });

  config.resolver.unstable_enablePackageExports = true;

  return config;
})();
