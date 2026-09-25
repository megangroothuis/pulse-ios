// Measure a track's tempo from its Deezer 30-second preview. Kept separate
// from tempo.ts so the estimator stays pure and testable without the network.
import { MPEGDecoder } from 'npm:mpg123-decoder@1.0.3';
import { deezerFindTrack, Fetch } from './providers.ts';
import { estimateTempo, mixToMono, TempoEstimate } from './tempo.ts';

export type AnalyzeOutcome =
  | { kind: 'estimated'; estimate: TempoEstimate }
  | { kind: 'catalog'; bpm: number } // Deezer turned out to have a tempo after all
  | { kind: 'no_match' | 'no_preview' | 'no_rhythm' };

let decoder: MPEGDecoder | null = null;

export async function decodeMp3(bytes: Uint8Array): Promise<{ samples: Float32Array; sampleRate: number }> {
  if (!decoder) {
    decoder = new MPEGDecoder();
    await decoder.ready;
  } else {
    await decoder.reset();
  }
  const { channelData, sampleRate } = decoder.decode(bytes);
  return { samples: mixToMono(channelData), sampleRate };
}

export async function analyzeTrackTempo(
  f: Fetch,
  track: { isrc: string | null; title: string; artist: string },
): Promise<AnalyzeOutcome> {
  const match = await deezerFindTrack(f, track);
  if (!match) return { kind: 'no_match' };
  if (match.bpm) return { kind: 'catalog', bpm: match.bpm };
  if (!match.preview) return { kind: 'no_preview' };

  const res = await f(match.preview);
  if (!res.ok) return { kind: 'no_preview' };
  const { samples, sampleRate } = await decodeMp3(new Uint8Array(await res.arrayBuffer()));
  const estimate = estimateTempo(samples, sampleRate);
  return estimate ? { kind: 'estimated', estimate } : { kind: 'no_rhythm' };
}
