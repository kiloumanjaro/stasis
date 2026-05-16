'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  readOnboardingState,
  checkOnboardingStatusWithBackend,
} from '@/lib/frontend-store';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkOnboardingStatus = async () => {
      const localOnboarding = readOnboardingState();
      if (localOnboarding.completed) {
        if (isMounted) {
          router.replace('/dashboard');
        }
        return;
      }

      // Also verify with backend to catch cross-device completion
      const backendCompleted = await checkOnboardingStatusWithBackend();
      if (backendCompleted && isMounted) {
        router.replace('/dashboard');
      }
    };

    void checkOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return <div className="min-h-screen bg-[#0f0f0f]">{children}</div>;
}
