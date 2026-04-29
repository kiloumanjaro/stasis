'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBackendUser } from '@/lib/backend-auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const user = await getBackendUser();

      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/auth/sign-up');
      }
    };

    void checkUser();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
