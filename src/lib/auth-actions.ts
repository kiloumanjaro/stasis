'use server';

/**
 * Authentication Actions
 *
 * This application uses Google OAuth exclusively for authentication.
 * Password-based authentication is not supported.
 */

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export async function signout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    redirect('/error');
  }

  redirect('/logout');
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    redirect('/error');
  }

  redirect(data.url);
}
