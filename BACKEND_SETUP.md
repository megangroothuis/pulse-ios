# Pulse backend setup

This guide takes the app from demo mode (bundled mock data) to live mode: real
logins, a real Supabase database, and real Spotify and Strava data turned into
Session cards.

## How it fits together

```
iOS / web app ──(Supabase anon key + user login)──► Supabase
   │                                                 ├─ Auth: email code, Sign in with Apple
   │                                                 ├─ Postgres (RLS: users only read their own rows)
   │                                                 └─ Edge Functions (hold every secret)
   │                                                      oauth-start / oauth-callback  ◄─► Spotify, Strava
   │                                                      sync (you, or every 20 min via pg_cron)
   │                                                      disconnect / delete-account
   └── opens Spotify/Strava consent in a browser ──► oauth-callback ──► back to pulse://connected
```

What the sync does, per user:

1. **Spotify.** Saves new plays from "recently played" (with `after` cursor),
   plus track metadata. Spotify only exposes the **last 50 plays**, which is why
   the background sync runs every 20 minutes.
2. **BPM and energy.** Looked up from [ReccoBeats](https://reccobeats.com) by
   Spotify track ID. Spotify stopped giving audio features to new apps in
   November 2024. Genres come from Spotify artist data when available.
3. **Strava.** Saves new activities. For those with heart rate, it fetches the
   per-second `time` / `heartrate` / `velocity_smooth` streams.
4. **Sessions.** For every workout with heart rate, each HR sample is matched to
   the song playing at that second (`supabase/functions/_shared/transform.ts`).
   That produces the heat map, the peak HR, the power song (highest average HR),
   and the genre breakdown with badges.

The app never sees a client secret or a provider token. Tokens live in the
`private` schema, which the Data API does not expose.

---

## 1. Create the Supabase project

1. Create a project at <https://supabase.com/dashboard>.
2. **Project Settings → API**: note the **Project URL** and the **anon / publishable key**.
3. Install the CLI on your Mac (`brew install supabase/tap/supabase`), then from the repo root:

   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push          # applies supabase/migrations/*
   ```

## 2. Auth settings (Supabase dashboard → Authentication)

- **Email** provider: enabled. Under **Emails → Templates → Magic Link**, include
  `{{ .Token }}` in the body so users get a **6-digit code**. The app asks for the code
  instead of opening a link.
- For real users, set up **custom SMTP** (Authentication → Emails → SMTP settings).
  The built-in sender is heavily rate-limited.
- **Sign in with Apple** (iOS only):
  1. In the Apple Developer portal, enable *Sign in with Apple* for the
     `com.pulse.app` App ID.
  2. In Supabase: Authentication → Providers → Apple → enable, and add `com.pulse.app`
     under *Client IDs*. For native sign-in, the bundle ID is all it needs. A Services ID
     and key are only needed for Apple sign-in on the web.

## 3. Register the Spotify app

1. <https://developer.spotify.com/dashboard> → Create app → select **Web API**.
2. **Redirect URI**: `https://<your-project-ref>.supabase.co/functions/v1/oauth-callback`
3. Note the **Client ID** and **Client secret**.
4. **User Management**: while the app is in development mode, only Spotify accounts
   you add here can connect. Add yourself and your testers. Going public needs
   Spotify's extended-quota approval.

## 4. Register the Strava app

1. <https://www.strava.com/settings/api> → create an app.
2. **Authorization Callback Domain**: `<your-project-ref>.supabase.co`
3. Note the **Client ID** and **Client Secret**.
4. New Strava apps can only connect **1 athlete** (you) until you request more capacity
   from Strava. Its API agreement also limits showing a user's Strava data to
   *other* users, which matters for the future social feed.

## 5. Function secrets and deploy

```bash
supabase secrets set \
  SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... \
  STRAVA_CLIENT_ID=...  STRAVA_CLIENT_SECRET=... \
  OAUTH_STATE_SECRET="$(openssl rand -hex 32)" \
  CRON_SECRET="$(openssl rand -hex 32)" \
  APP_REDIRECT_URLS="http://localhost:8081"   # web origins allowed to receive OAuth results (comma-separated)

supabase functions deploy oauth-start oauth-callback sync disconnect delete-account --use-api
```

`--use-api` bundles on Supabase's side, so Docker isn't needed.

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL`
are provided to functions automatically. The native app always returns to `pulse://`,
which is allowed by default. Add your deployed web origin to `APP_REDIRECT_URLS` if you
ship the web build.

If the project already has tables from an earlier design with the same names
(`profiles`, `sessions`, `tracks`, `workouts`), move them out of `public` first,
for example into a `legacy` schema. Otherwise the migration fails.

## 6. Background sync (pg_cron)

In the Supabase SQL editor, once:

```sql
select vault.create_secret('https://<your-project-ref>.supabase.co', 'project_url');
select vault.create_secret('<the CRON_SECRET you set above>', 'cron_secret');
```

The migration `20260924000100_sync_cron.sql` schedules `sync` every 20 minutes. It
enables `pg_cron` and `pg_net`. If `db push` complains, enable both under Database →
Extensions and push again.

## 7. Point the app at it

Create `.env` in the repo root (gitignored):

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
```

Restart Metro. With those two set, the app shows the sign-in screen, and the feed shows
your real sessions. Without them it runs in demo mode on mock data.

**iOS native build on your Mac:** `cd ios && pod install && cd .. && npx expo run:ios --device`
(the `ios/` folder is regenerated from `app.config.js`; after changing the config, run
`npx expo prebuild -p ios --clean` first).
OAuth returns to the `pulse://` scheme, which works in a development build but not in
Expo Go.

## 7b. Install on your iPhone (TestFlight, no cable or Xcode needed)

The project is set up for Expo's cloud build service (EAS). `eas.json` already
contains the Supabase URL and publishable key for the build. The iOS bundle ID is
`com.megangroothuis.pulse`: `com.pulse.app` belongs to someone else on the App
Store. From any Mac or PC terminal in the repo:

```bash
npm install -g eas-cli
eas login                     # free Expo account (create one at expo.dev if needed)
eas init                      # creates the Expo project; with app.config.js it prints an
                              # `extra.eas.projectId` (and `owner`). Add them to app.config.js
eas build -p ios --profile production
```

`eas build` asks for your Apple Developer login once. It then registers the bundle ID
(with Sign in with Apple), and creates the signing certificate and provisioning profile.
The build takes about 15–20 minutes on Expo's servers. Then:

```bash
eas submit -p ios --latest    # uploads the build to App Store Connect
```

- If `eas submit` can't create the app because the **name "Pulse" is taken** on the
  App Store, create the app yourself in [App Store Connect](https://appstoreconnect.apple.com)
  → Apps → + with a unique name (e.g. "Pulse: Music x Movement") and bundle ID
  `com.megangroothuis.pulse`, then run `eas submit` again. The name under the icon on
  your phone stays "Pulse".
- In App Store Connect → your app → **TestFlight**, add yourself under *Internal Testing*
  (no Apple review needed). Install the **TestFlight** app on your iPhone and accept the invite.
- Each later `eas build` + `eas submit` shows up in TestFlight automatically (build numbers
  auto-increment).

## 8. Try it

1. Sign in with your email code.
2. You → Connect **Spotify**, then **Strava**.
3. Record a workout with heart rate on Strava while listening on Spotify. Once it has
   synced to Strava, pull down on Today's Mix (or wait for the 20-minute sync).

Only music played **after** you connect Spotify (plus the last 50 plays at connect time)
can be matched, so older workouts won't have sessions.

---

## Things to verify with your first real data

These were built against the providers' documented behaviour and tested with fixtures,
but couldn't be exercised against the live APIs from the cloud sandbox:

- **`played_at` meaning.** `transform.ts` treats Spotify's `played_at` as the moment a
  track *ended* (`PLAYED_AT_MARKS = 'end'`). If songs look shifted by one track against
  your heart rate, flip it to `'start'`.
- **ReccoBeats response shape.** Results are matched back by the Spotify URL in each
  item's `href`. If tracks come back with no BPM, check a raw response from
  `https://api.reccobeats.com/v1/audio-features?ids=<spotify id>`.
- **Genres.** Spotify has been removing artist fields for development-mode apps. If every
  genre shows as "Other", Spotify isn't returning genres to the app.

## Testing

```bash
npm run verify    # typecheck, backend unit tests, bundles, demo + live-mode smoke tests
ADMIN_DATABASE_URL=postgres://postgres@localhost:5432/postgres npm run test:functions
                  # adds RLS + end-to-end sync tests against a throwaway database
```

The live-mode smoke test runs the app against `scripts/mock-supabase.cjs`, a small local
stand-in for Supabase. It covers sign-in, the OAuth popup round trip, the feed, the
detail screen, disconnect, sign-out and account deletion.
