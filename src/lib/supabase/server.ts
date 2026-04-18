import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// DEV: auth disabled — mock user returned by all auth.getUser() calls when SKIP_AUTH=true
// ID matches seed.ts so seeded data is visible without a real account.
// To re-enable real auth: remove the SKIP_AUTH block and restore original createClient().
const DEV_MOCK_USER = {
  id: 'eb00d0b0-848e-4ffe-97b6-6903c829cf22',
  email: 'dev@localhost.dev',
  role: 'authenticated',
  aud: 'authenticated',
  app_metadata: { provider: 'dev' },
  user_metadata: { name: 'Dev User', avatar_url: null },
  created_at: '2025-01-01T00:00:00.000Z',
};

export async function createClient() {
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — safe to ignore
          }
        },
      },
    }
  );

  // DEV: auth disabled — shadow auth methods with mock implementations
  if (process.env.SKIP_AUTH === 'true') {
    const auth = client.auth as Record<string, unknown>;
    auth.getUser = async () => ({ data: { user: DEV_MOCK_USER }, error: null });
    auth.getClaims = async () => ({
      data: {
        claims: {
          sub: DEV_MOCK_USER.id,
          email: DEV_MOCK_USER.email,
          role: 'authenticated',
          aud: 'authenticated',
        },
      },
      error: null,
    });
  }

  return client;
}
