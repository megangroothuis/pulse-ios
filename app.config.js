const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Debug: Check if env vars are loaded
console.log('app.config.js - Environment check:');
console.log('  SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? `${process.env.EXPO_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'MISSING');
console.log('  SUPABASE_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'LOADED' : 'MISSING');

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
      bundleIdentifier: "com.pulse.app"
    },
    android: {
      package: "com.pulse.app"
    },
    web: {
      favicon: "./assets/pulselogo.png"
    },
    extra: {
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    plugins: [
      "expo-secure-store",
      "expo-web-browser"
    ]
  }
};
