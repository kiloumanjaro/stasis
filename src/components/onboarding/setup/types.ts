import type { UserPreferences } from '@/types/onboarding';
import type { OnboardingState } from '@/lib/frontend-store';

export const TOTAL_STEPS = 6;

export type PrivacyComfort = UserPreferences['privacy_comfort'];
export type ExpressionTolerance = UserPreferences['expression_tolerance'];
export type BreakMechanic = UserPreferences['break_mechanic'];

export type StepMeta = Record<number, { title: string; subtitle: string }>;

export type SummaryPreferences = Partial<OnboardingState>;
