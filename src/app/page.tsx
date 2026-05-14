import { redirect } from 'next/navigation';

import { getAuthenticatedBackendUser } from '@/lib/backend-auth-server';

export default async function Home() {
  const user = await getAuthenticatedBackendUser();

  redirect(user ? '/dashboard' : '/auth/sign-up');
}
