import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getBackendUser } from '@/lib/backend-auth';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');

  console.log('[CALLBACK] Processing callback with params:', { next, error });

  if (error) {
    console.log('[CALLBACK] Error parameter found:', error);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error)}`, origin)
    );
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  console.log(
    '[CALLBACK] Cookie header received:',
    cookieHeader ? '✓ present' : '✗ missing'
  );

  const user = await getBackendUser(cookieHeader);

  if (!user) {
    console.log('[CALLBACK] User verification failed - redirecting to sign-up');
    return NextResponse.redirect(new URL('/auth/sign-up', origin));
  }

  console.log('[CALLBACK] User verified successfully:', user.email);
  console.log('[CALLBACK] Redirecting to:', next);
  return NextResponse.redirect(new URL(next, origin));
}
