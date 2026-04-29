import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getBackendBaseUrl, getBackendUser } from '@/lib/backend-auth';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');

  console.log('[CALLBACK] Processing callback with params:', {
    hasCode: Boolean(code),
    next,
    error,
  });

  if (error) {
    console.log('[CALLBACK] Error parameter found:', error);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error)}`, origin)
    );
  }

  if (code) {
    const response = NextResponse.redirect(new URL(next, origin));
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options });
              response.cookies.set({ name, value, ...options });
            });
          },
        },
      }
    );

    const { error: exchangeError, data } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Auth callback error:', exchangeError);
      return NextResponse.redirect(new URL('/auth/error', origin));
    }

    const userId = data?.user?.id;

    if (userId) {
      try {
        const backendResponse = await fetch(
          new URL('/auth/preferences-status', getBackendBaseUrl()),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
            cache: 'no-store',
          }
        );

        if (backendResponse.ok) {
          const payload = (await backendResponse.json()) as {
            redirectPath?: string;
          };

          response.headers.set(
            'Location',
            new URL(payload.redirectPath ?? next, origin).toString()
          );
          return response;
        }

        console.error(
          'Backend API error checking auth redirect:',
          backendResponse.status,
          await backendResponse.text()
        );
      } catch (apiError) {
        console.error('Backend API error checking auth redirect:', apiError);
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error(
          'Supabase error checking onboarding status:',
          profileError
        );
        return response;
      }

      if (!profile?.onboarding_completed) {
        response.headers.set(
          'Location',
          new URL('/onboarding/welcome', origin).toString()
        );
      }
    }

    return response;
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
