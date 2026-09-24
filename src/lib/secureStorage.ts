import * as SecureStore from 'expo-secure-store';

// expo-secure-store (iOS Keychain) warns above ~2 KB per value and a Supabase
// session can exceed that, so values are split across numbered keys.
const CHUNK = 1800;

// SecureStore keys may only contain alphanumerics, ".", "-" and "_".
const safe = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

export const chunkedSecureStorage = {
  async getItem(key: string): Promise<string | null> {
    const k = safe(key);
    const count = await SecureStore.getItemAsync(`${k}.n`);
    if (!count) return null;
    const parts: string[] = [];
    for (let i = 0; i < Number(count); i++) {
      const part = await SecureStore.getItemAsync(`${k}.${i}`);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    const k = safe(key);
    await this.removeItem(key);
    const n = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < n; i++) {
      await SecureStore.setItemAsync(`${k}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
    await SecureStore.setItemAsync(`${k}.n`, String(n));
  },
  async removeItem(key: string): Promise<void> {
    const k = safe(key);
    const count = await SecureStore.getItemAsync(`${k}.n`);
    for (let i = 0; i < Number(count ?? 0); i++) await SecureStore.deleteItemAsync(`${k}.${i}`);
    await SecureStore.deleteItemAsync(`${k}.n`);
  },
};
