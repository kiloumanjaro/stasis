// MOBILE NAV REFACTOR — sidebar → top bar

'use client';

import { Sidebar } from '@/components/app/Sidebar';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// DEV: auth disabled — mock user injected client-side when NEXT_PUBLIC_SKIP_AUTH=true
// Remove this constant and the SKIP_AUTH guard below to restore real auth.
const DEV_MOCK_USER = {
  id: 'eb00d0b0-848e-4ffe-97b6-6903c829cf22',
  email: 'dev@localhost.dev',
  role: 'authenticated',
  aud: 'authenticated',
  app_metadata: { provider: 'dev' },
  user_metadata: { name: 'Dev User', avatar_url: null },
  created_at: '2025-01-01T00:00:00.000Z',
} as unknown as User;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkOnboarding = useCallback(async () => {
    // DEV: auth disabled — onboarding redirect suppressed; remove guard to restore
    if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/onboarding/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPath: pathname }),
      });

      if (!response.ok) {
        throw new Error('Failed to check onboarding status');
      }

      const { redirectPath } = await response.json();
      if (redirectPath) {
        router.push(redirectPath);
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    // DEV: auth disabled — real Supabase session check bypassed; mock user used instead
    if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
      setUser(DEV_MOCK_USER);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);

      if (user) {
        checkOnboarding();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOnboarding();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkOnboarding]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* DEV: auth disabled — DEV MODE banner; remove when re-enabling auth */}
      {process.env.NEXT_PUBLIC_SKIP_AUTH === 'true' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-yellow-400 px-4 py-1 text-center text-xs font-bold text-yellow-900">
          ⚠ DEV MODE — Auth disabled · Mock user: {DEV_MOCK_USER.email}
        </div>
      )}
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto bg-[#1f1e1d] pb-14 md:pb-0">
        <div className="container mx-auto px-6 pb-0 pt-6 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
