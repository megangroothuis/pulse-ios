// EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY switch the app from
// demo mode (mock data) to live mode. See BACKEND_SETUP.md. Expo CLI loads
// .env itself; EXPO_NO_DOTENV=1 turns that off (scripts/verify.sh uses it).

module.exports = {
  expo: {
    name: "Pulse",
    slug: "pulse",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    icon: "./assets/icon.png",
    scheme: "pulse",
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      // App Store bundle IDs are global; "com.pulse.app" is taken. If you change
      // this, also update the Apple provider's Client IDs in Supabase Auth.
      bundleIdentifier: "com.megangroothuis.pulse",
      usesAppleSignIn: true,
      infoPlist: {
        // Only standard HTTPS: skips the export-compliance question on every upload.
        ITSAppUsesNonExemptEncryption: false
      },
      // Required-reason API declarations (React Native / Expo modules).
      // App Store Connect rejects uploads without them.
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp", NSPrivacyAccessedAPITypeReasons: ["C617.1", "0A2A.1", "3B52.1"] },
          { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults", NSPrivacyAccessedAPITypeReasons: ["CA92.1"] },
          { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace", NSPrivacyAccessedAPITypeReasons: ["E174.1", "85F4.1"] },
          { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime", NSPrivacyAccessedAPITypeReasons: ["35F9.1"] }
        ],
        NSPrivacyCollectedDataTypes: [],
        NSPrivacyTracking: false
      }
    },
    android: {
      package: "com.megangroothuis.pulse"
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
