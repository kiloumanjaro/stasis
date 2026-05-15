import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { getAuthenticatedBackendUser } from '@/lib/backend-auth-server';

async function HomeRedirect() {
  const user = await getAuthenticatedBackendUser();

  redirect(user ? '/dashboard' : '/auth/sign-up');

  return null;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeRedirect />
    </Suspense>
  );
}
