'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBackendOnboardingStatus } from '@/lib/backend-onboarding';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const syncOnboardingState = async () => {
      const onboarding = await getBackendOnboardingStatus();

      if (!isMounted) {
        return;
      }

      if (!onboarding) {
        router.replace('/auth/sign-up');
        return;
      }

      if (onboarding.completed) {
        router.replace('/dashboard');
      }
    };

    void syncOnboardingState();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return <div className="min-h-screen bg-[#0f0f0f]">{children}</div>;
}
