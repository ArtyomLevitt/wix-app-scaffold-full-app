import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

export function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
      'Supabase env vars not set. Add SUPABASE_URL and SUPABASE_SERVICE_KEY ' +
        'to your .env.local (or your hosting provider env config).',
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}
