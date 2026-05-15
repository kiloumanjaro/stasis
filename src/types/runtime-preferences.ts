export type PrivacyComfort = 'visible' | 'hidden' | 'off';
export type ExpressionTolerance = 'neutral' | 'intense' | 'variable';
export type BreakMechanic = 'relaxed' | 'accountable';

export interface UserPreferences {
  privacy_comfort: PrivacyComfort;
  emotion_detection: boolean;
  expression_tolerance: ExpressionTolerance;
  study_block_length: number;
  mini_breaks_per_session: number;
  break_mechanic: BreakMechanic;
  recovery_duration: number;
  show_timer: boolean;
}

export type OnboardingSnapshot = UserPreferences;

export interface RuntimePreferencesResponse {
  preferences: UserPreferences;
  onboarding_snapshot: OnboardingSnapshot | null;
  updated_at: string | null;
  storage_available: boolean;
}

export const DEFAULT_RUNTIME_PREFERENCES: UserPreferences = {
  privacy_comfort: 'off',
  emotion_detection: false,
  expression_tolerance: 'neutral',
  study_block_length: 25,
  mini_breaks_per_session: 2,
  break_mechanic: 'relaxed',
  recovery_duration: 10,
  show_timer: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPrivacyComfort(value: unknown): value is PrivacyComfort {
  return value === 'visible' || value === 'hidden' || value === 'off';
}

function isExpressionTolerance(value: unknown): value is ExpressionTolerance {
  return value === 'neutral' || value === 'intense' || value === 'variable';
}

function isBreakMechanic(value: unknown): value is BreakMechanic {
  return value === 'relaxed' || value === 'accountable';
}

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function normalizeRuntimePreferences(value: unknown): UserPreferences {
  const record = isRecord(value) ? value : {};
  const privacyComfort = isPrivacyComfort(record.privacy_comfort)
    ? record.privacy_comfort
    : DEFAULT_RUNTIME_PREFERENCES.privacy_comfort;
  const expressionTolerance = isExpressionTolerance(record.expression_tolerance)
    ? record.expression_tolerance
    : DEFAULT_RUNTIME_PREFERENCES.expression_tolerance;
  const breakMechanic = isBreakMechanic(record.break_mechanic)
    ? record.break_mechanic
    : DEFAULT_RUNTIME_PREFERENCES.break_mechanic;

  const preferences: UserPreferences = {
    privacy_comfort: privacyComfort,
    emotion_detection:
      typeof record.emotion_detection === 'boolean'
        ? record.emotion_detection
        : DEFAULT_RUNTIME_PREFERENCES.emotion_detection,
    expression_tolerance: expressionTolerance,
    study_block_length: clampNumber(
      record.study_block_length,
      DEFAULT_RUNTIME_PREFERENCES.study_block_length,
      15,
      90
    ),
    mini_breaks_per_session: clampNumber(
      record.mini_breaks_per_session,
      DEFAULT_RUNTIME_PREFERENCES.mini_breaks_per_session,
      1,
      3
    ),
    break_mechanic: breakMechanic,
    recovery_duration: clampNumber(
      record.recovery_duration,
      DEFAULT_RUNTIME_PREFERENCES.recovery_duration,
      3,
      30
    ),
    show_timer:
      typeof record.show_timer === 'boolean'
        ? record.show_timer
        : DEFAULT_RUNTIME_PREFERENCES.show_timer,
  };

  if (preferences.privacy_comfort === 'off') {
    preferences.emotion_detection = false;
    preferences.break_mechanic = 'relaxed';
  }

  return preferences;
}

export function runtimePreferencesEqual(
  left: UserPreferences,
  right: UserPreferences
) {
  return (
    JSON.stringify(normalizeRuntimePreferences(left)) ===
    JSON.stringify(normalizeRuntimePreferences(right))
  );
}
