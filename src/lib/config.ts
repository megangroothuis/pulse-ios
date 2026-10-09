// Live mode = a Supabase project is configured. Without it the app runs on the
// bundled mock data (demo mode), which is what the cloud smoke test exercises.
//
// EXPO_PUBLIC_* values are inlined into the JS bundle at build time. Only the
// project URL and the anon (publishable) key belong here; every secret lives
// in Supabase Edge Function secrets.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// EXPO_PUBLIC_DEMO_MODE=1 forces demo mode even when .env has Supabase values
// (scripts/verify.sh uses it for the demo smoke test).
const forceDemo = process.env.EXPO_PUBLIC_DEMO_MODE === '1';

export const isLiveMode = !forceDemo && Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
