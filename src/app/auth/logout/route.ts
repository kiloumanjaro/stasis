import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getBackendBaseUrl, getBackendLogoutContext } from '@/lib/backend-auth';

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const cookieHeader = request.headers.get('cookie') ?? '';

  try {
    const { csrfToken, cookieHeader: backendCookieHeader } =
      await getBackendLogoutContext(cookieHeader);
    const headers = new Headers({
      'x-csrf-token': csrfToken,
    });

    if (backendCookieHeader) {
      headers.set('Cookie', backendCookieHeader);
    }

    const logoutResponse = await fetch(
      `${getBackendBaseUrl()}/auth/google/logout`,
      {
        method: 'POST',
        headers,
      }
    );

    if (!logoutResponse.ok) {
      return NextResponse.redirect(
        new URL('/auth/error?error=logout_failed', origin)
      );
    }
  } catch {
    return NextResponse.redirect(
      new URL('/auth/error?error=logout_failed', origin)
    );
  }

  return NextResponse.redirect(new URL('/auth/sign-up', origin));
}
