import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  // DEV: auth disabled — Supabase session refresh skipped entirely in dev mode
  // Re-enable by removing the SKIP_AUTH guard and restoring the auth check below.
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // DEV: auth disabled — real getUser() call suppressed; mock user injected via server client
  let user = null;
  if (process.env.SKIP_AUTH !== 'true' && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    user = data?.user;
  }

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
    '/roadmap',
    '/pomodoro',
    '/profile',
    '/debug-auth',
    '/preferences',
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // DEV: auth disabled — redirect-to-login guard commented out
  // To re-enable auth enforcement, remove the SKIP_AUTH check and uncomment below:
  // if (isProtectedPath && !user) {
  //   const redirectUrl = request.nextUrl.clone();
  //   redirectUrl.pathname = '/auth/sign-up';
  //   return NextResponse.redirect(redirectUrl);
  // }
  void isProtectedPath; // suppress unused-var warning while auth is disabled

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
