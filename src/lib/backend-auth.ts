const DEFAULT_BACKEND_URL = 'http://localhost:8000';

export interface BackendAuthUser {
  id: string;
  userId: string;
  email: string;
  name: string;
  pictureUrl: string;
}

interface BackendAuthResponse {
  user?: {
    id?: string;
    userId?: string;
    email?: string;
    name?: string;
    pictureUrl?: string;
  };
  url?: string;
  csrfToken?: string;
}

export function getBackendBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim().replace(/\/$/, '') ||
    DEFAULT_BACKEND_URL
  );
}

export function normalizeBackendUser(
  user: BackendAuthResponse['user']
): BackendAuthUser | null {
  if (!user) {
    return null;
  }

  const id = user.id ?? user.userId;

  if (!id || !user.email || !user.name) {
    return null;
  }

  return {
    id,
    userId: user.userId ?? id,
    email: user.email,
    name: user.name,
    pictureUrl: user.pictureUrl ?? '',
  };
}

export async function getBackendAuthUrl() {
  const response = await fetch(`${getBackendBaseUrl()}/auth/google/url`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to start backend auth flow');
  }

  const data = (await response.json()) as BackendAuthResponse;

  if (!data.url) {
    throw new Error('Backend auth flow did not return a redirect URL');
  }

  return data.url;
}

export async function getBackendUser(cookieHeader?: string) {
  const headers = new Headers();

  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }

  const response = await fetch(`${getBackendBaseUrl()}/auth/google/verify`, {
    cache: 'no-store',
    credentials: cookieHeader ? 'same-origin' : 'include',
    headers,
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as BackendAuthResponse;
  return normalizeBackendUser(data.user);
}

export async function getBackendLogoutToken() {
  const response = await fetch(`${getBackendBaseUrl()}/auth/csrf`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to create CSRF token for backend logout');
  }

  const data = (await response.json()) as BackendAuthResponse;

  if (!data.csrfToken) {
    throw new Error('Backend did not return a CSRF token');
  }

  return data.csrfToken;
}
