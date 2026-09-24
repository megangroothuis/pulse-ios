-- Pulse schema: auth-linked profiles, provider connections, listening history,
-- workouts, and computed sessions.
--
-- Security model:
--   * Every user-owned table has RLS; users can only read their own rows.
--   * Writes to synced data happen only from Edge Functions using the
--     service role, which bypasses RLS.
--   * OAuth tokens live in the `private` schema, which is not exposed through
--     the Data API, so no client key can ever read them.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Create a profile row whenever someone signs up.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ------------------------------------------------------------ connections
-- Non-secret connection status the app can show.
create table public.connections (
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('spotify', 'strava')),
  provider_user_id text,
  provider_display_name text,
  scopes text,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  last_error text,
  primary key (user_id, provider)
);

alter table public.connections enable row level security;

create policy "connections: read own" on public.connections
  for select to authenticated using (user_id = (select auth.uid()));

create table private.oauth_tokens (
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('spotify', 'strava')),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

-- Sync cursors (e.g. last Spotify play fetched). Server-only.
create table private.sync_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  cursor text,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

-- ----------------------------------------------------------------- tracks
-- Shared catalogue of Spotify tracks with audio features (not user data).
create table public.tracks (
  spotify_id text primary key,
  name text not null,
  artists text[] not null default '{}',
  artist_ids text[] not null default '{}',
  album text,
  image_url text,
  duration_ms integer not null,
  genres text[] not null default '{}',
  tempo real,
  energy real,
  danceability real,
  valence real,
  features_checked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tracks enable row level security;

create policy "tracks: readable by signed-in users" on public.tracks
  for select to authenticated using (true);

-- ------------------------------------------------------------------ plays
-- Listening history captured from Spotify "recently played".
create table public.plays (
  user_id uuid not null references auth.users (id) on delete cascade,
  played_at timestamptz not null,
  track_id text not null references public.tracks (spotify_id),
  context_uri text,
  primary key (user_id, played_at)
);

alter table public.plays enable row level security;

create policy "plays: read own" on public.plays
  for select to authenticated using (user_id = (select auth.uid()));

-- --------------------------------------------------------------- workouts
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('strava', 'apple_health')),
  source_id text not null,
  name text,
  workout_type text not null,
  started_at timestamptz not null,
  elapsed_seconds integer not null,
  moving_seconds integer,
  distance_m real,
  avg_heart_rate real,
  max_heart_rate real,
  has_heart_rate boolean not null default false,
  -- {time: number[], heartrate: number[], velocity?: number[]}
  streams jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, source, source_id)
);

create index workouts_user_started on public.workouts (user_id, started_at desc);

alter table public.workouts enable row level security;

create policy "workouts: read own" on public.workouts
  for select to authenticated using (user_id = (select auth.uid()));

-- --------------------------------------------------------------- sessions
-- A workout joined with the music played during it; what the feed shows.
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid not null unique references public.workouts (id) on delete cascade,
  title text,
  description text,
  workout_type text not null,
  started_at timestamptz not null,
  duration_seconds integer not null,
  songs text[] not null default '{}',
  artists text[] not null default '{}',
  power_song text,
  peak_heart_rate integer,
  avg_heart_rate integer,
  music_minutes real,
  heat_map jsonb not null default '[]',
  genres jsonb not null default '[]',
  bumps integer not null default 0,
  computed_at timestamptz not null default now(),
  -- true once the user edits title/description, so re-syncs don't overwrite
  user_edited boolean not null default false
);

create index sessions_user_started on public.sessions (user_id, started_at desc);

alter table public.sessions enable row level security;

create policy "sessions: read own" on public.sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "sessions: update own" on public.sessions
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Signed-in users may only change title/description on their own sessions
-- (and profile name/avatar); everything else is written by the server.
revoke insert, update, delete on public.profiles, public.connections, public.tracks,
  public.plays, public.workouts, public.sessions from anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
grant update (title, description, user_edited) on public.sessions to authenticated;
revoke all on public.profiles, public.connections, public.tracks,
  public.plays, public.workouts, public.sessions from anon;
