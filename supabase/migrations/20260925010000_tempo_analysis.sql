-- Tempo measured from 30-second previews for tracks no catalog has a tempo
-- for (bpm_source = 'estimated'). tempo_analyzed_at marks the attempt so a
-- track is analysed once, whatever the outcome.
alter table public.tracks
  add column if not exists tempo_confidence real,
  add column if not exists tempo_analyzed_at timestamptz;
