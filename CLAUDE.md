# Pulse — CLAUDE.md

Expo SDK 54 / React Native 0.81 / React 19 app (TypeScript) that pairs music and
workout data. Targets iOS; also runs on web via react-native-web, and **web is
how you run and check it in a Linux/cloud session** (no iOS simulator there).

All screens that `App.tsx` routes to render **bundled mock data**
(`src/data/mockData.ts`). No backend, database, or API key is needed to run,
build, or verify the app.

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

There is **no unit test suite**. The verification loop is:

```bash
npm run verify                  # typecheck + web & iOS bundles + headless smoke (~30s)
SKIP_BUNDLES=1 npm run verify   # faster: typecheck + smoke only
```

Individual pieces:

| Command | What it checks |
|---|---|
| `npm run typecheck` | `tsc` over code reachable from `App.tsx` (`tsconfig.app.json`) |
| `npm run build:web` / `npm run build:ios-bundle` | Metro can bundle the app for that platform (output in `dist/`, gitignored) |
| `npm run smoke` | Needs the dev server running. Headless Chromium loads Today's Mix → Studio → You and fails on any uncaught page error. Screenshots go to `.smoke/` |

**Typecheck baseline:** there are **13 pre-existing type errors**, mostly
`timestamp: string` vs `Date` where objects are serialised for navigation params,
plus `compact` and `saves` prop mismatches. `verify.sh` fails only if the count goes
*above* `TYPECHECK_BASELINE`. If you fix some, lower the number there. Never
raise it.

## How to confirm a fix actually works

1. Reproduce first. Run `npm run verify`, or start `npm run dev:web` and drive the
   affected screen with Playwright (copy the pattern in `scripts/smoke-web.cjs`).
   Use `page.screenshot()` and look at the image.
2. Make the change.
3. Run `npm run verify`. It must print `VERIFY PASSED`, with no new type errors.
4. If the change touches a screen the smoke test doesn't cover (detail screens,
   Explore tab, Studio builders), extend `scripts/smoke-web.cjs` with a step for
   it rather than checking by hand once.
5. Look at the screenshots in `.smoke/` for visual changes.

Web is a proxy for iOS. Native-only APIs (`expo-secure-store`, OAuth redirects,
haptics) cannot be checked here, so say so when a fix depends on them.

## Project structure

```
App.tsx                 Navigation stack (Mixdown, Studio, You, *Detail screens)
app.config.js           Real Expo config (loads .env via dotenv; app.json is effectively ignored)
src/
  screens/              Mixdown (feed, "Today's Mix"), Studio (AI builders), You (profile/saves),
                        Session/Setlist/SyncDetail. PhoneAuth, AccountConnection and ApiTest are NOT routed.
  components/           Cards (Session/Setlist/Sync), DualAxisChart, GenreBreakdown, AIInsights
  context/              SavedItemsContext (in-memory saves, used); AuthContext (Clerk, unused)
  data/mockData.ts      All feed/profile data the app shows
  lib/                  auth.ts, spotifyAuth.ts, stravaAuth.ts (unused); db.ts & supabase.ts are EMPTY
  types/index.ts        Session / Setlist / Sync / FeedItem types
ios/                    Prebuilt native iOS project (Xcode/CocoaPods, macOS only)
scripts/
  cloud-setup.sh        Environment setup (idempotent)
  verify.sh             Full verification (npm run verify)
  smoke-web.cjs         Headless Playwright smoke test
supabase_schema*.sql    Planned DB schema (not used by the running app)
*.md (root)             Setup notes for planned Clerk/Supabase/Spotify/Strava integration
```

## Environment variables

None are needed for the current app. See `.env.example`. `.env` is gitignored.
`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY` and
`EXPO_PUBLIC_{SPOTIFY,STRAVA}_CLIENT_ID/SECRET` are read only by unrouted code.
Tooling vars: `EXPO_OFFLINE=1` (required in the cloud sandbox),
`EXPO_NO_TELEMETRY=1`, `CI=1` (turns off Metro watch mode, so leave it unset while iterating).

## Gotchas

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
- **Plain `npx tsc --noEmit` fails** on a syntax error in
  `src/screens/AccountConnectionScreen.tsx`, which has a duplicated component
  header from a half-finished edit. That file, `PhoneAuthScreen`, `AuthContext`
  and `src/lib/auth.ts` are unrouted work-in-progress and import names from the
  **empty** `src/lib/db.ts`. Use `npm run typecheck`, which is scoped to live code.
- **Importing `AuthContext` throws at module load** if
  `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is unset. Wiring it into `App.tsx` makes the
  app crash in any environment without a Clerk key.
- `RootStackParamList` lists `ApiTest`, but no screen is registered for it.
- **Security:** `EXPO_PUBLIC_*_CLIENT_SECRET` values would be inlined into the
  shipped JS bundle. Real Spotify/Strava secrets must live server-side, not in
  `EXPO_PUBLIC_` vars.
- `src/assets/images/meganprofilepic.png` is ~18 MB and slows bundling and web
  load. Avoid adding more assets that large.
- `start-expo.sh` hardcodes a macOS path (`/Users/megangroothuis/Desktop/PULSE`).
  Use the npm scripts instead.
- The native `ios/` project can't be built on Linux. `npm run build:ios-bundle`
  only proves the JS bundles for iOS.
