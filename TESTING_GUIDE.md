# Testing Guide for Onboarding Flow

This guide will help you test the complete user onboarding journey with Clerk authentication and account connections.

## Prerequisites Setup

### 1. Set Up Clerk Account

1. Go to [clerk.com](https://clerk.com) and sign up/login
2. Create a new application
3. Go to **API Keys** and copy your **Publishable Key**
4. Add it to your `.env` file:
   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

5. Configure Phone Authentication:
   - Go to **User & Authentication → Phone**
   - Enable **Phone number verification**
   - Enable **Add phone to account**

6. Configure OAuth Providers (for account connection):
   - Go to **User & Authentication → Social Connections**
   - Enable **Spotify** (you'll need Spotify app credentials)
   - Enable **Strava** (you'll need Strava app credentials)

### 2. Set Up Supabase Database

1. Go to your Supabase Dashboard → **SQL Editor**
2. Run the `supabase_schema_clean.sql` script (this will create the tables)
3. Verify tables were created:
   - Go to **Table Editor** and check for `users` and `connected_accounts` tables

### 3. Set Up OAuth Apps (Optional - for full testing)

**Spotify:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `pulse://oauth-callback`
4. Copy Client ID and Client Secret
5. Add to Clerk Dashboard under Spotify OAuth settings

**Strava:**
1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create a new application
3. Add redirect URI: `pulse://oauth-callback`
4. Copy Client ID and Client Secret
5. Add to Clerk Dashboard under Strava OAuth settings

## Testing Methods

### Option 1: Web Testing (Quickest - Limited OAuth)

**Pros:**
- Fastest to start
- Good for testing phone auth UI
- No device/simulator needed

**Cons:**
- OAuth flows won't work (native only)
- Can't test full account connection

**Steps:**
```bash
cd /Users/megangroothuis/Desktop/PULSE
npm run web
```

**What to Test:**
- ✅ Phone authentication screen appears
- ✅ Phone number input works
- ✅ SMS code verification (if Clerk test mode works)
- ✅ Navigation to account connection screen
- ⚠️ OAuth buttons will show but won't work on web

### Option 2: iOS Simulator (Recommended - Full Testing)

**Pros:**
- Full native functionality
- OAuth flows work
- Easy to test and debug

**Cons:**
- Requires Xcode (macOS only)
- Slower initial setup

**Steps:**
```bash
cd /Users/megangroothuis/Desktop/PULSE
npm run ios
```

**What to Test:**
- ✅ Complete phone auth flow
- ✅ SMS verification
- ✅ Account connection screen
- ✅ Spotify OAuth flow
- ✅ Strava OAuth flow
- ✅ Navigation to main app after completion

### Option 3: Android Emulator

**Pros:**
- Full native functionality
- OAuth flows work

**Cons:**
- Requires Android Studio setup
- Slower than iOS simulator

**Steps:**
```bash
cd /Users/megangroothuis/Desktop/PULSE
npm run android
```

## Step-by-Step Testing Flow

### Test 1: First Launch (Unauthenticated User)

**Expected Behavior:**
1. App opens
2. **PhoneAuthScreen** appears immediately
3. User sees phone number input field

**Test:**
- Enter a phone number (e.g., `+15551234567`)
- Click "Continue"
- Should receive SMS code (in Clerk test mode, check Clerk dashboard for code)
- Enter verification code
- Should navigate to **AccountConnectionScreen**

### Test 2: Account Connection Screen

**Expected Behavior:**
1. Screen shows two sections: Music Accounts and Fitness Accounts
2. Spotify and Strava show "Connect" buttons (active)
3. Other providers show "Coming Soon" (disabled)
4. Progress bar shows 0/2 connected

**Test:**
- Verify UI layout
- Click "Connect" on Spotify
- Should open OAuth flow (native only)
- After connecting, should see checkmark
- Progress updates to 1/2
- Repeat for Strava
- Progress updates to 2/2
- "Continue" button becomes enabled

### Test 3: Skip Option

**Expected Behavior:**
- User can click "Skip for now"
- Should navigate to main app
- Onboarding marked as incomplete

**Test:**
- Click "Skip for now" without connecting accounts
- Should navigate to Mixdown screen
- Close and reopen app
- Should show AccountConnectionScreen again (onboarding incomplete)

### Test 4: Completed Onboarding

**Expected Behavior:**
- After connecting both accounts and clicking "Continue"
- Should navigate to main app (Mixdown screen)
- Onboarding marked as complete

**Test:**
- Connect both Spotify and Strava
- Click "Continue"
- Should see Mixdown screen
- Close and reopen app
- Should go directly to Mixdown (no onboarding screens)

### Test 5: Returning User (Already Authenticated)

**Expected Behavior:**
- If user is already authenticated and onboarding complete
- Should skip all onboarding screens
- Go directly to main app

**Test:**
- Complete full onboarding once
- Close app completely
- Reopen app
- Should go directly to Mixdown screen

## Database Verification

After testing, verify data in Supabase:

1. **Check users table:**
   ```sql
   SELECT * FROM users;
   ```
   - Should see your user with `clerk_user_id`, `phone_number`, `onboarding_completed`

2. **Check connected_accounts table:**
   ```sql
   SELECT * FROM connected_accounts;
   ```
   - Should see entries for Spotify and Strava (if connected)
   - Linked to your user via `user_id`

## Common Issues & Solutions

### Issue: Phone auth not working
- **Check:** Clerk dashboard → Phone settings enabled
- **Check:** Phone number format (E.164: +1234567890)
- **Test mode:** Use Clerk test phone numbers or check dashboard for verification codes

### Issue: OAuth not working
- **Check:** OAuth providers configured in Clerk dashboard
- **Check:** Redirect URIs match (`pulse://oauth-callback`)
- **Check:** Running on native (iOS/Android), not web
- **Check:** App scheme configured in `app.json`

### Issue: Navigation stuck on auth screen
- **Check:** `.env` file has `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **Check:** Clerk publishable key is correct
- **Check:** Console for errors

### Issue: Database errors
- **Check:** Supabase schema was run successfully
- **Check:** Supabase credentials in `.env`
- **Check:** Tables exist in Supabase dashboard

## Quick Test Checklist

- [ ] Clerk account created and publishable key added to `.env`
- [ ] Supabase schema run successfully
- [ ] App starts without errors
- [ ] Phone auth screen appears on first launch
- [ ] Phone number input accepts input
- [ ] SMS verification works (or test mode)
- [ ] Account connection screen appears after auth
- [ ] Spotify connection works (native only)
- [ ] Strava connection works (native only)
- [ ] Progress updates correctly
- [ ] "Continue" button enables after both connected
- [ ] Navigation to main app works
- [ ] Returning user skips onboarding
- [ ] Data appears in Supabase tables

## Recommended Testing Order

1. **Start with web** - Quick UI/UX check
2. **Move to iOS Simulator** - Full functionality test
3. **Test phone auth** - Verify SMS flow
4. **Test account connections** - Verify OAuth flows
5. **Test navigation** - Verify routing logic
6. **Test persistence** - Close/reopen app
7. **Verify database** - Check Supabase data

## Debug Tips

- Check browser console (web) or Metro bundler logs (native)
- Use React Native Debugger for native apps
- Check Clerk dashboard → Users to see created users
- Check Supabase logs for database errors
- Use `console.log` in components to track flow
