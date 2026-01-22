# API Setup Instructions

This guide will help you set up Spotify and Strava API authentication for testing.

## Prerequisites

- Expo Go app installed on your device
- Spotify Developer Account
- Strava Account

## Step 1: Get API Credentials

### Spotify

1. Go to https://developer.spotify.com/dashboard
2. Click "Create app"
3. Fill in:
   - App name: `Pulse` (or any name)
   - App description: (optional)
   - Redirect URI: **Leave blank for now** - we'll get this from the app console
   - Website: (optional)
4. After creating, note your **Client ID** and **Client Secret**

### Strava

1. Go to https://www.strava.com/settings/api
2. Click "Create App"
3. Fill in:
   - Application Name: `Pulse`
   - Category: Personal
   - Website: (optional)
   - Application Description: (optional)
   - Authorization Callback Domain: **Leave blank for now** - we'll get this from the app console
4. After creating, note your **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Create or update your `.env` file in the root of the project:

```env
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
EXPO_PUBLIC_STRAVA_CLIENT_ID=your_strava_client_id_here
EXPO_PUBLIC_STRAVA_CLIENT_SECRET=your_strava_client_secret_here
```

**Important:** 
- Use `EXPO_PUBLIC_` prefix so variables are accessible in the app
- Never commit your `.env` file to git (it should already be in `.gitignore`)

## Step 3: Run the App and Get Redirect URIs

1. Start your Expo development server:
   ```bash
   npm start
   ```

2. Open the app in Expo Go

3. Navigate to the "ApiTest" screen (you may need to add it to your navigation or access it directly)

4. Check the **console/terminal** where you ran `npm start` - you'll see output like:
   ```
   Spotify Redirect URI: https://auth.expo.io/@username/pulse
   Strava Redirect URI: https://auth.expo.io/@username/pulse
   ```

5. Copy these redirect URIs

## Step 4: Add Redirect URIs to API Dashboards

### Spotify

1. Go back to https://developer.spotify.com/dashboard
2. Click on your app
3. Click "Edit Settings"
4. Add the redirect URI from the console to the "Redirect URIs" field:
   - Format: `https://auth.expo.io/@username/pulse` (use the exact URI from console)
5. Click "Add" then "Save"

### Strava

1. Go back to https://www.strava.com/settings/api
2. Click on your app
3. In the "Authorization Callback Domain" field, enter the redirect URI from the console:
   - Format: `https://auth.expo.io/@username/pulse` (use the exact URI from console)
   - **Note:** Strava may only accept the domain part. If so, try: `auth.expo.io`
4. Save changes

## Step 5: Test Authentication

1. In the app, go to the "ApiTest" screen
2. Click "Connect Spotify" - it should open a browser/Expo browser for authentication
3. Authorize the app
4. You should see "Connected" status and a token preview
5. Repeat for Strava

## Troubleshooting

### "Client ID not found" error
- Make sure your `.env` file has `EXPO_PUBLIC_` prefix
- Restart your Expo development server after adding environment variables
- Check that the variable names match exactly

### Redirect URI mismatch
- Make sure the redirect URI in your API dashboard matches exactly what's shown in the console
- For Strava, if it won't accept the full URL, try just the domain part

### OAuth flow not completing
- Make sure you're using Expo Go (not a custom build)
- The `useProxy: true` option requires Expo's OAuth proxy service
- Check your internet connection

### Tokens not saving
- This uses `expo-secure-store` which requires the app to be running on a device/simulator
- Web version may have limitations

## What's Next?

Once authentication is working:
- Tokens are stored securely using `expo-secure-store`
- You can check connection status with `isSpotifyConnected()` and `isStravaConnected()`
- Get tokens with `getSpotifyToken()` and `getStravaToken()`
- Use these tokens to make API calls to Spotify and Strava
