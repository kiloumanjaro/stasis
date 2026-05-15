'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy onboarding permissions page — redirects to the new setup wizard.
 * Camera privacy is now handled as step 1 of the unified wizard.
 */
export default function PermissionsPage() {
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
