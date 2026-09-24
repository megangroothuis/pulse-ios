# Pulse — CLAUDE.md

Expo SDK 54 / React Native 0.81 / React 19 app (TypeScript) that pairs music and
workout data. Targets iOS; also runs on web via react-native-web, and **web is
how you run and check it in a Linux/cloud session** (no iOS simulator there).

The app has two modes, picked at build time by `src/lib/config.ts`:

- **Demo mode** (default, no env vars): every screen renders **bundled mock data**
  (`src/data/mockData.ts`). No backend or key is needed to run, build, or verify.
- **Live mode** (`EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` set):
  Supabase Auth sign-in, Spotify/Strava connections, and the feed shows the user's
  real sessions from Postgres. Backend lives in `supabase/`. Setup: `BACKEND_SETUP.md`.
  Explore, Studio, setlists and syncs still use mock data in live mode.

## Install

```bash
bash scripts/cloud-setup.sh   # idempotent: Node check, npm ci, playwright
```

or by hand: Node >= 20.19.4 (22 recommended), then `npm ci`. `.npmrc` sets
`legacy-peer-deps=true`, which the install needs.

## Run the app

```bash
npm run dev:web        # Metro + web on http://localhost:8081 (EXPO_OFFLINE=1 baked in)
```

- Run it in the background and poll `curl -sf localhost:8081` until it answers.
  The first bundle compiles on the first page load.
- Stop it with `kill $(lsof -ti :8081)`. **Don't** use `pkill -f "expo start"`,
  because it also matches and kills your own shell command.
- On a Mac: `npm start`, then `i` for the iOS simulator, or `npm run ios` for a
  native build via `ios/`.

## Test / verify

The verification loop is:

```bash
npm run verify                  # typecheck + backend tests + bundles + demo & live smoke (~90s)
SKIP_BUNDLES=1 npm run verify   # faster: skip the bundle exports
```

Individual pieces:

| Command | What it checks |
|---|---|
| `npm run typecheck` | `tsc` over code reachable from `App.tsx` (`tsconfig.app.json`) |
| `npm run build:web` / `npm run build:ios-bundle` | Metro can bundle the app for that platform (output in `dist/`, gitignored) |
| `npm run smoke` | Needs the dev server running. Headless Chromium loads Today's Mix → Studio → You (demo mode) and fails on any uncaught page error. Screenshots go to `.smoke/` |
| `npm run test:functions` | Deno (via `npx deno`): type-checks the Edge Functions and runs `supabase/functions/_shared/*_test.ts`. With `ADMIN_DATABASE_URL` set it also creates a `pulse_test` DB (stub `auth` schema + migrations) and runs the RLS and end-to-end sync tests |
| `scripts/smoke-live.cjs` | Live mode against `scripts/mock-supabase.cjs` (local Supabase stand-in on :54321, app on :8082): sign-in, OAuth popup, feed, detail, disconnect, sign-out, delete account. `verify` starts both servers |

**Typecheck baseline:** there are **13 pre-existing type errors**, mostly
`timestamp: string` vs `Date` where objects are serialised for navigation params,
plus `compact` and `saves` prop mismatches. `verify.sh` fails only if the count goes
*above* `TYPECHECK_BASELINE`. If you fix some, lower the number there. Never
raise it.

**Local Postgres for DB tests** (Postgres 16 binaries are in the image; the
scratchpad isn't readable by the `postgres` user, so use `/var/tmp`):

```bash
D=/var/tmp/pulse-pg; PG=/usr/lib/postgresql/16/bin
mkdir -p $D && chown postgres $D
su postgres -c "$PG/initdb -D $D/data -A trust -U postgres && $PG/pg_ctl -D $D/data -o '-k $D -p 54329 -c listen_addresses=127.0.0.1' -l $D/log start"
ADMIN_DATABASE_URL=postgres://postgres@127.0.0.1:54329/postgres npm run verify
```

## How to confirm a fix actually works

1. Reproduce first. Run `npm run verify`, or start `npm run dev:web` and drive the
   affected screen with Playwright (copy the pattern in `scripts/smoke-web.cjs`).
   Use `page.screenshot()` and look at the image.
2. Make the change.
3. Run `npm run verify`. It must print `VERIFY PASSED`, with no new type errors.
4. If the change touches a screen the smoke tests don't cover (Explore tab,
   Studio builders), extend `scripts/smoke-web.cjs` (demo) or
   `scripts/smoke-live.cjs` (live) with a step for it rather than checking by
   hand once. Transform/sync changes need a test in `supabase/functions/_shared/`.
5. Look at the screenshots in `.smoke/` for visual changes.

Web is a proxy for iOS. Native-only APIs (`expo-secure-store` session storage,
Sign in with Apple, the `pulse://` OAuth redirect, haptics) cannot be checked
here, so say so when a fix depends on them. Real Spotify/Strava/ReccoBeats/Supabase
calls can't be made from the sandbox either (network policy); the mocks stand in.

## Project structure

```
App.tsx                 Navigation stack; in live mode wraps it in LiveProvider + sign-in gate
app.config.js           Real Expo config (loads .env via dotenv; app.json is effectively ignored)
src/
  screens/              Mixdown (feed, "Today's Mix"), Studio (AI builders), You (profile, connections),
                        Session/Setlist/SyncDetail, SignIn (live mode only)
  components/           Cards (Session/Setlist/Sync), DualAxisChart, GenreBreakdown, AIInsights
  context/              SavedItemsContext (in-memory saves); LiveContext (auth, sessions, connections)
  data/mockData.ts      Demo-mode feed/profile data
  lib/                  config.ts (mode switch), supabase.ts (client), api.ts (queries + OAuth connect),
                        secureStorage.ts (chunked Keychain storage for the auth session)
  types/index.ts        Session / Setlist / Sync / FeedItem types
supabase/
  migrations/           Schema + RLS; pg_cron background sync
  functions/            Deno Edge Functions: oauth-start, oauth-callback, sync, disconnect, delete-account
    _shared/            transform.ts (HR x songs -> session), sync.ts, providers.ts, tests
  tests/                Stub of Supabase's auth schema for local DB tests; fixture generator
ios/                    Prebuilt native iOS project (Xcode/CocoaPods, macOS only)
scripts/
  cloud-setup.sh        Environment setup (idempotent)
  verify.sh             Full verification (npm run verify)
  smoke-web.cjs         Headless Playwright smoke test (demo mode)
  smoke-live.cjs        Headless Playwright smoke test (live mode, against mock-supabase.cjs)
  test-functions.sh     Backend tests (Deno)
BACKEND_SETUP.md        Supabase / Spotify / Strava / Apple setup, deploy, and what to check with real data
```

## Environment variables

App (`.env`, see `.env.example`): `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY` switch on live mode. Nothing else goes in the app.
Edge Function secrets (Spotify/Strava client IDs and secrets, `OAUTH_STATE_SECRET`,
`CRON_SECRET`, `APP_REDIRECT_URLS`) are set with `supabase secrets set`; see
`BACKEND_SETUP.md`. Tooling vars: `EXPO_OFFLINE=1` (required in the cloud sandbox),
`EXPO_NO_TELEMETRY=1`, `CI=1` (turns off Metro watch mode, so leave it unset while iterating).

## Gotchas

- **Secrets never go in `EXPO_PUBLIC_*`.** Those are inlined into the shipped
  bundle. Provider client secrets and tokens stay in Edge Functions / the
  `private` schema. Don't add client-side token exchange.
- **Edge Functions talk to Postgres directly** (`postgres` driver +
  `SUPABASE_DB_URL`), not supabase-js, because tokens live in the `private`
  schema the Data API doesn't expose. `supabase/` is excluded from the app
  tsconfig; check it with `npm run test:functions` (Deno), not `tsc`.
- **Edge Function imports use full specifiers** (`npm:postgres@3`,
  `npm:@supabase/supabase-js@2`). The deploy bundler ignores the import map in
  `supabase/functions/deno.json`, which only aliases `@std/assert` for tests.
- **Deno must run from `supabase/functions/`** (or pass `--config deno.json`),
  otherwise it picks up the root tsconfig and fails on `jsx: react-native`.
- **Web OAuth popups:** the You screen prefetches authorize URLs
  (`prepareConnect`) so a tap opens the window without awaiting a request.
  Browsers block popups opened after an await. Keep it that way.
- **Metro inlines `EXPO_PUBLIC_*` at bundle time.** Live and demo mode need
  separate dev servers (verify uses :8081 demo, :8082 live).

- **`api.expo.dev` is blocked by the sandbox network policy.** `expo start`
  crashes with `Unexpected token 'H', "Host not i"... is not valid JSON` unless
  `EXPO_OFFLINE=1` is set. The npm scripts set it. Plain `npm start` / `npm run web`
  don't.
- **Web must use Metro.** `@expo/webpack-config` is in dependencies, which makes
  Expo default to the (unsupported in SDK 54) webpack bundler for web.
  `app.config.js` pins `web.bundler: "metro"`. Keep it.
- **Hidden screens stay in the DOM on web.** Screens underneath in the native stack are
  still rendered, so in Playwright match with `.filter({ visible: true })`, or
  you will hit invisible duplicates of "You", "Studio" and so on.
- `src/assets/images/meganprofilepic.png` is ~18 MB and slows bundling and web
  load. Avoid adding more assets that large.
- `start-expo.sh` hardcodes a macOS path (`/Users/megangroothuis/Desktop/PULSE`).
  Use the npm scripts instead.
- The native `ios/` project can't be built on Linux. `npm run build:ios-bundle`
  only proves the JS bundles for iOS.
