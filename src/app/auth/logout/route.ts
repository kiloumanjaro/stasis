import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getBackendBaseUrl } from '@/lib/backend-auth';

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const cookieHeader = request.headers.get('cookie') ?? '';
  const csrfToken = crypto.randomUUID();
  const response = NextResponse.redirect(new URL('/auth/sign-up', origin));

  const logoutResponse = await fetch(
    `${getBackendBaseUrl()}/auth/google/logout`,
    {
      method: 'POST',
      headers: {
        Cookie: `${cookieHeader}${cookieHeader ? '; ' : ''}csrf_token=${csrfToken}`,
        'x-csrf-token': csrfToken,
      },
    }
  );

  if (!logoutResponse.ok) {
    return NextResponse.redirect(
      new URL('/auth/error?error=logout_failed', origin)
    );
  }

  response.cookies.set('access_token', '', {
    path: '/',
    maxAge: 0,
  });
  response.cookies.set('refresh_token', '', {
    path: '/',
    maxAge: 0,
  });
  response.cookies.set('csrf_token', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
