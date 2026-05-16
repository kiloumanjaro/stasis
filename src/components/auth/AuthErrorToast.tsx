'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AuthErrorToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const hasShown = useRef(false);

  useEffect(() => {
    if (error && !hasShown.current) {
      toast.error(error);
      hasShown.current = true;
      // Optional: clean up the URL to prevent showing the error on refresh
      router.replace('/auth/sign-up');
    }
  }, [error, router]);

  return null;
}
