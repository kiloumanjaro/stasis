const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ?? `HTTP ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

export interface InterventionSettings {
  sensitivity: 'low' | 'medium' | 'high';
  breakLength: number;
  memeEnabled: boolean;
  cooldownMins: number;
}

export const interventionClient = {
  getSettings: () => request<InterventionSettings>('/intervention/settings'),

  updateSettings: (patch: Partial<InterventionSettings>) =>
    request<InterventionSettings>('/intervention/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
};
