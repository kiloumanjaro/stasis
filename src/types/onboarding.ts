export interface UserPreferences {
  privacy_comfort: 'visible' | 'hidden' | 'off';
  expression_tolerance: 'neutral' | 'intense' | 'variable';
  study_block_length: number; // minutes, 15–90
  mini_breaks_per_session: number; // 1–3
  recovery_duration: number; // minutes, 3–30
  break_mechanic: 'relaxed' | 'accountable';
  show_timer: boolean;
}

/** @deprecated — kept for backwards compatibility with old onboarding data */
export interface StudyPreferences {
  focusGoalMinutes: number;
  breakDurationMinutes: number;
  dailyGoalCards: number;
}
