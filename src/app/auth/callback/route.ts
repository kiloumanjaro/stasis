import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    // Mutable response - will be assigned before cookies are applied
    let response: NextResponse;

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
              if (response) {
                response.cookies.set({ name, value, ...options });
              }
            });
          },
        },
      }
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${origin}/auth/error`);
    }

    const userId = data?.user?.id;
    if (userId) {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

        if (apiBaseUrl) {
          const backendResponse = await fetch(
            new URL('/auth/preferences-status', apiBaseUrl),
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId }),
              cache: 'no-store',
            }
          );

          // TODO: wire to backend API
          if (backendResponse.ok) {
            const payload = (await backendResponse.json()) as {
              redirectPath?: string;
            };

            response = NextResponse.redirect(
              `${origin}${payload.redirectPath ?? next}`
            );
            return response;
          }

          console.error(
            'Backend API error checking preferences:',
            backendResponse.status,
            await backendResponse.text()
          );
        }
      } catch (apiError) {
        console.error('Backend API error checking preferences:', apiError);
        response = NextResponse.redirect(`${origin}${next}`);
        return response;
      }
    }

    // User authenticated but no userId - redirect with cookies
    response = NextResponse.redirect(`${origin}${next}`);
    return response;
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
