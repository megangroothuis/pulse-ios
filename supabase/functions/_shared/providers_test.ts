import { assertEquals } from '@std/assert';
import { deezerBpm, musicBrainzArtistGenres, normalizeTitle } from './providers.ts';

type Route = (url: URL, init?: RequestInit) => unknown;
function fakeFetch(routes: Record<string, Route>, calls: string[] = []) {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    calls.push(`${url.host}${url.pathname}`);
    const key = Object.keys(routes).find((k) => `${url.host}${url.pathname}`.startsWith(k));
    if (!key) throw new Error(`unexpected ${url.href}`);
    return new Response(JSON.stringify(routes[key](url, init)), { status: 200 });
  }) as typeof fetch;
}
const noSleep = () => Promise.resolve();

Deno.test('normalizeTitle strips features, versions and punctuation', () => {
  assertEquals(normalizeTitle('Blinding Lights (feat. Someone) - Remastered 2020'), 'blinding lights');
  assertEquals(normalizeTitle('HUMBLE.'), 'humble');
  assertEquals(normalizeTitle('Beyoncé'), 'beyoncé');
});

Deno.test('deezerBpm uses the ISRC lookup when it has a tempo', async () => {
  const calls: string[] = [];
  const f = fakeFetch({ 'api.deezer.com/track/isrc:USX1': () => ({ id: 1, title: 'Song', bpm: 128.4 }) }, calls);
  assertEquals(await deezerBpm(f, { isrc: 'USX1', title: 'Song', artist: 'A' }), 128.4);
  assertEquals(calls.length, 1);
});

Deno.test('deezerBpm falls back to search when the ISRC has no tempo, matching title fuzzily', async () => {
  const f = fakeFetch({
    'api.deezer.com/track/isrc:USX1': () => ({ id: 1, title: 'Song', bpm: 0 }),
    'api.deezer.com/search/track': (url) => {
      assertEquals(url.searchParams.get('q'), 'The Artist song');
      return { data: [
        { id: 7, title: 'Song (Live)', artist: { name: 'Someone Else' } },
        { id: 8, title: 'Song - Radio Edit', artist: { name: 'The Artist' } },
      ] };
    },
    'api.deezer.com/track/8': () => ({ id: 8, bpm: 101 }),
  });
  assertEquals(await deezerBpm(f, { isrc: 'USX1', title: 'Song (feat. X)', artist: 'The Artist' }), 101);
});

Deno.test('deezerBpm returns null for an ISRC error with no search match', async () => {
  const f = fakeFetch({
    'api.deezer.com/track/isrc:': () => ({ error: { code: 800, message: 'no data' } }),
    'api.deezer.com/search/track': () => ({ data: [{ id: 3, title: 'Different', artist: { name: 'The Artist' } }] }),
  });
  assertEquals(await deezerBpm(f, { isrc: 'NOPE', title: 'Song', artist: 'The Artist' }), null);
});

Deno.test('musicBrainzArtistGenres takes an exact high-score match, top genres by votes', async () => {
  let ua = '';
  const f = fakeFetch({
    'musicbrainz.org/ws/2/artist/': (url, init) => {
      ua = new Headers(init?.headers).get('User-Agent') ?? '';
      if (url.pathname.endsWith('/artist/')) {
        return { artists: [{ id: 'mb-1', name: 'The Artist', score: 100 }] };
      }
      return { genres: [{ name: 'indie rock', count: 2 }, { name: 'shoegaze', count: 9 }] };
    },
  });
  assertEquals(await musicBrainzArtistGenres(f, 'The Artist', noSleep), ['shoegaze', 'indie rock']);
  assertEquals(ua.includes('github.com/megangroothuis/pulse-ios'), true);
});

Deno.test('musicBrainzArtistGenres rejects low-confidence or different-name matches', async () => {
  const f = fakeFetch({
    'musicbrainz.org/ws/2/artist/': () => ({ artists: [{ id: 'x', name: 'The Artistes', score: 95 }, { id: 'y', name: 'The Artist', score: 60 }] }),
  });
  assertEquals(await musicBrainzArtistGenres(f, 'The Artist', noSleep), []);
});
