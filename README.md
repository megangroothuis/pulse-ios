# Pulse

A mobile app that connects music and movement data for iOS and Android.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm start
```

Without a `.env` the app runs in **demo mode** on bundled mock data. To use
real logins and your own Spotify + Strava data, follow
[BACKEND_SETUP.md](BACKEND_SETUP.md) and set `EXPO_PUBLIC_SUPABASE_URL` /
`EXPO_PUBLIC_SUPABASE_ANON_KEY`.

3. Run on iOS or Android:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your device

## Project Structure

```
src/
  components/     # Reusable UI components
  screens/        # Screen components
  context/        # Live data (auth, sessions, connections) and saves
  lib/            # Supabase client, API calls, config
  types/          # TypeScript type definitions
  data/           # Mock data for demo mode
  assets/         # Images and other assets
supabase/         # Database migrations and Edge Functions (Spotify/Strava sync)
```

## Pages

- **Mixdown**: Feed showing sessions and setlists from you and people you follow
- **Studio**: Workout insights and playlist creation (coming soon)
- **You**: Profile, Spotify/Strava connections, saved content
