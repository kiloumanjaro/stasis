import { getBackendBaseUrl } from '@/lib/backend-auth';
import {
  normalizeRuntimePreferences,
  type RuntimePreferencesResponse,
  type UserPreferences,
} from '@/types/runtime-preferences';

interface CsrfResponse {
  csrfToken?: string;
}

function normalizeRuntimePreferencesResponse(
  value: unknown
): RuntimePreferencesResponse {
  const record =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    preferences: normalizeRuntimePreferences(record.preferences),
    onboarding_snapshot: record.onboarding_snapshot
      ? normalizeRuntimePreferences(record.onboarding_snapshot)
      : null,
    updated_at:
      typeof record.updated_at === 'string' ? record.updated_at : null,
    storage_available:
      typeof record.storage_available === 'boolean'
        ? record.storage_available
        : true,
  };
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Record<
      string,
      string
    >;
    throw new Error(body.error ?? body.message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function getCsrfToken() {
  const response = await requestJson<CsrfResponse>('/auth/csrf');

  if (!response.csrfToken) {
    throw new Error('Backend did not return a CSRF token');
  }

  return response.csrfToken;
}

async function saveRuntimePreferenceRequest(
  path: '/preferences/runtime' | '/preferences/onboarding',
  method: 'PUT' | 'POST',
  preferences: UserPreferences
) {
  const csrfToken = await getCsrfToken();
  const response = await requestJson<unknown>(path, {
    method,
    headers: {
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify(normalizeRuntimePreferences(preferences)),
  });

  return normalizeRuntimePreferencesResponse(response);
}

export async function getRuntimePreferences() {
  const response = await requestJson<unknown>('/preferences/runtime', {
    cache: 'no-store',
  });

  return normalizeRuntimePreferencesResponse(response);
}

export async function saveRuntimePreferences(preferences: UserPreferences) {
  return saveRuntimePreferenceRequest(
    '/preferences/runtime',
    'PUT',
    preferences
  );
}

export async function completeRuntimeOnboarding(preferences: UserPreferences) {
  return saveRuntimePreferenceRequest(
    '/preferences/onboarding',
    'POST',
    preferences
  );
}
