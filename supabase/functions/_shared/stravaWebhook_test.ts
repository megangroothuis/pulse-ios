import { assertEquals } from '@std/assert';
import { handleStravaWebhook, WebhookDeps } from './stravaWebhook.ts';

const URL_BASE = 'https://x.supabase.co/functions/v1/strava-webhook';

function deps(overrides: Partial<WebhookDeps> = {}) {
  const synced: string[] = [];
  const d: WebhookDeps = {
    verifyToken: 'tok',
    userForAthlete: (id) => Promise.resolve(id === '42' ? 'user-1' : null),
    syncUser: (u) => {
      synced.push(u);
      return Promise.resolve();
    },
    ...overrides,
  };
  return { d, synced };
}

const event = (o: Record<string, unknown> = {}) => ({
  object_type: 'activity', aspect_type: 'create', object_id: 7, owner_id: 42, subscription_id: 99, event_time: 1,
  ...o,
});

const post = (body: unknown, d: WebhookDeps) =>
  handleStravaWebhook(new Request(URL_BASE, { method: 'POST' }), body, d);

Deno.test('subscription validation echoes the challenge only with the right token', async () => {
  const { d } = deps();
  const good = handleStravaWebhook(
    new Request(`${URL_BASE}?hub.mode=subscribe&hub.challenge=abc&hub.verify_token=tok`), null, d);
  assertEquals(good.response.status, 200);
  assertEquals(await good.response.json(), { 'hub.challenge': 'abc' });

  const bad = handleStravaWebhook(
    new Request(`${URL_BASE}?hub.mode=subscribe&hub.challenge=abc&hub.verify_token=nope`), null, d);
  assertEquals(bad.response.status, 403);
});

Deno.test('new activity syncs the connected user', async () => {
  const { d, synced } = deps();
  const r = post(event(), d);
  assertEquals(r.response.status, 200);
  await r.background;
  assertEquals(synced, ['user-1']);
});

Deno.test('other events, unknown athletes and foreign subscriptions are acknowledged but ignored', async () => {
  const { d, synced } = deps({ subscriptionId: '99' });
  for (const body of [
    event({ aspect_type: 'update' }),
    event({ aspect_type: 'delete' }),
    event({ object_type: 'athlete', updates: { authorized: 'false' } }),
    event({ subscription_id: 1 }),
    event({ owner_id: 5 }),
    null,
  ]) {
    const r = post(body, d);
    assertEquals(r.response.status, 200);
    await r.background;
  }
  assertEquals(synced, []);
});

Deno.test('a failing sync still returns 200', async () => {
  const { d } = deps({ syncUser: () => Promise.reject(new Error('boom')) });
  const r = post(event(), d);
  assertEquals(r.response.status, 200);
  await r.background;
});
