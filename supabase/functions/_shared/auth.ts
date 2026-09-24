import { createClient } from '@supabase/supabase-js';
import { env, optionalEnv } from './env.ts';
import { HttpError } from './http.ts';

/** Resolve the signed-in user from the request's Supabase access token. */
export async function requireUserId(req: Request): Promise<string> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Not signed in');
  // Any project key can validate a user token; prefer the least privileged.
  const key = optionalEnv('SUPABASE_ANON_KEY') ?? env('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(env('SUPABASE_URL'), key, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Invalid session');
  return data.user.id;
}
