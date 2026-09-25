// POST {"trackId": "<spotify id>"} with x-cron-secret -> measure the track's
// tempo from its Deezer preview and store it. One track per call, because
// decoding + analysis uses a few hundred ms of the ~2 s CPU budget per
// invocation. Called by the sync function for tracks still missing a tempo.
import { analyzeTrackTempo } from '../_shared/analyze.ts';
import { getSql } from '../_shared/db.ts';
import { env } from '../_shared/env.ts';
import { HttpError, json, serve } from '../_shared/http.ts';

serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== env('CRON_SECRET')) throw new HttpError(401, 'Unauthorized');
  const { trackId } = await req.json().catch(() => ({}));
  if (typeof trackId !== 'string') throw new HttpError(400, 'trackId required');

  const sql = getSql();
  const [t] = await sql<{ name: string; artists: string[]; isrc: string | null; tempo: number | null }[]>`
    select name, artists, isrc, tempo from public.tracks where spotify_id = ${trackId}`;
  if (!t) throw new HttpError(404, 'Unknown track');
  if (t.tempo != null) return json({ outcome: 'already_known' });

  const result = await analyzeTrackTempo(fetch, { isrc: t.isrc, title: t.name, artist: t.artists[0] ?? '' });
  if (result.kind === 'estimated') {
    await sql`update public.tracks set tempo = ${result.estimate.bpm}, bpm_source = 'estimated',
      tempo_confidence = ${result.estimate.confidence}, tempo_analyzed_at = now() where spotify_id = ${trackId}`;
  } else if (result.kind === 'catalog') {
    await sql`update public.tracks set tempo = ${result.bpm}, bpm_source = 'deezer', tempo_analyzed_at = now()
      where spotify_id = ${trackId}`;
  } else {
    await sql`update public.tracks set tempo_analyzed_at = now() where spotify_id = ${trackId}`;
  }
  return json({ outcome: result.kind });
});
