import { createClient } from '@supabase/supabase-js';
import { env } from './env.ts';
import { HttpError } from './http.ts';

/** Resolve the signed-in user from the request's Supabase access token. */
export async function requireUserId(req: Request): Promise<string> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Not signed in');
  const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Invalid session');
  return data.user.id;
}
