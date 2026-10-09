#!/usr/bin/env node
// Tiny stand-in for the Supabase endpoints the app calls, so live mode can be
// exercised in a sandbox with no network access to supabase.co:
//   auth (email OTP), PostgREST reads, and the oauth-start/sync/disconnect
//   Edge Functions, plus a fake provider consent page that redirects back.
// Used by scripts/smoke-live.cjs. Not a general-purpose mock.
//
//   node scripts/mock-supabase.cjs [port]

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || process.env.MOCK_SUPABASE_PORT || 54321);
const USER_ID = '00000000-0000-4000-8000-00000000abcd';
const EMAIL = 'megan@example.com';
const OTP = '123456';
const session = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'live-session.json'), 'utf8'));

// Mutable state the test can observe through the UI.
const state = { connections: [], syncCalls: 0 };

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const accessToken =
  `${b64url({ alg: 'HS256', typ: 'JWT' })}.` +
  `${b64url({ sub: USER_ID, email: EMAIL, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 86400 })}.sig`;
const user = { id: USER_ID, email: EMAIL, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} };

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Content-Type': 'application/json',
    ...headers,
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

function authed(req) {
  return req.headers.authorization === `Bearer ${accessToken}`;
}

const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const body = raw ? JSON.parse(raw) : {};
    if (req.method === 'OPTIONS') return send(res, 204);

    // ---- auth
    if (url.pathname === '/auth/v1/otp') return send(res, 200, {});
    if (url.pathname === '/auth/v1/verify') {
      if (body.token !== OTP || body.email !== EMAIL) {
        return send(res, 403, { code: 'otp_expired', error_code: 'otp_expired', msg: 'Token has expired or is invalid' });
      }
      return send(res, 200, {
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: 'mock-refresh',
        user,
      });
    }
    if (url.pathname === '/auth/v1/user') return authed(req) ? send(res, 200, user) : send(res, 401, { msg: 'bad jwt' });
    if (url.pathname === '/auth/v1/logout') return send(res, 204);

    // ---- PostgREST (RLS is implied: everything returned belongs to the user)
    if (url.pathname.startsWith('/rest/v1/')) {
      if (!authed(req)) return send(res, 401, { message: 'JWT required' });
      const table = url.pathname.slice('/rest/v1/'.length);
      const single = (req.headers.accept || '').includes('vnd.pgrst.object');
      if (table === 'profiles') {
        const row = { id: USER_ID, display_name: 'Megan', avatar_url: null };
        return send(res, 200, single ? row : [row]);
      }
      if (table === 'sessions') return send(res, 200, state.connections.length === 2 ? [session] : []);
      if (table === 'connections') return send(res, 200, state.connections);
      return send(res, 404, { message: `unknown table ${table}` });
    }

    // ---- Edge Functions
    if (url.pathname.startsWith('/functions/v1/')) {
      const fn = url.pathname.slice('/functions/v1/'.length);
      if (fn !== 'oauth-callback' && !authed(req)) return send(res, 401, { error: 'Not signed in' });
      if (fn === 'oauth-start') {
        const consent = new URL(`http://localhost:${PORT}/consent`);
        consent.searchParams.set('provider', body.provider);
        consent.searchParams.set('returnTo', body.returnTo);
        return send(res, 200, { url: consent.href });
      }
      if (fn === 'sync') {
        state.syncCalls++;
        return send(res, 200, { newPlays: 0, newWorkouts: 0, sessionsComputed: 0, errors: [] });
      }
      if (fn === 'delete-account') {
        state.connections = [];
        state.deleted = true;
        return send(res, 200, { ok: true });
      }
      if (fn === 'disconnect') {
        state.connections = state.connections.filter((c) => c.provider !== body.provider);
        return send(res, 200, { ok: true });
      }
    }

    // ---- fake provider consent -> "approve" -> back to the app (what oauth-callback does)
    if (url.pathname === '/consent') {
      const provider = url.searchParams.get('provider');
      const back = new URL(url.searchParams.get('returnTo'));
      back.searchParams.set('provider', provider);
      back.searchParams.set('status', 'connected');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(
        `<!doctype html><title>Authorize ${provider}</title>` +
          `<h1>Authorize Pulse to use your ${provider} account?</h1>` +
          `<a id="approve" href="/approve?provider=${provider}&back=${encodeURIComponent(back.href)}">Agree</a>`,
      );
    }
    if (url.pathname === '/approve') {
      const provider = url.searchParams.get('provider');
      state.connections = state.connections
        .filter((c) => c.provider !== provider)
        .concat({
          provider,
          provider_display_name: provider === 'spotify' ? 'megan.spotify' : 'Megan G',
          connected_at: new Date().toISOString(),
          last_synced_at: null,
          last_error: null,
        });
      res.writeHead(302, { Location: url.searchParams.get('back') });
      return res.end();
    }

    if (url.pathname === '/__state') return send(res, 200, state);
    send(res, 404, { message: `mock-supabase: no route for ${req.method} ${url.pathname}` });
  });
});

server.listen(PORT, () => console.log(`mock-supabase listening on :${PORT}`));
