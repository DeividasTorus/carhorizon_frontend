// Set required Expo Router environment variables and require router entry
// We use require() so this module runs after environment variables are set.
process.env.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT || 'app';
process.env.EXPO_ROUTER_IMPORT_MODE = process.env.EXPO_ROUTER_IMPORT_MODE || 'sync';

require('expo-router/entry');
