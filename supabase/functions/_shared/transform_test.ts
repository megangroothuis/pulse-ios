import { assert, assertAlmostEquals, assertEquals } from '@std/assert';
import { coarseGenre, Play, playIntervals, summarizeSession, TrackInfo, WorkoutStreams } from './transform.ts';

const T0 = Date.UTC(2026, 8, 20, 7, 0, 0);
const MIN = 60_000;

const track = (id: string, over: Partial<TrackInfo> = {}): TrackInfo => ({
  id,
  name: `Song ${id}`,
  artists: [`Artist ${id}`],
  durationMs: 3 * MIN,
  tempo: 120,
  energy: 0.8,
  genres: ['dance pop'],
  ...over,
});

/** 1 Hz stream of `minutes` length, HR given per second by `hrAt`. */
function workout(minutes: number, hrAt: (sec: number) => number): WorkoutStreams {
  const time: number[] = [];
  const heartrate: number[] = [];
  for (let s = 0; s < minutes * 60; s++) {
    time.push(s);
    heartrate.push(hrAt(s));
  }
  return { startedAt: T0, elapsedSeconds: minutes * 60, time, heartrate };
}

Deno.test('played_at is treated as the end of the play', () => {
  const plays: Play[] = [{ playedAt: T0 + 3 * MIN, track: track('a') }];
  const [iv] = playIntervals(plays);
  assertEquals(iv.start, T0);
  assertEquals(iv.end, T0 + 3 * MIN);
});

Deno.test('a skipped track is clipped so plays never overlap', () => {
  const plays: Play[] = [
    { playedAt: T0 + 3 * MIN, track: track('a') },
    // played_at only 1 min after the previous one ended -> skipped after 1 min
    { playedAt: T0 + 4 * MIN, track: track('b') },
  ];
  const ivs = playIntervals(plays);
  assertEquals(ivs[1].start, T0 + 3 * MIN);
  assertEquals(ivs[1].end, T0 + 4 * MIN);
});

Deno.test('heart rate is attributed to the song playing at that second', () => {
  // Song a (100 BPM) for min 0-3 at HR 120, song b (160 BPM) for min 3-6 at HR 170.
  const w = workout(6, (s) => (s < 180 ? 120 : 170));
  const plays: Play[] = [
    { playedAt: T0 + 3 * MIN, track: track('a', { tempo: 100 }) },
    { playedAt: T0 + 6 * MIN, track: track('b', { tempo: 160, genres: ['uk drill'] }) },
  ];
  const s = summarizeSession(w, plays);

  assertEquals(s.songs, ['Song a', 'Song b']);
  assertEquals(s.artists, ['Artist a', 'Artist b']);
  assertEquals(s.peakHeartRate, 170);
  assertEquals(s.avgHeartRate, 145);
  assertEquals(s.powerSong, 'Song b');
  assertAlmostEquals(s.musicMinutes, 6, 0.02);

  // 30 s chunks: 6 per song, chronological, with the right BPM/HR pairing.
  assertEquals(s.heatMapData.length, 12);
  assert(s.heatMapData.slice(0, 6).every((p) => p.songBPM === 100 && p.heartRate === 120));
  assert(s.heatMapData.slice(6).every((p) => p.songBPM === 160 && p.heartRate === 170));
  assertEquals(s.heatMapData[6].genre, 'Hip-Hop');
  assertEquals(s.heatMapData[6].offsetSeconds, 180);
  const total = s.heatMapData.reduce((sum, p) => sum + p.durationMinutes, 0);
  assertAlmostEquals(total, 6, 0.02);
});

Deno.test('time with no music counts toward HR stats but not the heat map', () => {
  const w = workout(10, () => 150);
  const plays: Play[] = [{ playedAt: T0 + 5 * MIN, track: track('a', { durationMs: 2 * MIN }) }];
  const s = summarizeSession(w, plays);
  assertAlmostEquals(s.musicMinutes, 2, 0.02);
  assertAlmostEquals(s.totalMinutes, 10, 0.02);
  assertAlmostEquals(s.heatMapData.reduce((sum, p) => sum + p.durationMinutes, 0), 2, 0.02);
  assertEquals(s.heatMapData[0].offsetSeconds, 180);
});

Deno.test('plays outside the workout window are ignored', () => {
  const w = workout(5, () => 140);
  const plays: Play[] = [
    { playedAt: T0 - 10 * MIN, track: track('before') },
    { playedAt: T0 + 3 * MIN, track: track('during') },
    { playedAt: T0 + 30 * MIN, track: track('after') },
  ];
  assertEquals(summarizeSession(w, plays).songs, ['Song during']);
});

Deno.test('tracks without a tempo are listed but left off the heat map', () => {
  const w = workout(3, () => 140);
  const plays: Play[] = [{ playedAt: T0 + 3 * MIN, track: track('a', { tempo: null }) }];
  const s = summarizeSession(w, plays);
  assertEquals(s.songs, ['Song a']);
  assertEquals(s.heatMapData.length, 0);
});

Deno.test('long gaps in the HR stream (auto-pause) are not counted as time', () => {
  // 60 samples, then a 20-minute pause, then 60 more samples.
  const time = [...Array(60).keys(), ...Array.from({ length: 60 }, (_, i) => 1260 + i)];
  const heartrate = time.map(() => 130);
  const w: WorkoutStreams = { startedAt: T0, elapsedSeconds: 1320, time, heartrate };
  const plays: Play[] = [{ playedAt: T0 + 22 * MIN, track: track('long', { durationMs: 22 * MIN }) }];
  const s = summarizeSession(w, plays);
  assertAlmostEquals(s.totalMinutes, 2, 0.05);
});

Deno.test('genre badges are awarded relative to the other genres', () => {
  // Pop at HR 120 for 4 min, then hip-hop rising from 140 to 180 over 4 min.
  const w = workout(8, (s) => (s < 240 ? 120 : 140 + ((s - 240) / 240) * 40));
  const plays: Play[] = [
    { playedAt: T0 + 4 * MIN, track: track('p', { durationMs: 4 * MIN, tempo: 110, genres: ['pop'] }) },
    { playedAt: T0 + 8 * MIN, track: track('h', { durationMs: 4 * MIN, tempo: 150, genres: ['rap'] }) },
  ];
  const { genres } = summarizeSession(w, plays);
  const byName = Object.fromEntries(genres.map((g) => [g.name, g.badges.map((b) => b.type).sort()]));
  assertEquals(byName['Hip-Hop'], ['fastest-pace', 'peak-intensity', 'power-boost']);
  assertEquals(byName['Pop'], ['recovery-beats', 'steady-rhythm']);
});

Deno.test('coarseGenre buckets Spotify genres', () => {
  assertEquals(coarseGenre(['canadian contemporary r&b', 'pop']), 'R&B');
  assertEquals(coarseGenre(['melodic techno']), 'Electronic');
  assertEquals(coarseGenre(['modern indie pop']), 'Indie');
  assertEquals(coarseGenre(['dance pop']), 'Pop');
  assertEquals(coarseGenre(['electropop']), 'Pop');
  assertEquals(coarseGenre(['uk garage']), 'Electronic');
  assertEquals(coarseGenre(['sea shanty']), 'Sea Shanty');
  assertEquals(coarseGenre([]), 'Other');
});
