import { env, optionalEnv } from './env.ts';
import type { Provider, ProviderCredentials } from './providers.ts';

export function providerCreds(provider: Provider): ProviderCredentials {
  const p = provider.toUpperCase();
  return { clientId: env(`${p}_CLIENT_ID`), clientSecret: env(`${p}_CLIENT_SECRET`) };
}

export function allProviderCreds() {
  const get = (p: Provider) => (optionalEnv(`${p.toUpperCase()}_CLIENT_ID`) ? providerCreds(p) : undefined);
  return { spotify: get('spotify'), strava: get('strava') };
}

/** The one redirect URI registered with Spotify and Strava. */
export const oauthCallbackUrl = () => `${env('SUPABASE_URL')}/functions/v1/oauth-callback`;

/** Where the callback may send the user back to (see isAllowedReturnTo). */
export const returnToAllowList = () =>
  ['pulse', ...(optionalEnv('APP_REDIRECT_URLS') ?? '').split(',').map((s) => s.trim())].filter(Boolean);

/**
 * Calls the analyze-tempo function for one track. Each call gets its own CPU
 * budget, which audio decoding needs. Undefined when CRON_SECRET isn't set.
 */
export function tempoAnalyzer(): ((trackId: string) => Promise<void>) | undefined {
  const secret = optionalEnv('CRON_SECRET');
  if (!secret) return undefined;
  return async (trackId: string) => {
    const res = await fetch(`${env('SUPABASE_URL')}/functions/v1/analyze-tempo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cron-secret': secret },
      body: JSON.stringify({ trackId }),
    });
    if (!res.ok) throw new Error(`analyze-tempo ${res.status}: ${(await res.text()).slice(0, 200)}`);
  };
}
