import { NextResponse, type NextRequest } from 'next/server';

import { getBackendBaseUrl, getBackendUser } from '@/lib/backend-auth';

function serializeCookieHeader(
  entries: Array<{ name: string; value: string }>
): string {
  return entries.map(({ name, value }) => `${name}=${value}`).join('; ');
}

function replaceCookieValue(
  cookieHeader: string,
  name: string,
  value: string
): string {
  const parts = cookieHeader
    .split('; ')
    .filter((c) => !c.startsWith(`${name}=`));
  parts.push(`${name}=${value}`);
  return parts.join('; ');
}

function extractSetCookieHeaders(headers: Headers): string[] {
  const h = headers as Headers & { getSetCookie?: () => string[] };
  return typeof h.getSetCookie === 'function'
    ? h.getSetCookie()
    : headers.get('set-cookie')
      ? [headers.get('set-cookie')!]
      : [];
}

async function refreshAccessToken(
  cookieHeader: string
): Promise<Response | null> {
  try {
    const response = await fetch(`${getBackendBaseUrl()}/auth/google/refresh`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    return response.ok ? response : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return response;
  }

  if (request.nextUrl.pathname === '/') {
    return response;
  }

  const protectedPaths = [
    '/dashboard',
    '/upload',
    '/flashcards',
    '/roadmap',
    '/pomodoro',
    '/profile',
    '/debug-auth',
    '/preferences',
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    return response;
  }

  const cookieHeader = serializeCookieHeader(request.cookies.getAll());
  let user = await getBackendUser(cookieHeader);

  if (!user && request.cookies.get('refresh_token')) {
    const refreshResponse = await refreshAccessToken(cookieHeader);

    if (refreshResponse) {
      const setCookieHeaders = extractSetCookieHeaders(refreshResponse.headers);

      // Load Set-Cookie headers into a temp response so we can read by cookie name
      const tempResponse = new NextResponse();
      setCookieHeaders.forEach((h) =>
        tempResponse.headers.append('Set-Cookie', h)
      );
      const newAccessToken = tempResponse.cookies.get('access_token')?.value;

      if (newAccessToken) {
        const updatedCookieHeader = replaceCookieValue(
          cookieHeader,
          'access_token',
          newAccessToken
        );
        user = await getBackendUser(updatedCookieHeader);

        if (user) {
          const nextResponse = NextResponse.next({ request });
          // Forward raw Set-Cookie headers to the browser as-is (no re-parsing needed)
          setCookieHeaders.forEach((h) =>
            nextResponse.headers.append('Set-Cookie', h)
          );
          return nextResponse;
        }
      }
    }
  }

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/sign-up';
    redirectUrl.search = '';
    redirectUrl.searchParams.set(
      'next',
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
