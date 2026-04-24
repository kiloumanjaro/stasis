import db from '@/database';
import { userPreferences } from '@/database/schema';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
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

    // Check if user has completed preferences
    const userId = data?.user?.id;
    if (userId) {
      try {
        const prefs = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, userId))
          .limit(1);

        // If user doesn't have preferences, redirect to preferences page
        const redirectPath = prefs.length === 0 ? '/onboarding/welcome' : next;

        response = NextResponse.redirect(`${origin}${redirectPath}`);
        return response;
      } catch (dbError) {
        console.error('Database error checking preferences:', dbError);
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
