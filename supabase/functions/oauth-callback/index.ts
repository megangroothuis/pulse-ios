// GET redirect target registered with Spotify and Strava. Exchanges the code
// for tokens server-side (client secrets never reach the app), stores them,
// starts a first sync, then sends the user back to the app.
import { allProviderCreds, oauthCallbackUrl, providerCreds, returnToAllowList, tempoAnalyzer } from '../_shared/config.ts';
import { getSql } from '../_shared/db.ts';
import { env } from '../_shared/env.ts';
import { isAllowedReturnTo, OAuthState, verifyState } from '../_shared/oauthState.ts';
import { spotifyExchangeCode, spotifyMe, stravaExchangeCode, TokenSet } from '../_shared/providers.ts';
import { saveTokens, syncUser } from '../_shared/sync.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

function back(returnTo: string, params: Record<string, string>): Response {
  const url = new URL(returnTo);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

Deno.serve(async (req) => {
  const q = new URL(req.url).searchParams;
  let state: OAuthState;
  try {
    state = await verifyState(q.get('state') ?? '', env('OAUTH_STATE_SECRET'));
    if (!isAllowedReturnTo(state.returnTo, returnToAllowList())) throw new Error('returnTo not allowed');
  } catch (err) {
    console.error('oauth-callback: bad state', err);
    return new Response('This sign-in link is invalid or has expired. Return to Pulse and try again.', {
      status: 400,
    });
  }

  const { userId, provider, returnTo } = state;
  if (q.get('error') || !q.get('code')) {
    return back(returnTo, { provider, status: 'cancelled' });
  }

  try {
    const code = q.get('code')!;
    const creds = providerCreds(provider);
    let tokens: TokenSet;
    let accountId: string | null = null;
    let displayName: string | null = null;
    let scopes: string | null = null;

    if (provider === 'spotify') {
      tokens = await spotifyExchangeCode(fetch, creds, code, oauthCallbackUrl());
      const me = await spotifyMe(fetch, tokens.accessToken);
      accountId = me.id;
      displayName = me.display_name;
      scopes = tokens.scopes ?? null;
    } else {
      // Strava lets the user untick scopes; without activity access there is nothing to sync.
      scopes = q.get('scope');
      if (!scopes?.includes('activity:read')) return back(returnTo, { provider, status: 'missing_scope' });
      const res = await stravaExchangeCode(fetch, creds, code);
      tokens = res.tokens;
      accountId = res.athlete ? String(res.athlete.id) : null;
      displayName = res.athlete ? [res.athlete.firstname, res.athlete.lastname].filter(Boolean).join(' ') : null;
    }

    const sql = getSql();
    await saveTokens(sql, userId, provider, tokens);
    await sql`
      insert into public.connections (user_id, provider, provider_user_id, provider_display_name, scopes, connected_at, last_error)
      values (${userId}, ${provider}, ${accountId}, ${displayName}, ${scopes}, now(), null)
      on conflict (user_id, provider) do update set
        provider_user_id = excluded.provider_user_id, provider_display_name = excluded.provider_display_name,
        scopes = excluded.scopes, connected_at = now(), last_error = null`;

    // First sync in the background so the redirect isn't delayed.
    const first = syncUser({ sql, fetch, creds: allProviderCreds(), analyzeTempo: tempoAnalyzer() }, userId).catch((e) => console.error(e));
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(first);

    return back(returnTo, { provider, status: 'connected' });
  } catch (err) {
    console.error(`oauth-callback: ${provider} exchange failed`, err);
    return back(returnTo, { provider, status: 'error' });
  }
});
