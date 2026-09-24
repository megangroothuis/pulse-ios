// Row-level security checks: what a signed-in user can and cannot touch.
// Run via scripts/test-functions.sh (needs TEST_DATABASE_URL).

import { assertEquals, assertRejects } from '@std/assert';
import postgres from 'npm:postgres@3';

const DB_URL = Deno.env.get('TEST_DATABASE_URL');
const A = '00000000-0000-0000-0000-0000000000c1';
const B = '00000000-0000-0000-0000-0000000000c2';

Deno.test({
  name: 'RLS: users only see and edit their own data; tokens are unreachable',
  ignore: !DB_URL,
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const sql = postgres(DB_URL!, { max: 1, onnotice: () => {} });
    try {
      await sql`insert into auth.users (id, email, raw_user_meta_data) values
        (${A}, 'a@example.com', '{}'), (${B}, 'b@example.com', '{"full_name":"Bee"}')`;
      const profiles = await sql`select display_name from public.profiles where id in (${A}, ${B}) order by id`;
      assertEquals(profiles.map((p) => p.display_name), ['a', 'Bee']);

      for (const [u, id] of [[A, 'c1'], [B, 'c2']]) {
        const [w] = await sql`insert into public.workouts (user_id, source, source_id, workout_type, started_at, elapsed_seconds)
          values (${u}, 'strava', ${id}, 'Running', now(), 60) returning id`;
        await sql`insert into public.sessions (user_id, workout_id, workout_type, started_at, duration_seconds, title)
          values (${u}, ${w.id}, 'Running', now(), 60, ${'session ' + id})`;
      }
      await sql`insert into private.oauth_tokens values (${A}, 'spotify', 'at', 'rt', now(), now())`;

      // Each check runs as `authenticated` with A's JWT subject, then rolls back.
      const asA = <T>(fn: (tx: postgres.TransactionSql) => Promise<T>) =>
        sql.begin(async (tx) => {
          await tx`select set_config('request.jwt.claim.sub', ${A}, true)`;
          await tx`set local role authenticated`;
          return await fn(tx);
        }).catch((e) => { throw e; });

      assertEquals((await asA((tx) => tx`select title from public.sessions`)).map((r) => r.title), ['session c1']);
      assertEquals((await asA((tx) => tx`select id from public.profiles`)).length, 1);
      assertEquals(
        (await asA((tx) => tx`update public.sessions set title = 'x' where title = 'session c2' returning id`)).length,
        0,
      );
      assertEquals(
        (await asA((tx) => tx`update public.sessions set title = 'mine', user_edited = true returning title`))[0].title,
        'mine',
      );
      await assertRejects(() => asA((tx) => tx`update public.sessions set bumps = 999`), Error, 'permission denied');
      await assertRejects(() => asA((tx) => tx`select * from private.oauth_tokens`), Error, 'permission denied');
      await assertRejects(
        () => asA((tx) => tx`insert into public.connections (user_id, provider) values (${A}, 'strava')`),
        Error,
        'permission denied',
      );
      await assertRejects(
        () => sql.begin(async (tx) => { await tx`set local role anon`; await tx`select * from public.sessions`; }),
        Error,
        'permission denied',
      );
    } finally {
      await sql.end();
    }
  },
});
