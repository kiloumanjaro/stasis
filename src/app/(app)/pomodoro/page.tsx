import { PomodoroContent } from '@/components/pomodoro/PomodoroContent';
import { CameraProvider, CVProvider } from '@/features/camera';
import { getSettingsProfile } from '@/lib/settings-actions';

export default async function PomodoroPage() {
  const result = await getSettingsProfile();
  const profile = result.profile;

  const initialTimerSettings = profile
    ? {
        focusDuration: profile.focus_goal_minutes ?? 25,
        shortBreakDuration: profile.break_duration_minutes ?? 5,
        longBreakDuration: profile.long_break_duration_minutes ?? 20,
      }
    : undefined;

  const initialCvMonitoringEnabled = profile?.cv_monitoring_enabled ?? false;
  const cardAnimationEnabled = profile?.card_animation_enabled ?? true;
  const shortcutsEnabled = profile?.shortcuts_enabled ?? true;

  return (
    <CameraProvider>
      <CVProvider>
        <PomodoroContent
          initialTimerSettings={initialTimerSettings}
          initialCvMonitoringEnabled={initialCvMonitoringEnabled}
          cardAnimationEnabled={cardAnimationEnabled}
          shortcutsEnabled={shortcutsEnabled}
        />
      </CVProvider>
    </CameraProvider>
  );
}
