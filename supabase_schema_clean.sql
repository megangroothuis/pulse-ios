-- Clean setup script - drops existing tables and recreates them
-- WARNING: This will delete all existing data in these tables!

-- Drop existing tables and related objects
DROP TABLE IF EXISTS connected_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table to store user information synced from Clerk
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Connected accounts table to store OAuth connections
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'spotify', 'strava', etc.
  provider_account_id TEXT,
  access_token TEXT, -- Should be encrypted in production
  refresh_token TEXT, -- Should be encrypted in production
  expires_at TIMESTAMP,
  connected_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Create indexes for better query performance
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX idx_connected_accounts_provider ON connected_accounts(provider);

-- Note: RLS is disabled because we're using Clerk for authentication, not Supabase Auth
-- Security is handled in application code by filtering queries by clerk_user_id
-- In production, consider:
-- 1. Using a backend service with service role key to validate Clerk tokens
-- 2. Implementing custom RLS policies with a function that validates Clerk user IDs
-- 3. Using Supabase Edge Functions to handle authenticated requests

-- For now, RLS is disabled - the app code ensures users can only access their own data
-- by filtering all queries with clerk_user_id or user_id
