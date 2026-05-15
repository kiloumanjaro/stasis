// MOBILE NAV REFACTOR — sidebar → top bar

'use client';

import { Sidebar } from '@/components/app/Sidebar';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getBackendUser, type BackendAuthUser } from '@/lib/backend-auth';
import { getBackendOnboardingStatus } from '@/lib/backend-onboarding';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = async () => {
      try {
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

        const onboarding = await getBackendOnboardingStatus();

        if (!isMounted) {
          return;
        }

        if (!onboarding) {
          setUser(null);
          setLoading(false);
          router.replace('/auth/sign-up');
          return;
        }

        if (!onboarding.completed) {
          setUser(currentUser);
          setLoading(false);
          const query = searchParams.toString();
          const next = query ? `${pathname}?${query}` : pathname;
          router.replace(
            `/onboarding/welcome?next=${encodeURIComponent(next)}`
          );
          return;
        }

        setUser(currentUser);
        setLoading(false);
      } catch (error) {
        console.error('Error verifying authenticated user:', error);

        if (!isMounted) {
          return;
        }

        setUser(null);
        setLoading(false);
        router.replace('/auth/sign-up');
      }
    };
    void syncAuthState();

    return () => {
      isMounted = false;
    };
  }, [pathname, router, searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="app-shell flex min-h-screen bg-[#1f1e1d]">
      <Sidebar user={user} />
      <main className="app-shell-main flex-1 overflow-auto bg-[#1f1e1d]">
        <div className="app-shell-page container mx-auto px-6 pb-0 pt-6 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
