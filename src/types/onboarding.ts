import type { ExpressionTolerance } from './runtime-preferences';

export interface StudyPreferences {
  focusGoalMinutes: number;
  breakDurationMinutes: number;
  dailyGoalCards: number;
  expressionTolerance: ExpressionTolerance;
  studyBlockLength: number;
  miniBreaksPerSession: number;
  recoveryDuration: number;
  showTimer: boolean;
}
