import { getBackendBaseUrl } from '@/lib/backend-auth';

interface OnboardingStatusResponse {
  completed?: boolean;
}

export async function getBackendOnboardingStatus() {
  try {
    const response = await fetch(
      `${getBackendBaseUrl()}/api/onboarding/status`,
      {
        cache: 'no-store',
        credentials: 'include',
      }
    );

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to load onboarding status');
    }

    const data = (await response.json()) as OnboardingStatusResponse;
    return { completed: data.completed === true };
  } catch (error) {
    console.error('Error loading onboarding status:', error);
    return null;
  }
}

export async function completeBackendOnboarding() {
  const response = await fetch('/api/onboarding/complete', {
    method: 'POST',
    cache: 'no-store',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to complete onboarding');
  }

  const data = (await response.json()) as OnboardingStatusResponse;
  return { completed: data.completed === true };
}
