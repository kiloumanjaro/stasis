'use client';

import { useEffect, useState } from 'react';

import { PomodoroContent } from '@/components/pomodoro/PomodoroContent';
import { CameraProvider, CVProvider } from '@/features/camera';
import { readSettingsProfile } from '@/lib/frontend-store';

export default function PomodoroPage() {
  const [settings, setSettings] = useState(() => readSettingsProfile());

  useEffect(() => {
    setSettings(readSettingsProfile());
  }, []);

  const initialTimerSettings = {
    focusDuration: settings.focus_goal_minutes ?? 25,
    shortBreakDuration: settings.break_duration_minutes ?? 5,
    longBreakDuration: settings.long_break_duration_minutes ?? 20,
  };

  return (
    <CameraProvider>
      <CVProvider>
        <PomodoroContent
          initialTimerSettings={initialTimerSettings}
          initialCvMonitoringEnabled={settings.cv_monitoring_enabled ?? false}
          cardAnimationEnabled={settings.card_animation_enabled ?? true}
          shortcutsEnabled={settings.shortcuts_enabled ?? true}
        />
      </CVProvider>
    </CameraProvider>
  );
}
