'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readOnboardingState } from '@/lib/frontend-store';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const onboarding = readOnboardingState();
    if (onboarding.completed) {
      router.replace('/dashboard');
    }
  }, [router]);

  return <div className="min-h-screen bg-[#0f0f0f]">{children}</div>;
}
