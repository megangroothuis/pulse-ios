// Generates scripts/fixtures/live-session.json: a `sessions` row produced by
// the real summarizeSession() from a synthetic 36-minute run, used by the
// live-mode web smoke test (scripts/smoke-live.cjs).
//   cd supabase/functions && deno run --config deno.json --allow-write ../tests/make_live_fixture.ts
import { Play, summarizeSession, TrackInfo } from '../functions/_shared/transform.ts';

const T0 = Date.UTC(2026, 8, 23, 6, 30, 0);
const songs: [string, string, number, number, string[]][] = [
  // name, artist, seconds, tempo, genres
  ['Sunrise Drive', 'Cleo Vale', 210, 96, ['indie pop']],
  ['Open Road', 'The Northlines', 225, 118, ['modern rock']],
  ['Pulse Lines', 'Kira Moss', 200, 128, ['dance pop']],
  ['Stride', 'Big Tempo', 190, 142, ['trap']],
  ['Heatwave Run', 'Kira Moss', 215, 150, ['dance pop']],
  ['Redline', 'VOLT', 240, 174, ['melodic techno']],
  ['Last Mile', 'Big Tempo', 205, 165, ['rap']],
  ['Easy Now', 'Cleo Vale', 230, 100, ['indie pop']],
  ['Low Tide', 'Harbor', 245, 82, ['ambient']],
];

const plays: Play[] = [];
let t = T0 - 40_000; // first song started just before the run
for (const [i, [name, artist, secs, tempo, genres]] of songs.entries()) {
  t += secs * 1000;
  const track: TrackInfo = {
    id: `fixture${i}`, name, artists: [artist], durationMs: secs * 1000, tempo, energy: tempo / 200, genres,
  };
  plays.push({ playedAt: t, track });
}

const total = 36 * 60;
const time = [...Array(total).keys()];
const hr = time.map((s) => {
  const m = s / 60;
  let v;
  if (m < 5) v = 105 + m * 9; // warm-up
  else if (m < 14) v = 150 + (m - 5) * 1.2; // steady
  else if (m < 25) v = 162 + (m - 14) * 1.6; // build + peak
  else if (m < 29) v = 178 - (m - 25) * 3; // hold
  else v = 166 - (m - 29) * 7; // cool-down
  return Math.round(v + Math.sin(s / 17) * 2);
});

const s = summarizeSession({ startedAt: T0, elapsedSeconds: total, time, heartrate: hr }, plays);
const row = {
  id: '5e55e55e-0000-4000-8000-000000000001',
  user_id: '00000000-0000-4000-8000-00000000abcd',
  title: 'Sunrise Tempo Run',
  description: null,
  workout_type: 'Running',
  started_at: new Date(T0).toISOString(),
  songs: s.songs,
  artists: s.artists,
  power_song: s.powerSong,
  peak_heart_rate: s.peakHeartRate,
  avg_heart_rate: s.avgHeartRate,
  music_minutes: s.musicMinutes,
  heat_map: s.heatMapData,
  genres: s.genres,
  bumps: 0,
};
await Deno.writeTextFile(new URL('../../scripts/fixtures/live-session.json', import.meta.url), JSON.stringify(row, null, 2) + '\n');
console.log(`songs=${s.songs.length} points=${s.heatMapData.length} power=${s.powerSong} peak=${s.peakHeartRate}`);
console.log(s.genres.map((g) => `${g.name}: ${g.durationMinutes}m ${g.badges.map((b) => b.type).join(',')}`).join('\n'));
