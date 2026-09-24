// The sync pipeline for one user:
//   1. capture new Spotify plays (+ track metadata, BPM/energy, genres)
//   2. pull new Strava workouts that have heart-rate data (+ their streams)
//   3. (re)compute sessions for recent workouts from plays + HR streams

import type { Sql } from './db.ts';
import {
  AudioFeatures,
  Fetch,
  Provider,
  ProviderCredentials,
  ProviderError,
  reccoBeatsFeatures,
  spotifyArtistGenres,
  spotifyRecentlyPlayed,
  spotifyRefresh,
  stravaActivitiesAfter,
  stravaRefresh,
  stravaStreams,
  TokenSet,
  workoutTypeLabel,
} from './providers.ts';
import { Play, summarizeSession } from './transform.ts';

export interface SyncDeps {
  sql: Sql;
  fetch: Fetch;
  creds: { spotify?: ProviderCredentials; strava?: ProviderCredentials };
  now?: () => number;
}

export interface SyncResult {
  newPlays: number;
  newWorkouts: number;
  sessionsComputed: number;
  errors: string[];
}

// How far back to look for workouts on the first Strava sync.
const INITIAL_WORKOUT_LOOKBACK_DAYS = 14;
// Recompute sessions for workouts this recent (late-arriving plays).
const RECOMPUTE_WINDOW_HOURS = 48;
// Stay well under Strava's 100 requests / 15 min app-wide limit.
const MAX_STREAM_FETCHES_PER_RUN = 15;
// A session needs at least this much music overlapping the workout.
const MIN_MUSIC_MINUTES = 1;
// Plays can start slightly before the workout does.
const PLAY_WINDOW_PAD_MS = 15 * 60_000;

/** Returns a valid access token, refreshing and persisting it if needed. */
export async function getAccessToken(deps: SyncDeps, userId: string, provider: Provider): Promise<string | null> {
  const { sql } = deps;
  const [row] = await sql<{ access_token: string; refresh_token: string; expires_at: Date }[]>`
    select access_token, refresh_token, expires_at from private.oauth_tokens
    where user_id = ${userId} and provider = ${provider}`;
  if (!row) return null;
  const now = deps.now?.() ?? Date.now();
  if (row.expires_at.getTime() - now > 120_000) return row.access_token;

  const creds = deps.creds[provider];
  if (!creds) throw new Error(`${provider} credentials are not configured`);
  const fresh = provider === 'spotify'
    ? await spotifyRefresh(deps.fetch, creds, row.refresh_token)
    : await stravaRefresh(deps.fetch, creds, row.refresh_token);
  await saveTokens(sql, userId, provider, fresh);
  return fresh.accessToken;
}

export async function saveTokens(sql: Sql, userId: string, provider: Provider, t: TokenSet) {
  await sql`
    insert into private.oauth_tokens (user_id, provider, access_token, refresh_token, expires_at, updated_at)
    values (${userId}, ${provider}, ${t.accessToken}, ${t.refreshToken}, ${t.expiresAt}, now())
    on conflict (user_id, provider) do update set
      access_token = excluded.access_token, refresh_token = excluded.refresh_token,
      expires_at = excluded.expires_at, updated_at = now()`;
}

async function getCursor(sql: Sql, userId: string, provider: string): Promise<string | null> {
  const [row] = await sql<{ cursor: string | null }[]>`
    select cursor from private.sync_state where user_id = ${userId} and provider = ${provider}`;
  return row?.cursor ?? null;
}

async function setCursor(sql: Sql, userId: string, provider: string, cursor: string) {
  await sql`
    insert into private.sync_state (user_id, provider, cursor, updated_at)
    values (${userId}, ${provider}, ${cursor}, now())
    on conflict (user_id, provider) do update set cursor = excluded.cursor, updated_at = now()`;
}

// ------------------------------------------------------------------ Spotify

export async function syncSpotify(deps: SyncDeps, userId: string): Promise<number> {
  const { sql, fetch: f } = deps;
  const token = await getAccessToken(deps, userId, 'spotify');
  if (!token) return 0;

  const cursor = await getCursor(sql, userId, 'spotify');
  const plays = await spotifyRecentlyPlayed(f, token, cursor ? Number(cursor) : undefined);

  let inserted = 0;
  if (plays.length > 0) {
    const tracks = [...new Map(plays.map((p) => [p.track.id, p.track])).values()];
    const trackRows = tracks.map((t) => ({
      spotify_id: t.id,
      name: t.name,
      artists: t.artists.map((a) => a.name),
      artist_ids: t.artists.map((a) => a.id),
      album: t.album?.name ?? null,
      image_url: t.album?.images?.[0]?.url ?? null,
      duration_ms: t.duration_ms,
    }));
    for (const r of trackRows) {
      await sql`
        insert into public.tracks (spotify_id, name, artists, artist_ids, album, image_url, duration_ms)
        values (${r.spotify_id}, ${r.name}, ${r.artists}, ${r.artist_ids}, ${r.album}, ${r.image_url}, ${r.duration_ms})
        on conflict (spotify_id) do nothing`;
    }
    for (const p of plays) {
      const res = await sql`
        insert into public.plays (user_id, played_at, track_id, context_uri)
        values (${userId}, ${new Date(p.played_at)}, ${p.track.id}, ${p.context?.uri ?? null})
        on conflict do nothing`;
      inserted += res.count;
    }
    await setCursor(sql, userId, 'spotify', String(Date.parse(plays[plays.length - 1].played_at)));
  }

  await enrichTracks(deps, userId, token);
  return inserted;
}

/** Fill in BPM/energy (ReccoBeats) and genres (Spotify artists) for this user's tracks. */
async function enrichTracks(deps: SyncDeps, userId: string, token: string) {
  const { sql, fetch: f } = deps;
  const pending = await sql<{ spotify_id: string; artist_ids: string[] }[]>`
    select distinct t.spotify_id, t.artist_ids from public.tracks t
    join public.plays p on p.track_id = t.spotify_id and p.user_id = ${userId}
    where t.features_checked_at is null
    limit 200`;
  if (pending.length === 0) return;

  let features = new Map<string, AudioFeatures>();
  try {
    features = await reccoBeatsFeatures(f, pending.map((t) => t.spotify_id));
  } catch (err) {
    // Don't mark tracks checked if the service is down; try again next run.
    console.error('ReccoBeats lookup failed', err);
    return;
  }

  const artistIds = [...new Set(pending.map((t) => t.artist_ids[0]).filter(Boolean))];
  let genres = new Map<string, string[]>();
  try {
    genres = await spotifyArtistGenres(f, token, artistIds);
  } catch (err) {
    console.error('Spotify artist genre lookup failed', err);
  }

  for (const t of pending) {
    const af = features.get(t.spotify_id);
    const g = genres.get(t.artist_ids[0]) ?? [];
    await sql`
      update public.tracks set
        tempo = ${af?.tempo ?? null}, energy = ${af?.energy ?? null},
        danceability = ${af?.danceability ?? null}, valence = ${af?.valence ?? null},
        genres = ${g}, features_checked_at = now()
      where spotify_id = ${t.spotify_id}`;
  }
}

// ------------------------------------------------------------------- Strava

export async function syncStrava(deps: SyncDeps, userId: string): Promise<number> {
  const { sql, fetch: f } = deps;
  const token = await getAccessToken(deps, userId, 'strava');
  if (!token) return 0;
  const now = deps.now?.() ?? Date.now();

  const cursor = await getCursor(sql, userId, 'strava');
  const after = cursor ? Number(cursor) : Math.floor(now / 1000) - INITIAL_WORKOUT_LOOKBACK_DAYS * 86400;
  const activities = await stravaActivitiesAfter(f, token, after);

  let added = 0;
  let fetches = 0;
  let newCursor = after;
  for (const a of activities.sort((x, y) => Date.parse(x.start_date) - Date.parse(y.start_date))) {
    const [existing] = await sql`
      select 1 from public.workouts where user_id = ${userId} and source = 'strava' and source_id = ${String(a.id)}`;
    if (existing) {
      newCursor = Math.max(newCursor, Math.floor(Date.parse(a.start_date) / 1000));
      continue;
    }
    let streams = null;
    if (a.has_heartrate) {
      if (fetches >= MAX_STREAM_FETCHES_PER_RUN) break; // pick up the rest next run
      fetches++;
      streams = await stravaStreams(f, token, a.id);
    }
    await sql`
      insert into public.workouts (user_id, source, source_id, name, workout_type, started_at,
        elapsed_seconds, moving_seconds, distance_m, avg_heart_rate, max_heart_rate, has_heart_rate, streams)
      values (${userId}, 'strava', ${String(a.id)}, ${a.name}, ${workoutTypeLabel(a)}, ${new Date(a.start_date)},
        ${a.elapsed_time}, ${a.moving_time ?? null}, ${a.distance ?? null}, ${a.average_heartrate ?? null},
        ${a.max_heartrate ?? null}, ${Boolean(streams)}, ${streams ? sql.json(streams as never) : null})
      on conflict (user_id, source, source_id) do nothing`;
    added++;
    newCursor = Math.max(newCursor, Math.floor(Date.parse(a.start_date) / 1000));
  }
  if (newCursor !== after || !cursor) await setCursor(sql, userId, 'strava', String(newCursor));
  return added;
}

// ----------------------------------------------------------------- Sessions

interface WorkoutRow {
  id: string;
  name: string | null;
  workout_type: string;
  started_at: Date;
  elapsed_seconds: number;
  streams: { time: number[]; heartrate: number[]; velocity?: number[] };
}

export async function computeSessions(deps: SyncDeps, userId: string): Promise<number> {
  const { sql } = deps;
  const now = deps.now?.() ?? Date.now();
  const since = new Date(now - RECOMPUTE_WINDOW_HOURS * 3600_000);

  const workouts = await sql<WorkoutRow[]>`
    select w.id, w.name, w.workout_type, w.started_at, w.elapsed_seconds, w.streams
    from public.workouts w
    left join public.sessions s on s.workout_id = w.id
    where w.user_id = ${userId} and w.has_heart_rate
      and (w.started_at >= ${since} or s.id is null)`;

  let computed = 0;
  for (const w of workouts) {
    const start = w.started_at.getTime();
    const end = start + w.elapsed_seconds * 1000;
    const rows = await sql<{
      played_at: Date;
      spotify_id: string;
      name: string;
      artists: string[];
      duration_ms: number;
      tempo: number | null;
      energy: number | null;
      genres: string[];
    }[]>`
      select p.played_at, t.spotify_id, t.name, t.artists, t.duration_ms, t.tempo, t.energy, t.genres
      from public.plays p join public.tracks t on t.spotify_id = p.track_id
      where p.user_id = ${userId}
        and p.played_at between ${new Date(start - PLAY_WINDOW_PAD_MS)} and ${new Date(end + PLAY_WINDOW_PAD_MS)}
      order by p.played_at`;

    const plays: Play[] = rows.map((r) => ({
      playedAt: r.played_at.getTime(),
      track: {
        id: r.spotify_id,
        name: r.name,
        artists: r.artists,
        durationMs: r.duration_ms,
        tempo: r.tempo,
        energy: r.energy,
        genres: r.genres,
      },
    }));

    const s = summarizeSession(
      { startedAt: start, elapsedSeconds: w.elapsed_seconds, ...w.streams },
      plays,
    );
    if (s.musicMinutes < MIN_MUSIC_MINUTES) continue;

    await sql`
      insert into public.sessions (user_id, workout_id, title, workout_type, started_at, duration_seconds,
        songs, artists, power_song, peak_heart_rate, avg_heart_rate, music_minutes, heat_map, genres, computed_at)
      values (${userId}, ${w.id}, ${w.name}, ${w.workout_type}, ${w.started_at}, ${w.elapsed_seconds},
        ${s.songs}, ${s.artists}, ${s.powerSong}, ${s.peakHeartRate}, ${s.avgHeartRate}, ${s.musicMinutes},
        ${sql.json(s.heatMapData as never)}, ${sql.json(s.genres as never)}, now())
      on conflict (workout_id) do update set
        title = case when public.sessions.user_edited then public.sessions.title else excluded.title end,
        workout_type = excluded.workout_type, duration_seconds = excluded.duration_seconds,
        songs = excluded.songs, artists = excluded.artists, power_song = excluded.power_song,
        peak_heart_rate = excluded.peak_heart_rate, avg_heart_rate = excluded.avg_heart_rate,
        music_minutes = excluded.music_minutes, heat_map = excluded.heat_map, genres = excluded.genres,
        computed_at = now()`;
    computed++;
  }
  return computed;
}

// --------------------------------------------------------------------- User

export async function syncUser(deps: SyncDeps, userId: string): Promise<SyncResult> {
  const { sql } = deps;
  const result: SyncResult = { newPlays: 0, newWorkouts: 0, sessionsComputed: 0, errors: [] };

  const step = async (provider: Provider, fn: () => Promise<number>) => {
    try {
      const n = await fn();
      await sql`update public.connections set last_synced_at = now(), last_error = null
        where user_id = ${userId} and provider = ${provider}`;
      return n;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(msg);
      // A revoked grant shows up as 400/401 on refresh: surface it so the app
      // can prompt the user to reconnect.
      const reconnect = err instanceof ProviderError && [400, 401].includes(err.status);
      await sql`update public.connections set last_error = ${reconnect ? 'reconnect_required' : msg.slice(0, 500)}
        where user_id = ${userId} and provider = ${provider}`;
      return 0;
    }
  };

  result.newPlays = await step('spotify', () => syncSpotify(deps, userId));
  result.newWorkouts = await step('strava', () => syncStrava(deps, userId));
  try {
    result.sessionsComputed = await computeSessions(deps, userId);
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
  }
  return result;
}
