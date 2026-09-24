import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GenreData, HeatMapDataPoint, Session } from '../types';
import { getSupabase } from './supabase';

export type Provider = 'spotify' | 'strava';

export interface Connection {
  provider: Provider;
  providerDisplayName: string | null;
  connectedAt: string;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
}

interface SessionRow {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  workout_type: string;
  started_at: string;
  songs: string[];
  artists: string[];
  power_song: string | null;
  peak_heart_rate: number | null;
  avg_heart_rate: number | null;
  music_minutes: number | null;
  heat_map: HeatMapDataPoint[];
  genres: GenreData[];
  bumps: number;
}

export function sessionFromRow(row: SessionRow, userName: string, userAvatar?: string): Session {
  return {
    id: row.id,
    userId: row.user_id,
    userName,
    userAvatar,
    workoutType: row.workout_type,
    title: row.title ?? undefined,
    description: row.description ?? undefined,
    artists: row.artists,
    songs: row.songs,
    powerSong: row.power_song ?? row.songs[0] ?? '',
    peakHeartRate: row.peak_heart_rate ?? 0,
    avgHeartRate: row.avg_heart_rate ?? undefined,
    musicMinutes: row.music_minutes ?? undefined,
    timestamp: new Date(row.started_at),
    heatMapData: row.heat_map,
    genres: row.genres,
    bumps: row.bumps,
    isLiked: false,
  };
}

export async function fetchProfile(): Promise<Profile | null> {
  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (error) throw error;
  return {
    id: auth.user.id,
    displayName: data?.display_name ?? null,
    avatarUrl: data?.avatar_url ?? null,
    email: auth.user.email ?? null,
  };
}

export async function fetchSessions(profile: Profile): Promise<Session[]> {
  const { data, error } = await getSupabase()
    .from('sessions')
    .select(
      'id, user_id, title, description, workout_type, started_at, songs, artists, power_song, peak_heart_rate, avg_heart_rate, music_minutes, heat_map, genres, bumps',
    )
    .order('started_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  const name = profile.displayName || profile.email?.split('@')[0] || 'You';
  return (data as SessionRow[]).map((r) => sessionFromRow(r, name, profile.avatarUrl ?? undefined));
}

export async function fetchConnections(): Promise<Connection[]> {
  const { data, error } = await getSupabase()
    .from('connections')
    .select('provider, provider_display_name, connected_at, last_synced_at, last_error');
  if (error) throw error;
  return (data ?? []).map((c) => ({
    provider: c.provider as Provider,
    providerDisplayName: c.provider_display_name,
    connectedAt: c.connected_at,
    lastSyncedAt: c.last_synced_at,
    lastError: c.last_error,
  }));
}

export type ConnectOutcome = 'connected' | 'cancelled' | 'missing_scope' | 'error';

// pulse://connected on iOS, <origin>/connected on web.
const connectReturnTo = () => AuthSession.makeRedirectUri({ scheme: 'pulse', path: 'connected' });

// The signed state inside an authorize URL is valid for 10 minutes server-side.
const AUTHORIZE_URL_TTL_MS = 8 * 60_000;
const authorizeUrls = new Map<Provider, { url: string; fetchedAt: number }>();

async function fetchAuthorizeUrl(provider: Provider): Promise<string> {
  const { data, error } = await getSupabase().functions.invoke<{ url: string }>('oauth-start', {
    body: { provider, returnTo: connectReturnTo() },
  });
  if (error || !data?.url) throw error ?? new Error('Could not start sign-in');
  authorizeUrls.set(provider, { url: data.url, fetchedAt: Date.now() });
  return data.url;
}

/**
 * Fetch the provider's authorize URL ahead of time. Browsers (Safari above
 * all) block popups that aren't opened right after a tap, so on web the
 * connect button must be able to open the window without awaiting a request.
 */
export function prepareConnect(provider: Provider): void {
  const cached = authorizeUrls.get(provider);
  if (cached && Date.now() - cached.fetchedAt < AUTHORIZE_URL_TTL_MS) return;
  fetchAuthorizeUrl(provider).catch(() => authorizeUrls.delete(provider));
}

/**
 * Runs the provider's OAuth flow. The browser goes Spotify/Strava ->
 * oauth-callback Edge Function (which exchanges the code with the client
 * secret server-side) -> back to the app at `returnTo`.
 */
export async function connectProvider(provider: Provider): Promise<ConnectOutcome> {
  const cached = authorizeUrls.get(provider);
  authorizeUrls.delete(provider); // one use per URL
  const url =
    cached && Date.now() - cached.fetchedAt < AUTHORIZE_URL_TTL_MS ? cached.url : await fetchAuthorizeUrl(provider);

  const result = await WebBrowser.openAuthSessionAsync(url, connectReturnTo());
  if (result.type !== 'success') return 'cancelled';
  const status = new URL(result.url).searchParams.get('status');
  return status === 'connected' || status === 'missing_scope' || status === 'cancelled' ? status : 'error';
}

export async function disconnectProvider(provider: Provider): Promise<void> {
  const { error } = await getSupabase().functions.invoke('disconnect', { body: { provider } });
  if (error) throw error;
}

export async function syncNow(): Promise<void> {
  const { error } = await getSupabase().functions.invoke('sync', { body: {} });
  if (error) throw error;
}

export async function deleteAccount(): Promise<void> {
  const { error } = await getSupabase().functions.invoke('delete-account', { body: {} });
  if (error) throw error;
  await getSupabase().auth.signOut();
}
