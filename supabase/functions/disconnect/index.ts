// POST { provider } -> revoke (Strava) and forget the user's tokens.
// Already-computed sessions are kept.
import { requireUserId } from '../_shared/auth.ts';
import { getSql } from '../_shared/db.ts';
import { HttpError, json, serve } from '../_shared/http.ts';
import { stravaDeauthorize } from '../_shared/providers.ts';
import { getAccessToken } from '../_shared/sync.ts';
import { allProviderCreds } from '../_shared/config.ts';

serve(async (req) => {
  const userId = await requireUserId(req);
  const { provider } = await req.json().catch(() => ({}));
  if (provider !== 'spotify' && provider !== 'strava') throw new HttpError(400, 'Unknown provider');

  const sql = getSql();
  if (provider === 'strava') {
    // Spotify has no revoke endpoint; users remove access at spotify.com/account/apps.
    try {
      const token = await getAccessToken({ sql, fetch, creds: allProviderCreds() }, userId, 'strava');
      if (token) await stravaDeauthorize(fetch, token);
    } catch (err) {
      console.error('Strava deauthorize failed', err);
    }
  }
  await sql.begin(async (tx) => {
    await tx`delete from private.oauth_tokens where user_id = ${userId} and provider = ${provider}`;
    await tx`delete from private.sync_state where user_id = ${userId} and provider = ${provider}`;
    await tx`delete from public.connections where user_id = ${userId} and provider = ${provider}`;
  });
  return json({ ok: true });
});
