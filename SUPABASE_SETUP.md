# Supabase Setup Guide

## 1. Install Dependencies

Run this command to install all required packages:

```bash
npm install
```

## 2. Create `.env` File

Create a `.env` file in the root of your project with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your-project-url-here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 4. Restart Your Dev Server

After creating the `.env` file, restart your Expo dev server:

```bash
npm start
```

## 5. Usage

Import and use the Supabase client in your components:

```typescript
import { supabase } from './src/lib/supabase';
import { getFeedItems, createSession } from './src/lib/db';

// Example: Get feed items
const feedItems = await getFeedItems(20);

// Example: Create a session
const session = await createSession({
  user_id: userId,
  workout_type: 'Running',
  // ... other fields
});
```

## Available Database Functions

- `getUserSessions(userId)` - Get all sessions for a user
- `createSession(sessionData)` - Create a new session
- `getUserSetlists(userId)` - Get all setlists for a user
- `createSetlist(setlistData)` - Create a new setlist
- `getUserSyncs(userId)` - Get all syncs for a user
- `createSync(syncData)` - Create a new sync
- `getFeedItems(limit)` - Get public feed items
- `getSessionById(sessionId)` - Get a session with all related data
- `toggleLike(userId, type, id)` - Like/unlike an item
- `toggleSave(userId, type, id)` - Save/unsave an item
- `bumpItem(userId, type, id)` - Bump an item
