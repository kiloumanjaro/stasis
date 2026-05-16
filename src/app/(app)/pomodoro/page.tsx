'use client';

import { useEffect, useState } from 'react';

import { PomodoroContent } from '@/components/pomodoro/PomodoroContent';
import { CameraProvider, CVProvider } from '@/features/camera';
import {
  readRuntimePreferencesFromLocalState,
  readSettingsProfile,
  saveRuntimePreferencesToLocalProfile,
} from '@/lib/frontend-store';
import { getRuntimePreferences } from '@/lib/preferences-client';

export default function PomodoroPage() {
  const [settings, setSettings] = useState(() => readSettingsProfile());
  const [runtimePreferences, setRuntimePreferences] = useState(() =>
    readRuntimePreferencesFromLocalState()
  );

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        const response = await getRuntimePreferences();
        const hasRemotePreferences =
          response.storage_available && response.updated_at !== null;
        const preferences = hasRemotePreferences
          ? response.preferences
          : readRuntimePreferencesFromLocalState();

        if (hasRemotePreferences) {
          saveRuntimePreferencesToLocalProfile(preferences);
        }

        if (!isMounted) {
          return;
        }

        setRuntimePreferences(preferences);
        setSettings(readSettingsProfile());
      } catch {
        console.warn(
          'Using local runtime preferences until backend preferences are available.'
        );

        if (!isMounted) {
          return;
        }

        setRuntimePreferences(readRuntimePreferencesFromLocalState());
        setSettings(readSettingsProfile());
      }
    };

    void loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const initialTimerSettings = {
    focusDuration: runtimePreferences.study_block_length,
    shortBreakDuration: settings.break_duration_minutes ?? 5,
    longBreakDuration: settings.long_break_duration_minutes ?? 20,
  };
  const cameraEnabled = runtimePreferences.privacy_comfort !== 'off';
  const runtimePreferencesKey = [
    runtimePreferences.privacy_comfort,
    runtimePreferences.expression_tolerance,
    runtimePreferences.study_block_length,
    runtimePreferences.show_timer,
  ].join(':');

  return (
    <CameraProvider>
      <CVProvider
        enabled={cameraEnabled}
        expressionTolerance={runtimePreferences.expression_tolerance}
      >
        <PomodoroContent
          key={runtimePreferencesKey}
          initialTimerSettings={initialTimerSettings}
          initialCvMonitoringEnabled={cameraEnabled}
          initialCameraVisible={
            runtimePreferences.privacy_comfort === 'visible'
          }
          showTimer={runtimePreferences.show_timer}
          cardAnimationEnabled={settings.card_animation_enabled ?? true}
          shortcutsEnabled={settings.shortcuts_enabled ?? true}
        />
      </CVProvider>
    </CameraProvider>
  );
}
