import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;

  const response = NextResponse.redirect(`${origin}/auth/sign-up`);

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

  await supabase.auth.signOut();

  return response;
}
