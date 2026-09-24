// POST {} with a user's access token -> sync that user now (pull-to-refresh).
// POST {"all": true} with x-cron-secret -> sync every connected user (pg_cron).
import { requireUserId } from '../_shared/auth.ts';
import { allProviderCreds } from '../_shared/config.ts';
import { getSql } from '../_shared/db.ts';
import { optionalEnv } from '../_shared/env.ts';
import { json, serve } from '../_shared/http.ts';
import { syncUser } from '../_shared/sync.ts';

// Leave headroom under the Edge Function wall-clock limit.
const CRON_BUDGET_MS = 100_000;

serve(async (req) => {
  const sql = getSql();
  const deps = { sql, fetch, creds: allProviderCreds() };

  const cronSecret = optionalEnv('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') === cronSecret) {
    const started = Date.now();
    // Least recently synced first, so everyone gets a turn if we run out of time.
    const users = await sql<{ user_id: string }[]>`
      select user_id from public.connections
      group by user_id order by min(coalesce(last_synced_at, 'epoch')) asc`;
    let done = 0;
    for (const { user_id } of users) {
      if (Date.now() - started > CRON_BUDGET_MS) break;
      await syncUser(deps, user_id);
      done++;
    }
    return json({ users: users.length, synced: done });
  }

  const userId = await requireUserId(req);
  return json(await syncUser(deps, userId));
});
