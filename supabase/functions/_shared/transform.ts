// Turns one workout's heart-rate stream plus the songs played during it into
// the data the app's Session cards and detail screens render.
//
// Pure functions only (no I/O), so this runs in Edge Functions and in tests.
// Output shapes mirror src/types/index.ts (HeatMapDataPoint, GenreData).

export interface TrackInfo {
  id: string;
  name: string;
  artists: string[];
  durationMs: number;
  tempo: number | null; // BPM, null when no audio features were found
  energy: number | null; // 0-1
  genres: string[]; // artist genres as returned by Spotify (may be empty)
}

export interface Play {
  playedAt: number; // epoch ms, Spotify `played_at`
  track: TrackInfo;
}

export interface WorkoutStreams {
  startedAt: number; // epoch ms
  elapsedSeconds: number;
  time: number[]; // seconds since start, one per sample
  heartrate: number[]; // bpm, same length as `time`
  velocity?: number[]; // m/s, optional
}

export interface HeatMapPoint {
  songBPM: number;
  heartRate: number;
  durationMinutes: number;
  songName: string;
  artist: string;
  genre: string;
  energy: number | null;
  offsetSeconds: number;
}

export type BadgeType =
  | 'fastest-pace'
  | 'recovery-beats'
  | 'peak-intensity'
  | 'steady-rhythm'
  | 'power-boost';

export interface GenreSummary {
  name: string;
  durationMinutes: number;
  avgHeartRate: number;
  avgBPM: number;
  badges: { type: BadgeType; label: string }[];
}

export interface SessionSummary {
  heatMapData: HeatMapPoint[];
  songs: string[];
  artists: string[];
  powerSong: string | null;
  peakHeartRate: number;
  avgHeartRate: number;
  genres: GenreSummary[];
  musicMinutes: number;
  totalMinutes: number;
}

// Spotify's `played_at` is recorded when a track stops playing, so a play
// covers [played_at - duration, played_at]. If real data shows otherwise,
// flip this and the tests will tell you what changes.
export const PLAYED_AT_MARKS: 'end' | 'start' = 'end';

// Heat-map / chart points are emitted in chronological chunks of this size.
export const CHUNK_SECONDS = 30;

// Gaps longer than this between HR samples (auto-pause, watch dropouts) are
// not counted as time spent at that heart rate.
const MAX_SAMPLE_GAP_SECONDS = 10;

// A song needs at least this much overlap to be listed or be the power song.
const MIN_SONG_SECONDS = 30;
const MIN_POWER_SONG_SECONDS = 60;

const BADGE_LABELS: Record<BadgeType, string> = {
  'fastest-pace': 'Fastest Pace',
  'recovery-beats': 'Recovery Beats',
  'peak-intensity': 'Peak Intensity',
  'steady-rhythm': 'Steady Rhythm',
  'power-boost': 'Power Boost',
};

interface Interval {
  start: number; // epoch ms
  end: number;
  track: TrackInfo;
}

/** Convert plays into non-overlapping [start, end) intervals. */
export function playIntervals(plays: Play[]): Interval[] {
  const sorted = [...plays].sort((a, b) => a.playedAt - b.playedAt);
  const out: Interval[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    let start: number;
    let end: number;
    if (PLAYED_AT_MARKS === 'end') {
      end = p.playedAt;
      start = end - p.track.durationMs;
      // A skipped track ends early; never overlap the previous track.
      if (i > 0) start = Math.max(start, sorted[i - 1].playedAt);
    } else {
      start = p.playedAt;
      end = start + p.track.durationMs;
      if (i < sorted.length - 1) end = Math.min(end, sorted[i + 1].playedAt);
    }
    if (end > start) out.push({ start, end, track: p.track });
  }
  return out;
}

const GENRE_BUCKETS: [RegExp, string][] = [
  [/hip ?hop|rap|trap|drill|grime/, 'Hip-Hop'],
  [/r&b|rnb|soul|neo soul/, 'R&B'],
  // Pop hybrids would otherwise match the electronic/indie/rock rules below.
  [/dance pop|electropop|synthpop|synth-pop|art pop|pop rock|pop punk|k-pop|j-pop/, 'Pop'],
  [/house|techno|edm|electro|dubstep|drum and bass|dnb|trance|dance|garage/, 'Electronic'],
  [/metal|metalcore|hardcore/, 'Metal'],
  [/punk|emo/, 'Punk'],
  [/indie|alternative|alt /, 'Indie'],
  [/rock|grunge/, 'Rock'],
  [/latin|reggaeton|salsa|bachata|urbano/, 'Latin'],
  [/country|americana|bluegrass/, 'Country'],
  [/jazz|bebop|swing/, 'Jazz'],
  [/classical|orchestra|baroque|compositional|soundtrack|score/, 'Classical'],
  [/ambient|chill|lo-fi|lofi|new age/, 'Ambient'],
  [/folk|singer-songwriter/, 'Folk'],
  [/afrobeat|amapiano|afro/, 'Afro'],
  [/pop/, 'Pop'],
];

/** Map Spotify's fine-grained artist genres onto a coarse display genre. */
export function coarseGenre(genres: string[]): string {
  for (const g of genres) {
    const lower = g.toLowerCase();
    for (const [re, name] of GENRE_BUCKETS) if (re.test(lower)) return name;
  }
  return genres.length > 0 ? titleCase(genres[0]) : 'Other';
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Acc {
  seconds: number;
  hrSeconds: number; // sum(hr * dt)
  hrSqSeconds: number; // sum(hr^2 * dt)
  velSeconds: number; // sum(v * dt)
  velCount: number; // seconds that had velocity
  firstHr: number[]; // HR samples from the first minute
  lastHr: number[]; // HR samples from the last minute (rolling)
}

const newAcc = (): Acc => ({
  seconds: 0,
  hrSeconds: 0,
  hrSqSeconds: 0,
  velSeconds: 0,
  velCount: 0,
  firstHr: [],
  lastHr: [],
});

function addSample(acc: Acc, hr: number, dt: number, vel: number | undefined) {
  acc.seconds += dt;
  acc.hrSeconds += hr * dt;
  acc.hrSqSeconds += hr * hr * dt;
  if (vel !== undefined && Number.isFinite(vel)) {
    acc.velSeconds += vel * dt;
    acc.velCount += dt;
  }
  if (acc.seconds <= 60) acc.firstHr.push(hr);
  acc.lastHr.push(hr);
  if (acc.lastHr.length > 60) acc.lastHr.shift();
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const avgHr = (a: Acc) => (a.seconds ? a.hrSeconds / a.seconds : 0);
const hrStd = (a: Acc) => {
  if (!a.seconds) return 0;
  const m = avgHr(a);
  return Math.sqrt(Math.max(0, a.hrSqSeconds / a.seconds - m * m));
};

export function summarizeSession(workout: WorkoutStreams, plays: Play[]): SessionSummary {
  const { time, heartrate, velocity, startedAt } = workout;
  const n = Math.min(time.length, heartrate.length);
  const workoutEnd = startedAt + workout.elapsedSeconds * 1000;

  const intervals = playIntervals(plays).filter((iv) => iv.end > startedAt && iv.start < workoutEnd);

  // Typical sample spacing, used for the last sample and for long gaps.
  const gaps: number[] = [];
  for (let i = 1; i < n; i++) gaps.push(time[i] - time[i - 1]);
  gaps.sort((a, b) => a - b);
  const typicalGap = gaps.length ? Math.max(1, gaps[Math.floor(gaps.length / 2)]) : 1;

  const heatMapData: HeatMapPoint[] = [];
  const perSong = new Map<string, { track: TrackInfo; acc: Acc; firstOffset: number }>();
  const perGenre = new Map<string, { acc: Acc; bpmSeconds: number; bpmCount: number }>();

  let peakHeartRate = 0;
  let totalHrSeconds = 0;
  let totalSeconds = 0;
  let musicSeconds = 0;

  // Current chunk being built for the heat map.
  let chunk: { track: TrackInfo; offset: number; seconds: number; hrSeconds: number } | null = null;
  const flush = () => {
    if (chunk && chunk.seconds > 0 && chunk.track.tempo) {
      heatMapData.push({
        songBPM: Math.round(chunk.track.tempo),
        heartRate: Math.round(chunk.hrSeconds / chunk.seconds),
        durationMinutes: round2(chunk.seconds / 60),
        songName: chunk.track.name,
        artist: chunk.track.artists[0] ?? 'Unknown',
        genre: coarseGenre(chunk.track.genres),
        energy: chunk.track.energy,
        offsetSeconds: Math.round(chunk.offset),
      });
    }
    chunk = null;
  };

  let ivIdx = 0;
  for (let i = 0; i < n; i++) {
    const hr = heartrate[i];
    if (!Number.isFinite(hr) || hr <= 0) continue;
    const rawGap = i < n - 1 ? time[i + 1] - time[i] : typicalGap;
    const dt = rawGap > MAX_SAMPLE_GAP_SECONDS ? typicalGap : rawGap;
    if (dt <= 0) continue;

    peakHeartRate = Math.max(peakHeartRate, hr);
    totalHrSeconds += hr * dt;
    totalSeconds += dt;

    const at = startedAt + time[i] * 1000;
    while (ivIdx < intervals.length && intervals[ivIdx].end <= at) ivIdx++;
    const iv = ivIdx < intervals.length && intervals[ivIdx].start <= at ? intervals[ivIdx] : null;

    if (!iv) {
      flush();
      continue;
    }

    musicSeconds += dt;
    const vel = velocity?.[i];

    const song = perSong.get(iv.track.id) ?? { track: iv.track, acc: newAcc(), firstOffset: time[i] };
    addSample(song.acc, hr, dt, vel);
    perSong.set(iv.track.id, song);

    const genreName = coarseGenre(iv.track.genres);
    const genre = perGenre.get(genreName) ?? { acc: newAcc(), bpmSeconds: 0, bpmCount: 0 };
    addSample(genre.acc, hr, dt, vel);
    if (iv.track.tempo) {
      genre.bpmSeconds += iv.track.tempo * dt;
      genre.bpmCount += dt;
    }
    perGenre.set(genreName, genre);

    const c = chunk as { track: TrackInfo; offset: number; seconds: number; hrSeconds: number } | null;
    if (!c || c.track.id !== iv.track.id || c.seconds >= CHUNK_SECONDS) {
      flush();
      chunk = { track: iv.track, offset: time[i], seconds: 0, hrSeconds: 0 };
    }
    chunk!.seconds += dt;
    chunk!.hrSeconds += hr * dt;
  }
  flush();

  const songsInOrder = [...perSong.values()]
    .filter((s) => s.acc.seconds >= MIN_SONG_SECONDS)
    .sort((a, b) => a.firstOffset - b.firstOffset);

  const songs = songsInOrder.map((s) => s.track.name);
  const artists = [...new Set(songsInOrder.map((s) => s.track.artists[0]).filter(Boolean))];

  // Power song: highest time-weighted average heart rate (ties -> faster tempo).
  const powerCandidates = songsInOrder.filter((s) => s.acc.seconds >= MIN_POWER_SONG_SECONDS);
  const power = (powerCandidates.length ? powerCandidates : songsInOrder)
    .slice()
    .sort((a, b) => avgHr(b.acc) - avgHr(a.acc) || (b.track.tempo ?? 0) - (a.track.tempo ?? 0))[0];

  const genres = buildGenres(perGenre);

  return {
    heatMapData,
    songs,
    artists,
    powerSong: power?.track.name ?? null,
    peakHeartRate: Math.round(peakHeartRate),
    avgHeartRate: Math.round(totalSeconds ? totalHrSeconds / totalSeconds : 0),
    genres,
    musicMinutes: round2(musicSeconds / 60),
    totalMinutes: round2(totalSeconds / 60),
  };
}

function buildGenres(
  perGenre: Map<string, { acc: Acc; bpmSeconds: number; bpmCount: number }>,
): GenreSummary[] {
  const rows = [...perGenre.entries()]
    .filter(([, g]) => g.acc.seconds >= MIN_SONG_SECONDS)
    .map(([name, g]) => ({
      name,
      acc: g.acc,
      avgHeartRate: avgHr(g.acc),
      avgBPM: g.bpmCount ? g.bpmSeconds / g.bpmCount : 0,
      speed: g.acc.velCount ? g.acc.velSeconds / g.acc.velCount : null,
      std: hrStd(g.acc),
      rise: mean(g.acc.lastHr) - mean(g.acc.firstHr),
      badges: [] as { type: BadgeType; label: string }[],
    }))
    .sort((a, b) => b.acc.seconds - a.acc.seconds);

  const award = (type: BadgeType, pick: typeof rows[number] | undefined) => {
    if (pick) pick.badges.push({ type, label: BADGE_LABELS[type] });
  };
  const maxBy = <T>(xs: T[], f: (x: T) => number) =>
    xs.reduce<T | undefined>((best, x) => (best === undefined || f(x) > f(best) ? x : best), undefined);

  if (rows.length > 0) {
    award('peak-intensity', maxBy(rows, (r) => r.avgHeartRate));

    const withSpeed = rows.filter((r) => r.speed !== null);
    award(
      'fastest-pace',
      withSpeed.length ? maxBy(withSpeed, (r) => r.speed!) : maxBy(rows, (r) => r.avgBPM),
    );

    const rising = rows.filter((r) => r.rise > 5);
    award('power-boost', maxBy(rising, (r) => r.rise));
  }
  // Relative badges only make sense with something to compare against.
  if (rows.length > 1) {
    award('recovery-beats', maxBy(rows, (r) => -r.avgHeartRate));
    const longEnough = rows.filter((r) => r.acc.seconds >= 180);
    award('steady-rhythm', maxBy(longEnough, (r) => -r.std));
  }

  return rows.map((r) => ({
    name: r.name,
    durationMinutes: round2(r.acc.seconds / 60),
    avgHeartRate: Math.round(r.avgHeartRate),
    avgBPM: Math.round(r.avgBPM),
    badges: r.badges,
  }));
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
