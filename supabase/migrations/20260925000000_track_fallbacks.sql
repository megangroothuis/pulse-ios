-- Second-chance enrichment for tracks ReccoBeats / Spotify left incomplete:
-- BPM from Deezer (by ISRC, else title+artist search) and genres from
-- MusicBrainz artist data.
alter table public.tracks
  add column if not exists isrc text,
  add column if not exists bpm_source text,
  add column if not exists genres_source text,
  add column if not exists fallback_checked_at timestamptz;
