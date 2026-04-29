import 'server-only';

import { cookies } from 'next/headers';

import { getBackendUser } from '@/lib/backend-auth';

function serializeCookieHeader(
  entries: Array<{ name: string; value: string }>
): string {
  return entries.map(({ name, value }) => `${name}=${value}`).join('; ');
}

export async function getAuthenticatedBackendUser() {
  const cookieStore = await cookies();
  const cookieHeader = serializeCookieHeader(cookieStore.getAll());

  return getBackendUser(cookieHeader);
}
