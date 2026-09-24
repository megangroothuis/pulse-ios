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
