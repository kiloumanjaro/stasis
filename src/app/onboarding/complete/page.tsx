'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy complete page — redirects to the new setup wizard.
 * Kept so old bookmarks / back-button history don't 404.
 */
export default function CompletePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding/setup');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-[#5A5A72]">Redirecting…</p>
    </div>
  );
}
