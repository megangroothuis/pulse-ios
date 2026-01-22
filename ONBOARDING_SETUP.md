# Onboarding Setup Guide

This guide will help you set up the user onboarding flow with Clerk authentication and account connections.

## Prerequisites

1. **Clerk Account**: Sign up at [clerk.com](https://clerk.com) and create a new application
2. **Supabase Project**: Ensure your Supabase project is set up and running

## Step 1: Configure Clerk

1. Go to your Clerk Dashboard
2. Navigate to **API Keys** and copy your **Publishable Key**
3. Add it to your `.env` file:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

4. In Clerk Dashboard, go to **User & Authentication → Phone**
   - Enable **Phone number verification**
   - Enable **Add phone to account**

5. In Clerk Dashboard, go to **User & Authentication → Social Connections**
   - Enable **Spotify** OAuth
   - Enable **Strava** OAuth
   - Configure the OAuth apps with your Spotify and Strava app credentials

6. For OAuth redirect URLs, add:
   - `pulse://oauth-callback` (for native apps)
   - Your web callback URL if using web

## Step 2: Set Up Supabase Database

Run the SQL script in `supabase_schema.sql` in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase_schema.sql`
4. Run the script

This will create:
- `users` table - stores user information synced from Clerk
- `connected_accounts` table - stores OAuth connections
- Row Level Security (RLS) policies for data protection

## Step 3: Environment Variables

Make sure your `.env` file contains:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Clerk
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

## Step 4: OAuth App Setup

### Spotify OAuth Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `pulse://oauth-callback` (or your web callback URL)
4. Copy Client ID and Client Secret
5. Add these to Clerk Dashboard under Spotify OAuth settings

### Strava OAuth Setup

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create a new application
3. Add redirect URI: `pulse://oauth-callback` (or your web callback URL)
4. Copy Client ID and Client Secret
5. Add these to Clerk Dashboard under Strava OAuth settings

## Step 5: Test the Flow

1. Start your Expo app: `npm start`
2. The app should show the Phone Authentication screen
3. Enter a phone number and verify with SMS code
4. After authentication, you'll see the Account Connection screen
5. Connect Spotify and Strava accounts
6. Once both are connected, you can continue to the main app

## Troubleshooting

### Phone Authentication Not Working

- Check that phone verification is enabled in Clerk Dashboard
- Ensure your phone number is in E.164 format (+1234567890)
- Check Clerk logs for errors

### OAuth Not Working

- Verify redirect URIs match in both Clerk and OAuth provider settings
- Check that OAuth apps are properly configured in Clerk Dashboard
- Ensure the app scheme `pulse://` is configured in `app.json`

### Database Errors

- Verify the Supabase schema was created correctly
- Check that RLS policies are enabled
- Ensure your Supabase anon key has proper permissions

### User Not Syncing to Supabase

- Check that `createOrUpdateUser` is being called after authentication
- Verify Supabase connection in `src/lib/supabase.ts`
- Check browser console for errors

## Notes

- OAuth tokens are currently stored as placeholders. In production, you'll need to:
  - Set up Clerk webhooks to receive OAuth tokens
  - Store tokens securely (encrypted) in Supabase
  - Implement token refresh logic

- The onboarding flow can be skipped, but users will be prompted again on next launch if not completed

- Other providers (Apple Music, YouTube Music, Garmin, Fitbit) are marked as "Coming Soon" and will be implemented later
