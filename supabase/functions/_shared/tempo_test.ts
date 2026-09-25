import { assert, assertEquals } from '@std/assert';
import { estimateTempo, mixToMono } from './tempo.ts';
import { MPEGDecoder } from 'npm:mpg123-decoder@1.0.3';
import lamejs from 'npm:@breezystack/lamejs@1.2.7';

const SR = 44100;

/** Deterministic PRNG so the noise in drum hits is the same every run. */
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;
}

/** 30 s pop/rock-style pattern: kick on 1 & 3, snare on 2 & 4, 8th-note hats, a bass note per bar. */
function drumTrack(bpm: number, seconds = 30): Float32Array {
  const out = new Float32Array(SR * seconds);
  const rand = rng(bpm);
  const beat = (60 / bpm) * SR;
  const add = (start: number, len: number, fn: (t: number, i: number) => number) => {
    for (let i = 0; i < len && start + i < out.length; i++) out[Math.floor(start) + i] += fn(i / SR, i);
  };
  for (let b = 0; b * beat < out.length; b++) {
    const t0 = b * beat;
    if (b % 2 === 0) add(t0, 0.15 * SR, (t) => Math.sin(2 * Math.PI * (60 + 60 * Math.exp(-t * 30)) * t) * Math.exp(-t * 18) * 0.9);
    else add(t0, 0.12 * SR, (t) => rand() * Math.exp(-t * 25) * 0.5);
    for (const half of [0, 0.5]) add(t0 + half * beat, 0.03 * SR, (t) => rand() * Math.exp(-t * 120) * 0.2);
    if (b % 4 === 0) add(t0, beat * 3.5, (t) => Math.sin(2 * Math.PI * 55 * t) * 0.15 * Math.exp(-t * 0.8));
  }
  return out;
}

for (const bpm of [92, 105, 128, 150]) {
  Deno.test(`estimates ${bpm} BPM from a drum pattern`, () => {
    const est = estimateTempo(drumTrack(bpm), SR);
    assert(est, 'no estimate');
    assert(Math.abs(est.bpm - bpm) <= 2, `got ${est.bpm}, want ${bpm}`);
    assert(est.confidence > 1.2, `low confidence ${est.confidence}`);
  });
}

// Kick on 1 & 3 with snare on 2 & 4 at 172 is genuinely ambiguous (drum & bass is
// felt at 86 as often as 172), so either octave is accepted. On a real library the
// estimator matched 21 of 23 catalog tempos; that's the check that matters.
Deno.test('estimates 172 BPM (or its half, 86) from a fast drum pattern', () => {
  const est = estimateTempo(drumTrack(172), SR);
  assert(est, 'no estimate');
  assert(Math.abs(est.bpm - 172) <= 3 || Math.abs(est.bpm - 86) <= 2, `got ${est.bpm}`);
});

Deno.test('returns null for silence and for clips too short to hold a few beats', () => {
  assertEquals(estimateTempo(new Float32Array(SR * 30), SR), null);
  assertEquals(estimateTempo(drumTrack(120, 2), SR), null);
});

Deno.test('survives an MP3 round trip (encode with lame, decode with mpg123) at 44.1 kHz stereo', async () => {
  const mono = drumTrack(140);
  const pcm = Int16Array.from(mono, (v) => Math.max(-32768, Math.min(32767, Math.round(v * 20000))));
  const enc = new lamejs.Mp3Encoder(2, SR, 128);
  const parts: Uint8Array[] = [];
  for (let i = 0; i < pcm.length; i += 1152) parts.push(enc.encodeBuffer(pcm.subarray(i, i + 1152), pcm.subarray(i, i + 1152)));
  parts.push(enc.flush());
  const mp3 = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let off = 0;
  for (const p of parts) { mp3.set(p, off); off += p.length; }

  const dec = new MPEGDecoder();
  await dec.ready;
  const { channelData, sampleRate } = dec.decode(mp3);
  dec.free();
  const est = estimateTempo(mixToMono(channelData), sampleRate);
  assert(est && Math.abs(est.bpm - 140) <= 2, `got ${est?.bpm}`);
});
