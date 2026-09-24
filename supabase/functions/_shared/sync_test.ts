// End-to-end sync test against a real Postgres with the migrations applied and
// a fake network standing in for Spotify / Strava / ReccoBeats.
//
// Run via scripts/test-functions.sh, which creates a throwaway database and
// sets TEST_DATABASE_URL. Skipped when that variable is absent.

import { assert, assertAlmostEquals, assertEquals } from '@std/assert';
import postgres from 'postgres';
import { syncUser } from './sync.ts';

const DB_URL = Deno.env.get('TEST_DATABASE_URL');
const USER = '00000000-0000-0000-0000-0000000000a1';
const T0 = Date.UTC(2026, 8, 20, 7, 0, 0); // workout start
const NOW = T0 + 60 * 60_000; // sync runs an hour later
const MIN = 60_000;

const trackA = {
  id: 'trackA0000000000000001',
  name: 'Warm Pop Song',
  duration_ms: 6 * MIN,
  artists: [{ id: 'artistA', name: 'Pop Artist' }],
  album: { name: 'Album A', images: [{ url: 'https://i.scdn.co/a.jpg' }] },
};
const trackB = {
  id: 'trackB0000000000000002',
  name: 'Fast Rap Song',
  duration_ms: 6 * MIN,
  artists: [{ id: 'artistB', name: 'Rap Artist' }],
};
const trackEarlier = {
  id: 'trackC0000000000000003',
  name: 'Breakfast Song',
  duration_ms: 3 * MIN,
  artists: [{ id: 'artistA', name: 'Pop Artist' }],
};

function fakeNetwork() {
  const calls: string[] = [];
  const f = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    calls.push(`${init?.method ?? 'GET'} ${url.host}${url.pathname}`);
    const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

    if (url.href === 'https://accounts.spotify.com/api/token') {
      assertEquals(new URLSearchParams(String(init?.body)).get('refresh_token'), 'spotify-refresh');
      return ok({ access_token: 'spotify-fresh', expires_in: 3600 });
    }
    if (url.pathname === '/v1/me/player/recently-played') {
      if (url.searchParams.get('after')) return ok({ items: [] });
      return ok({
        items: [
          // newest first, like Spotify
          { played_at: new Date(T0 + 12 * MIN).toISOString(), track: trackB },
          { played_at: new Date(T0 + 6 * MIN).toISOString(), track: trackA },
          { played_at: new Date(T0 - 60 * MIN).toISOString(), track: trackEarlier },
        ],
      });
    }
    if (url.pathname === '/v1/artists') {
      return ok({ artists: [{ id: 'artistA', genres: ['dance pop'] }, { id: 'artistB', genres: ['trap'] }] });
    }
    if (url.host === 'api.reccobeats.com') {
      const ids = url.searchParams.get('ids')!.split(',');
      const tempo: Record<string, number> = { [trackA.id]: 110, [trackB.id]: 170 };
      return ok({
        content: ids.filter((id) => tempo[id]).map((id) => ({
          href: `https://open.spotify.com/track/${id}`,
          tempo: tempo[id],
          energy: 0.7,
          danceability: 0.6,
          valence: 0.5,
        })),
      });
    }
    if (url.pathname === '/api/v3/athlete/activities') {
      if (url.searchParams.get('page') !== '1') return ok([]);
      return ok([
        {
          id: 111,
          name: 'Morning Run',
          sport_type: 'Run',
          start_date: new Date(T0).toISOString(),
          elapsed_time: 12 * 60,
          moving_time: 12 * 60,
          distance: 2400,
          has_heartrate: true,
          average_heartrate: 147,
          max_heartrate: 165,
        },
        {
          id: 222,
          name: 'Yoga (no HR)',
          sport_type: 'Yoga',
          start_date: new Date(T0 - 5 * 3600_000).toISOString(),
          elapsed_time: 1800,
          has_heartrate: false,
        },
      ]);
    }
    if (url.pathname === '/api/v3/activities/111/streams') {
      const time = [...Array(12 * 60).keys()];
      return ok({
        time: { data: time },
        heartrate: { data: time.map((s) => (s < 360 ? 130 : 165)) },
        velocity_smooth: { data: time.map((s) => (s < 360 ? 3 : 3.6)) },
      });
    }
    throw new Error(`unexpected request ${url.href}`);
  }) as typeof fetch;
  return { f, calls };
}

Deno.test({
  name: 'syncUser: plays + workout -> session, idempotent on re-run',
  ignore: !DB_URL,
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const sql = postgres(DB_URL!, { max: 1, onnotice: () => {} });
    try {
      await sql`insert into auth.users (id, email) values (${USER}, 'megan@example.com')`;
      for (const provider of ['spotify', 'strava']) {
        await sql`insert into public.connections (user_id, provider) values (${USER}, ${provider})`;
      }
      // Spotify token already expired -> must refresh. Strava token still valid.
      await sql`insert into private.oauth_tokens values
        (${USER}, 'spotify', 'spotify-old', 'spotify-refresh', ${new Date(NOW - MIN)}, now()),
        (${USER}, 'strava', 'strava-token', 'strava-refresh', ${new Date(NOW + 3600_000)}, now())`;

      const net = fakeNetwork();
      const creds = { clientId: 'id', clientSecret: 'secret' };
      const deps = { sql, fetch: net.f, creds: { spotify: creds, strava: creds }, now: () => NOW };

      const r1 = await syncUser(deps, USER);
      assertEquals(r1.errors, []);
      assertEquals(r1.newPlays, 3);
      assertEquals(r1.newWorkouts, 2);
      assertEquals(r1.sessionsComputed, 1);

      // Token refresh persisted; streams fetched only for the HR workout.
      const [tok] = await sql`select access_token from private.oauth_tokens where user_id = ${USER} and provider = 'spotify'`;
      assertEquals(tok.access_token, 'spotify-fresh');
      assertEquals(net.calls.filter((c) => c.includes('/streams')).length, 1);

      const [track] = await sql`select tempo, genres from public.tracks where spotify_id = ${trackB.id}`;
      assertEquals(track.tempo, 170);
      assertEquals(track.genres, ['trap']);

      const sessions = await sql`select * from public.sessions where user_id = ${USER}`;
      assertEquals(sessions.length, 1);
      const s = sessions[0];
      assertEquals(s.title, 'Morning Run');
      assertEquals(s.workout_type, 'Running');
      assertEquals(s.songs, ['Warm Pop Song', 'Fast Rap Song']);
      assertEquals(s.artists, ['Pop Artist', 'Rap Artist']);
      assertEquals(s.power_song, 'Fast Rap Song');
      assertEquals(s.peak_heart_rate, 165);
      assertAlmostEquals(s.music_minutes, 12, 0.05);
      assertEquals(s.heat_map.length, 24);
      assertEquals(s.heat_map[0], {
        songBPM: 110, heartRate: 130, durationMinutes: 0.5, songName: 'Warm Pop Song',
        artist: 'Pop Artist', genre: 'Pop', energy: 0.7, offsetSeconds: 0,
      });
      const hipHop = s.genres.find((g: { name: string }) => g.name === 'Hip-Hop');
      assert(hipHop.badges.some((b: { type: string }) => b.type === 'peak-intensity'));
      assert(hipHop.badges.some((b: { type: string }) => b.type === 'fastest-pace'));

      const conns = await sql`select provider, last_synced_at, last_error from public.connections order by provider`;
      assert(conns.every((c) => c.last_synced_at && !c.last_error));

      // User renames the session; a re-sync must not duplicate or overwrite it.
      await sql`update public.sessions set title = 'Park loop', user_edited = true`;
      const r2 = await syncUser({ ...deps, fetch: fakeNetwork().f }, USER);
      assertEquals(r2.errors, []);
      assertEquals(r2.newPlays, 0);
      assertEquals(r2.newWorkouts, 0);
      const again = await sql`select title from public.sessions where user_id = ${USER}`;
      assertEquals(again.map((r) => r.title), ['Park loop']);
      assertEquals((await sql`select count(*)::int as n from public.plays`)[0].n, 3);
    } finally {
      await sql.end();
    }
  },
});

Deno.test({
  name: 'syncUser: a revoked Spotify grant is flagged for reconnect, Strava still syncs',
  ignore: !DB_URL,
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const sql = postgres(DB_URL!, { max: 1, onnotice: () => {} });
    const user = '00000000-0000-0000-0000-0000000000b2';
    try {
      await sql`insert into auth.users (id) values (${user})`;
      await sql`insert into public.connections (user_id, provider) values (${user}, 'spotify'), (${user}, 'strava')`;
      await sql`insert into private.oauth_tokens values
        (${user}, 'spotify', 'x', 'revoked', ${new Date(NOW - MIN)}, now()),
        (${user}, 'strava', 'strava-token', 'r', ${new Date(NOW + 3600_000)}, now())`;
      const base = fakeNetwork().f;
      const f = (async (input: string | URL | Request, init?: RequestInit) => {
        if (String(input) === 'https://accounts.spotify.com/api/token') {
          return new Response('{"error":"invalid_grant"}', { status: 400 });
        }
        return base(input, init);
      }) as typeof fetch;
      const creds = { clientId: 'id', clientSecret: 'secret' };
      const r = await syncUser({ sql, fetch: f, creds: { spotify: creds, strava: creds }, now: () => NOW }, user);
      assertEquals(r.errors.length, 1);
      assertEquals(r.newWorkouts, 2);
      const rows = await sql`select provider, last_error from public.connections where user_id = ${user} order by provider`;
      assertEquals(rows.map((x) => [x.provider, x.last_error]), [['spotify', 'reconnect_required'], ['strava', null]]);
    } finally {
      await sql.end();
    }
  },
});
