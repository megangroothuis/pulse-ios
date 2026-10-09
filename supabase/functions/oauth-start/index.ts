// POST { provider: 'spotify' | 'strava', returnTo: string } -> { url }
// The app opens `url` in a browser; the provider redirects to oauth-callback.
import { requireUserId } from '../_shared/auth.ts';
import { oauthCallbackUrl, providerCreds, returnToAllowList } from '../_shared/config.ts';
import { env } from '../_shared/env.ts';
import { HttpError, json, serve } from '../_shared/http.ts';
import { isAllowedReturnTo, signState } from '../_shared/oauthState.ts';
import { spotifyAuthorizeUrl, stravaAuthorizeUrl } from '../_shared/providers.ts';

serve(async (req) => {
  const userId = await requireUserId(req);
  const { provider, returnTo } = await req.json().catch(() => ({}));
  if (provider !== 'spotify' && provider !== 'strava') throw new HttpError(400, 'Unknown provider');
  if (typeof returnTo !== 'string' || !isAllowedReturnTo(returnTo, returnToAllowList())) {
    throw new HttpError(400, 'returnTo is not an allowed app URL');
  }

  const state = await signState(
    { userId, provider, returnTo, exp: Math.floor(Date.now() / 1000) + 600 },
    env('OAUTH_STATE_SECRET'),
  );
  const creds = providerCreds(provider);
  const url = provider === 'spotify'
    ? spotifyAuthorizeUrl(creds, oauthCallbackUrl(), state)
    : stravaAuthorizeUrl(creds, oauthCallbackUrl(), state);
  return json({ url });
});
