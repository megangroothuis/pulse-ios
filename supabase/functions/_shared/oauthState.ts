// Signed, short-lived OAuth `state`. It carries who started the flow and where
// to send them afterwards, so the (unauthenticated) callback can trust it.

export interface OAuthState {
  userId: string;
  provider: 'spotify' | 'strava';
  returnTo: string;
  exp: number; // epoch seconds
}

const enc = new TextEncoder();

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

export async function signState(state: OAuthState, secret: string): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(state)));
  return `${body}.${b64url(await hmac(secret, body))}`;
}

export async function verifyState(token: string, secret: string, now = Date.now()): Promise<OAuthState> {
  const [body, sig] = token.split('.');
  if (!body || !sig) throw new Error('Malformed state');
  const expected = await hmac(secret, body);
  const given = fromB64url(sig);
  let diff = expected.length ^ given.length;
  for (let i = 0; i < Math.min(expected.length, given.length); i++) diff |= expected[i] ^ given[i];
  if (diff !== 0) throw new Error('Bad state signature');
  const state = JSON.parse(new TextDecoder().decode(fromB64url(body))) as OAuthState;
  if (state.exp * 1000 < now) throw new Error('State expired');
  return state;
}

/**
 * Only redirect back to the app itself: the custom scheme, or web origins
 * listed in APP_REDIRECT_URLS (comma-separated prefixes). Prevents the
 * callback from being used as an open redirect.
 */
export function isAllowedReturnTo(returnTo: string, allowList: string[]): boolean {
  let url: URL;
  try {
    url = new URL(returnTo);
  } catch {
    return false;
  }
  if (url.protocol === 'javascript:' || url.protocol === 'data:') return false;
  return allowList.some((prefix) => {
    if (!prefix) return false;
    if (!prefix.includes('//')) return url.protocol === prefix.replace(/:?$/, ':');
    // Compare origin + path prefix so "http://localhost:8081" doesn't match
    // "http://localhost:8081.evil.com".
    const p = new URL(prefix);
    return url.origin === p.origin && url.pathname.startsWith(p.pathname);
  });
}
