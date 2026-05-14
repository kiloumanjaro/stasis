import { NextResponse, type NextRequest } from 'next/server';

import { getBackendUser } from '@/lib/backend-auth';

function serializeCookieHeader(
  entries: Array<{ name: string; value: string }>
): string {
  return entries.map(({ name, value }) => `${name}=${value}`).join('; ');
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  // Skip auth check for callback and auth pages
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return response;
  }

  // Handle root path redirect
  if (request.nextUrl.pathname === '/') {
    return response; // Let client-side handle it
  }

  // Protected routes (require authentication)
  const protectedPaths = [
    '/dashboard',
    '/upload',
    '/flashcards',
    '/pomodoro',
    '/profile',
    '/debug-auth',
    '/preferences',
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    const cookieHeader = serializeCookieHeader(request.cookies.getAll());
    const user = await getBackendUser(cookieHeader);

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
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
