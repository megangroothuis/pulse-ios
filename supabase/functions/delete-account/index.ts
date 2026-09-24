// POST {} -> permanently delete the signed-in user's account and all their data
// (App Store guideline 5.1.1(v) requires in-app account deletion). Every table
// references auth.users with ON DELETE CASCADE, so deleting the auth user
// removes profiles, connections, tokens, plays, workouts and sessions.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireUserId } from '../_shared/auth.ts';
import { allProviderCreds } from '../_shared/config.ts';
import { getSql } from '../_shared/db.ts';
import { env } from '../_shared/env.ts';
import { HttpError, json, serve } from '../_shared/http.ts';
import { stravaDeauthorize } from '../_shared/providers.ts';
import { getAccessToken } from '../_shared/sync.ts';

serve(async (req) => {
  const userId = await requireUserId(req);

  // Best effort: revoke Strava access before the tokens are gone.
  try {
    const token = await getAccessToken({ sql: getSql(), fetch, creds: allProviderCreds() }, userId, 'strava');
    if (token) await stravaDeauthorize(fetch, token);
  } catch (err) {
    console.error('Strava deauthorize failed', err);
  }

  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new HttpError(500, `Could not delete account: ${error.message}`);
  return json({ ok: true });
});
