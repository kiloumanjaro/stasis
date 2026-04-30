import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getBackendUser } from '@/lib/backend-auth';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');
  const cookieHeader = request.headers.get('cookie') ?? '';

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error)}`, origin)
    );
  }

  const user = await getBackendUser(cookieHeader);

  if (!user) {
    return NextResponse.redirect(new URL('/auth/sign-up', origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
