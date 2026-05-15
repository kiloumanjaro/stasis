import { NextResponse } from 'next/server';
import { getBackendLogoutToken } from '@/lib/backend-auth';
import { cookies } from 'next/headers';

function getBackendBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim().replace(/\/$/, '') ||
    'http://localhost:8000'
  );
}

export async function POST() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const headers = new Headers({ Cookie: cookieHeader });

  try {
    const csrfToken = await getBackendLogoutToken(cookieHeader);
    headers.set('x-csrf-token', csrfToken);
  } catch {
    // Some environments may not require CSRF for this endpoint.
  }

  try {
    const response = await fetch(
      `${getBackendBaseUrl()}/api/onboarding/complete`,
      {
        method: 'POST',
        cache: 'no-store',
        credentials: 'include',
        headers,
      }
    );

    if (response.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to complete onboarding' },
        { status: response.status }
      );
    }

    const data = (await response.json()) as { completed?: boolean };

    const result = NextResponse.json({ completed: data.completed === true });

    // Forward any Set-Cookie headers from the backend.
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        result.headers.append('set-cookie', value);
      }
    });

    return result;
  } catch {
    return NextResponse.json(
      { error: 'Failed to reach backend' },
      { status: 502 }
    );
  }
}
