import { createBrowserClient } from '@supabase/ssr';

// DEV: auth disabled — falls back to localhost Supabase when URL/key are unset
export function createClient() {
  const SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const SUPABASE_ANON_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
