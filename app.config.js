const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY switch the app from
// demo mode (mock data) to live mode. See BACKEND_SETUP.md.

module.exports = {
  expo: {
    name: "Pulse",
    slug: "pulse",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    scheme: "pulse",
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.pulse.app",
      usesAppleSignIn: true
    },
    android: {
      package: "com.pulse.app"
    },
    web: {
      bundler: "metro",
      favicon: "./assets/pulselogo.png"
    },
    plugins: [
      "expo-secure-store",
      "expo-web-browser",
      "expo-apple-authentication"
    ]
  }
};
