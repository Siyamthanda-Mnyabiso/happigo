const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const config = getDefaultConfig(__dirname);

// The web app's pure logic (money, pricing, cart rules, order statuses) lives in ../src/lib.
// Both apps import the same files, so a pricing rule is fixed in one place.
const shared = path.resolve(__dirname, '../src/lib');
config.watchFolders = [shared, path.resolve(__dirname, '../native-shared')];
config.resolver.extraNodeModules = new Proxy(
  {},
  { get: (_, name) => path.join(__dirname, 'node_modules', String(name)) },
);
module.exports = config;
