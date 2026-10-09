// Spotify, Strava and ReccoBeats API clients. `fetch` is injectable so the
// sync logic can be tested without network access.

export type Fetch = typeof fetch;
export type Provider = 'spotify' | 'strava';

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes?: string;
}

export interface ProviderCredentials {
  clientId: string;
  clientSecret: string;
}

export class ProviderError extends Error {
  constructor(public provider: string, public status: number, message: string) {
    super(`${provider} ${status}: ${message}`);
  }
}

async function readJson<T>(provider: string, res: Response): Promise<T> {
  if (!res.ok) throw new ProviderError(provider, res.status, (await res.text()).slice(0, 300));
  return (await res.json()) as T;
}

// ------------------------------------------------------------------ Spotify

export const SPOTIFY_SCOPES = 'user-read-recently-played user-read-private';

export function spotifyAuthorizeUrl(creds: ProviderCredentials, redirectUri: string, state: string): string {
  const q = new URLSearchParams({
    client_id: creds.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    state,
  });
  return `https://accounts.spotify.com/authorize?${q}`;
}

async function spotifyToken(f: Fetch, creds: ProviderCredentials, body: Record<string, string>) {
  const res = await f('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${creds.clientId}:${creds.clientSecret}`)}`,
    },
    body: new URLSearchParams(body),
  });
  return readJson<{ access_token: string; refresh_token?: string; expires_in: number; scope?: string }>(
    'spotify',
    res,
  );
}

export async function spotifyExchangeCode(
  f: Fetch,
  creds: ProviderCredentials,
  code: string,
  redirectUri: string,
): Promise<TokenSet> {
  const t = await spotifyToken(f, creds, { grant_type: 'authorization_code', code, redirect_uri: redirectUri });
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token!,
    expiresAt: new Date(Date.now() + t.expires_in * 1000),
    scopes: t.scope,
  };
}

export async function spotifyRefresh(f: Fetch, creds: ProviderCredentials, refreshToken: string): Promise<TokenSet> {
  const t = await spotifyToken(f, creds, { grant_type: 'refresh_token', refresh_token: refreshToken });
  return {
    accessToken: t.access_token,
    // Spotify may or may not rotate the refresh token.
    refreshToken: t.refresh_token ?? refreshToken,
    expiresAt: new Date(Date.now() + t.expires_in * 1000),
    scopes: t.scope,
  };
}

const spotifyGet = async <T>(f: Fetch, token: string, path: string) =>
  readJson<T>(
    'spotify',
    await f(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${token}` } }),
  );

export const spotifyMe = (f: Fetch, token: string) =>
  spotifyGet<{ id: string; display_name: string | null }>(f, token, '/me');

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: { id: string; name: string }[];
  album?: { name: string; images?: { url: string; width?: number }[] };
  external_ids?: { isrc?: string };
}

export interface SpotifyPlay {
  played_at: string;
  track: SpotifyTrack;
  context?: { uri?: string } | null;
}

/** Plays strictly after `afterMs` (epoch ms), oldest first. Spotify caps this at 50. */
export async function spotifyRecentlyPlayed(f: Fetch, token: string, afterMs?: number): Promise<SpotifyPlay[]> {
  const q = new URLSearchParams({ limit: '50' });
  if (afterMs) q.set('after', String(afterMs));
  const data = await spotifyGet<{ items: SpotifyPlay[] }>(f, token, `/me/player/recently-played?${q}`);
  return data.items
    .filter((p) => p.track?.id)
    .sort((a, b) => Date.parse(a.played_at) - Date.parse(b.played_at));
}

/**
 * Artist genres by artist ID. Uses the batch endpoint and falls back to
 * per-artist lookups if the batch endpoint is unavailable to the app.
 * Artists Spotify returns no genres for map to [].
 */
export async function spotifyArtistGenres(f: Fetch, token: string, ids: string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    try {
      const data = await spotifyGet<{ artists: ({ id: string; genres?: string[] } | null)[] }>(
        f,
        token,
        `/artists?ids=${batch.join(',')}`,
      );
      for (const a of data.artists) if (a) out.set(a.id, a.genres ?? []);
    } catch (err) {
      if (!(err instanceof ProviderError) || ![403, 404].includes(err.status)) throw err;
      for (const id of batch) {
        try {
          const a = await spotifyGet<{ id: string; genres?: string[] }>(f, token, `/artists/${id}`);
          out.set(a.id, a.genres ?? []);
        } catch (inner) {
          if (!(inner instanceof ProviderError) || inner.status >= 500 || inner.status === 429) throw inner;
          out.set(id, []);
        }
      }
    }
  }
  return out;
}

// ------------------------------------------------------------------- Strava

export const STRAVA_SCOPES = 'read,activity:read_all';

export function stravaAuthorizeUrl(creds: ProviderCredentials, redirectUri: string, state: string): string {
  const q = new URLSearchParams({
    client_id: creds.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    approval_prompt: 'auto',
    scope: STRAVA_SCOPES,
    state,
  });
  return `https://www.strava.com/oauth/authorize?${q}`;
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  athlete?: { id: number; firstname?: string; lastname?: string };
}

async function stravaToken(f: Fetch, creds: ProviderCredentials, body: Record<string, string>) {
  const res = await f('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: creds.clientId, client_secret: creds.clientSecret, ...body }),
  });
  return readJson<StravaTokenResponse>('strava', res);
}

export async function stravaExchangeCode(f: Fetch, creds: ProviderCredentials, code: string) {
  const t = await stravaToken(f, creds, { grant_type: 'authorization_code', code });
  const tokens: TokenSet = {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: new Date(t.expires_at * 1000),
  };
  return { tokens, athlete: t.athlete };
}

export async function stravaRefresh(f: Fetch, creds: ProviderCredentials, refreshToken: string): Promise<TokenSet> {
  const t = await stravaToken(f, creds, { grant_type: 'refresh_token', refresh_token: refreshToken });
  return { accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt: new Date(t.expires_at * 1000) };
}

export async function stravaDeauthorize(f: Fetch, accessToken: string): Promise<void> {
  await f('https://www.strava.com/oauth/deauthorize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

const stravaGet = async <T>(f: Fetch, token: string, path: string) =>
  readJson<T>(
    'strava',
    await f(`https://www.strava.com/api/v3${path}`, { headers: { Authorization: `Bearer ${token}` } }),
  );

export interface StravaActivity {
  id: number;
  name: string;
  sport_type?: string;
  type?: string;
  start_date: string;
  elapsed_time: number;
  moving_time?: number;
  distance?: number;
  has_heartrate?: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
}

export async function stravaActivitiesAfter(f: Fetch, token: string, afterEpochSec: number): Promise<StravaActivity[]> {
  const all: StravaActivity[] = [];
  for (let page = 1; page <= 4; page++) {
    const q = new URLSearchParams({ after: String(afterEpochSec), per_page: '50', page: String(page) });
    const batch = await stravaGet<StravaActivity[]>(f, token, `/athlete/activities?${q}`);
    all.push(...batch);
    if (batch.length < 50) break;
  }
  return all;
}

export interface Streams {
  time: number[];
  heartrate: number[];
  velocity?: number[];
}

export async function stravaStreams(f: Fetch, token: string, activityId: number): Promise<Streams | null> {
  const data = await stravaGet<Record<string, { data: number[] } | undefined>>(
    f,
    token,
    `/activities/${activityId}/streams?keys=time,heartrate,velocity_smooth&key_by_type=true`,
  );
  if (!data.time?.data || !data.heartrate?.data) return null;
  return { time: data.time.data, heartrate: data.heartrate.data, velocity: data.velocity_smooth?.data };
}

/** Strava sport types -> the labels the app shows. */
export function workoutTypeLabel(a: StravaActivity): string {
  const t = a.sport_type ?? a.type ?? 'Workout';
  const map: Record<string, string> = {
    Run: 'Running',
    TrailRun: 'Trail Run',
    VirtualRun: 'Running',
    Ride: 'Cycling',
    VirtualRide: 'Cycling',
    MountainBikeRide: 'Mountain Biking',
    GravelRide: 'Cycling',
    EBikeRide: 'Cycling',
    Walk: 'Walking',
    Hike: 'Hiking',
    Swim: 'Swimming',
    WeightTraining: 'Strength',
    Workout: 'Workout',
    Yoga: 'Yoga',
    HighIntensityIntervalTraining: 'HIIT',
    Rowing: 'Rowing',
    Elliptical: 'Elliptical',
    StairStepper: 'Stair Stepper',
  };
  return map[t] ?? t.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// --------------------------------------------------------------- ReccoBeats

export interface AudioFeatures {
  isrc: string | null;
  tempo: number | null;
  energy: number | null;
  danceability: number | null;
  valence: number | null;
}

/**
 * Audio features for Spotify track IDs from ReccoBeats (free, no key).
 * Results are matched back by the Spotify URL in each item's `href`; tracks
 * ReccoBeats doesn't know are simply absent from the returned map.
 */
export async function reccoBeatsFeatures(f: Fetch, spotifyIds: string[]): Promise<Map<string, AudioFeatures>> {
  const out = new Map<string, AudioFeatures>();
  for (let i = 0; i < spotifyIds.length; i += 40) {
    const batch = spotifyIds.slice(i, i + 40);
    const res = await f(`https://api.reccobeats.com/v1/audio-features?ids=${batch.join(',')}`, {
      headers: { Accept: 'application/json' },
    });
    const data = await readJson<{
      content?: {
        href?: string;
        isrc?: string;
        tempo?: number;
        energy?: number;
        danceability?: number;
        valence?: number;
      }[];
    }>('reccobeats', res);
    for (const item of data.content ?? []) {
      const id = item.href?.match(/track\/([A-Za-z0-9]+)/)?.[1];
      if (!id || !batch.includes(id)) continue;
      out.set(id, {
        isrc: item.isrc ?? null,
        tempo: item.tempo ?? null,
        energy: item.energy ?? null,
        danceability: item.danceability ?? null,
        valence: item.valence ?? null,
      });
    }
  }
  return out;
}

// ------------------------------------------------------ Fallback enrichment

/** Lowercase, drop "(feat. …)", " - Remastered 2011" etc. and punctuation for fuzzy matching. */
export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s*[([].*?[)\]]/g, '')
    .replace(/\s+-\s+.*$/, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

interface DeezerTrack {
  id?: number;
  title?: string;
  bpm?: number;
  preview?: string;
  artist?: { name?: string };
  error?: unknown;
}

export interface DeezerMatch {
  id: number;
  /** null when Deezer has no tempo (it reports 0) */
  bpm: number | null;
  /** 30-second MP3 preview; the URL is signed and short-lived, so use it right away */
  preview: string | null;
}

/**
 * Find a track on Deezer's public API (no key): by ISRC first, then a plain
 * title + artist search with exact normalized matching. Deezer's
 * `artist:"…" track:"…"` syntax returns no results from US regions, but plain
 * queries do.
 */
export async function deezerFindTrack(
  f: Fetch,
  track: { isrc: string | null; title: string; artist: string },
): Promise<DeezerMatch | null> {
  const get = async <T>(url: string) => readJson<T>('deezer', await f(url, { headers: { Accept: 'application/json' } }));
  const toMatch = (t: DeezerTrack): DeezerMatch => ({
    id: t.id!,
    bpm: typeof t.bpm === 'number' && t.bpm > 0 ? t.bpm : null,
    preview: t.preview || null,
  });

  // An ISRC hit without a tempo is kept as a fallback while search looks for
  // another release of the same song that has one.
  let isrcMatch: DeezerMatch | null = null;
  if (track.isrc) {
    const byIsrc = await get<DeezerTrack>(`https://api.deezer.com/track/isrc:${encodeURIComponent(track.isrc)}`);
    if (byIsrc.id && !byIsrc.error) {
      isrcMatch = toMatch(byIsrc);
      if (isrcMatch.bpm) return isrcMatch;
    }
  }

  const q = `${track.artist} ${normalizeTitle(track.title)}`;
  const found = await get<{ data?: DeezerTrack[] }>(
    `https://api.deezer.com/search/track?q=${encodeURIComponent(q)}&limit=5`,
  );
  const wantTitle = normalizeTitle(track.title);
  const wantArtist = normalizeTitle(track.artist);
  const hit = (found.data ?? []).find(
    (t) => t.id && normalizeTitle(t.title ?? '') === wantTitle && normalizeTitle(t.artist?.name ?? '') === wantArtist,
  );
  if (!hit) return isrcMatch;
  // Search results omit bpm; fetch the full track.
  const full = toMatch(await get<DeezerTrack>(`https://api.deezer.com/track/${hit.id}`));
  return full.bpm || !isrcMatch ? full : { ...isrcMatch, preview: isrcMatch.preview ?? full.preview };
}

/** BPM from Deezer, or null if it has no match or no tempo. */
export async function deezerBpm(
  f: Fetch,
  track: { isrc: string | null; title: string; artist: string },
): Promise<number | null> {
  return (await deezerFindTrack(f, track))?.bpm ?? null;
}

// MusicBrainz asks every client to identify itself.
const MUSICBRAINZ_UA = 'Pulse/1.0 ( https://github.com/megangroothuis/pulse-ios )';

/**
 * Artist genres from MusicBrainz (no key; max ~1 request/second, so callers
 * pace calls with `sleep`). Only accepts an exact-name, high-confidence match.
 * Returns up to 5 genres, most-voted first.
 */
export async function musicBrainzArtistGenres(
  f: Fetch,
  artistName: string,
  sleep: (ms: number) => Promise<void>,
): Promise<string[]> {
  const get = async <T>(url: string) =>
    readJson<T>('musicbrainz', await f(url, { headers: { Accept: 'application/json', 'User-Agent': MUSICBRAINZ_UA } }));

  const query = encodeURIComponent(`artist:"${artistName.replace(/"/g, '')}"`);
  const search = await get<{ artists?: { id: string; name: string; score?: number }[] }>(
    `https://musicbrainz.org/ws/2/artist/?query=${query}&limit=3&fmt=json`,
  );
  const want = normalizeTitle(artistName);
  const artist = (search.artists ?? []).find((a) => (a.score ?? 0) >= 90 && normalizeTitle(a.name) === want);
  if (!artist) return [];

  await sleep(1100);
  const detail = await get<{ genres?: { name: string; count?: number }[] }>(
    `https://musicbrainz.org/ws/2/artist/${artist.id}?inc=genres&fmt=json`,
  );
  return (detail.genres ?? [])
    .slice()
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 5)
    .map((g) => g.name);
}
