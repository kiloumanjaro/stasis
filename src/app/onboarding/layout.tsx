'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Aurora from '@/components/signup/Aurora';
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f0f]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] min-h-[260px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_0%,black_68%,transparent_100%)]">
        <Aurora
          colorStops={['#7cff67', '#B19EEF', '#5227FF']}
          blend={0.81}
          amplitude={10.0}
          speed={1}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
