'use client';

import { Sidebar } from '@/components/app/Sidebar';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getBackendUser, type BackendAuthUser } from '@/lib/backend-auth';

const DEV_MOCK_USER = {
  id: 'eb00d0b0-848e-4ffe-97b6-6903c829cf22',
  userId: 'eb00d0b0-848e-4ffe-97b6-6903c829cf22',
  email: 'dev@localhost.dev',
  name: 'Dev User',
  pictureUrl: '',
} as BackendAuthUser;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkOnboarding = useCallback(async () => {
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
    if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
      setUser(DEV_MOCK_USER);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const syncAuthState = async () => {
      const currentUser = await getBackendUser();

      if (!isMounted) {
        return;
      }

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        router.replace('/auth/sign-up');
        return;
      }

      setUser(currentUser);
      await checkOnboarding();
    };

    void syncAuthState();

    return () => {
      isMounted = false;
    };
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
      {process.env.NEXT_PUBLIC_SKIP_AUTH === 'true' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-yellow-400 px-4 py-1 text-center text-xs font-bold text-yellow-900">
          ⚠ DEV MODE — Auth disabled · Mock user: {DEV_MOCK_USER.email}
        </div>
      )}
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto bg-[#1f1e1d]">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
