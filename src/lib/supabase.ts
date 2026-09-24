import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isLiveMode, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';
import { chunkedSecureStorage } from './secureStorage';

let client: SupabaseClient | null = null;

/** The Supabase client. Only call in live mode (see isLiveMode). */
export function getSupabase(): SupabaseClient {
  if (!isLiveMode) throw new Error('Supabase is not configured (demo mode)');
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Web uses localStorage (the default); native uses the Keychain.
        storage: Platform.OS === 'web' ? undefined : chunkedSecureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    // Only refresh tokens while the app is in the foreground (Supabase RN guidance).
    if (Platform.OS !== 'web') {
      AppState.addEventListener('change', (state) => {
        if (state === 'active') client?.auth.startAutoRefresh();
        else client?.auth.stopAutoRefresh();
      });
    }
  }
  return client;
}
