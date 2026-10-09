// Strava push events (https://developers.strava.com/docs/webhooks/).
//
// One subscription per Strava app. Strava validates it with a GET carrying
// hub.challenge, then POSTs an event for every activity create/update/delete
// and athlete deauthorization. Each POST must get a 200 within 2 seconds, so
// the sync runs in the background after responding.
//
// Events aren't signed. A new activity only triggers a sync, which re-reads
// everything from Strava with the user's own token, so a forged event can't
// inject data. That's why only `create` is acted on: deletes and edits would
// trust the event body.

export interface StravaEvent {
  object_type: 'activity' | 'athlete';
  aspect_type: 'create' | 'update' | 'delete';
  object_id: number;
  owner_id: number;
  subscription_id: number;
  event_time: number;
  updates?: Record<string, string>;
}

export interface WebhookDeps {
  verifyToken: string;
  /** If set, events from any other subscription are ignored. */
  subscriptionId?: string;
  /** Pulse user connected to this Strava athlete, if any. */
  userForAthlete: (athleteId: string) => Promise<string | null>;
  syncUser: (userId: string) => Promise<unknown>;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Returns the response, plus background work to keep alive after it is sent. */
export function handleStravaWebhook(
  req: Request,
  body: unknown,
  deps: WebhookDeps,
): { response: Response; background?: Promise<void> } {
  if (req.method === 'GET') {
    const q = new URL(req.url).searchParams;
    const challenge = q.get('hub.challenge');
    if (q.get('hub.mode') !== 'subscribe' || !challenge || q.get('hub.verify_token') !== deps.verifyToken) {
      return { response: jsonResponse({ error: 'Verification failed' }, 403) };
    }
    return { response: jsonResponse({ 'hub.challenge': challenge }) };
  }

  if (req.method !== 'POST') return { response: jsonResponse({ error: 'Method not allowed' }, 405) };

  const ev = body as Partial<StravaEvent> | null;
  const ok = { response: jsonResponse({ ok: true }) };
  if (!ev || ev.object_type !== 'activity' || ev.aspect_type !== 'create' || ev.owner_id == null) return ok;
  if (deps.subscriptionId && String(ev.subscription_id) !== deps.subscriptionId) return ok;

  const background = (async () => {
    const userId = await deps.userForAthlete(String(ev.owner_id));
    if (!userId) return;
    await deps.syncUser(userId);
  })().catch((err) => console.error('strava-webhook: sync failed', err));
  return { ...ok, background };
}
