'use server';

/**
 * Authentication Actions
 *
 * This application uses the backend auth service for Google OAuth.
 */

import { redirect } from 'next/navigation';

import { getBackendAuthUrl } from '@/lib/backend-auth';

export async function signout() {
  redirect('/auth/logout');
}

export async function signInWithGoogle() {
  const url = await getBackendAuthUrl();
  redirect(url);
}
