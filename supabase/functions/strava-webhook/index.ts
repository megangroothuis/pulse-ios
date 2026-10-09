// Strava webhook callback: a new activity syncs that athlete's Pulse user
// (Spotify plays, the workout, sessions). Register the subscription once; see
// BACKEND_SETUP.md section 6.
import { allProviderCreds, tempoAnalyzer } from '../_shared/config.ts';
import { getSql } from '../_shared/db.ts';
import { env, optionalEnv } from '../_shared/env.ts';
import { handleStravaWebhook } from '../_shared/stravaWebhook.ts';
import { syncUser } from '../_shared/sync.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

Deno.serve(async (req) => {
  const body = req.method === 'POST' ? await req.json().catch(() => null) : null;
  const sql = getSql();
  const { response, background } = handleStravaWebhook(req, body, {
    verifyToken: env('STRAVA_WEBHOOK_VERIFY_TOKEN'),
    subscriptionId: optionalEnv('STRAVA_WEBHOOK_SUBSCRIPTION_ID'),
    userForAthlete: async (athleteId) => {
      const [row] = await sql<{ user_id: string }[]>`
        select user_id from public.connections
        where provider = 'strava' and provider_user_id = ${athleteId}
        limit 1`;
      return row?.user_id ?? null;
    },
    syncUser: (userId) => syncUser({ sql, fetch, creds: allProviderCreds(), analyzeTempo: tempoAnalyzer() }, userId),
  });
  if (background) {
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(background);
    else await background;
  }
  return response;
});
