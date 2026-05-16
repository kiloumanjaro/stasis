import { getBackendBaseUrl } from '@/lib/backend-auth';
import type { OnboardingState } from '@/lib/frontend-store';

export interface OnboardingStatusResponse {
  onboarding_completed: boolean;
}

export interface CompleteOnboardingRequest {
  privacy_comfort: OnboardingState['privacy_comfort'];
  expression_tolerance: OnboardingState['expression_tolerance'];
  study_block_length: number;
  mini_breaks_per_session: number;
  recovery_duration: number;
  break_mechanic: OnboardingState['break_mechanic'];
  show_timer: boolean;
}

export interface CompleteOnboardingResponse {
  success: boolean;
  message?: string;
}

export async function getOnboardingStatus(): Promise<OnboardingStatusResponse | null> {
  try {
    const response = await fetch(`${getBackendBaseUrl()}/onboarding/status`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(
        `Failed to fetch onboarding status: ${response.statusText}`
      );
    }

    return (await response.json()) as OnboardingStatusResponse;
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return null;
  }
}

export async function completeOnboarding(
  data: CompleteOnboardingRequest
): Promise<CompleteOnboardingResponse> {
  const response = await fetch(`${getBackendBaseUrl()}/onboarding/complete`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to complete onboarding: ${response.statusText}`);
  }

  return (await response.json()) as CompleteOnboardingResponse;
}
