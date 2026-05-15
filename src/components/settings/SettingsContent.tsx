'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  getRuntimePreferences,
  saveRuntimePreferences,
} from '@/lib/preferences-client';
import {
  readRuntimePreferencesFromLocalState,
  runtimePreferencesFromOnboardingState,
  saveRuntimePreferencesToLocalProfile,
} from '@/lib/frontend-store';
import { cn } from '@/lib/utils';
import {
  DEFAULT_RUNTIME_PREFERENCES,
  normalizeRuntimePreferences,
  runtimePreferencesEqual,
  type BreakMechanic,
  type ExpressionTolerance,
  type OnboardingSnapshot,
  type PrivacyComfort,
  type UserPreferences,
} from '@/types/runtime-preferences';

type StatusType = 'idle' | 'success' | 'error';

type SegmentOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
  title?: string;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#aaa7a0]">
        {title}
      </h2>
      <Card className="overflow-hidden rounded-lg border-[#55534e] bg-[#2f302e] text-[#f3f1eb] shadow-none">
        {children}
      </Card>
    </section>
  );
}

function SettingRow({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-t border-[#4d4c48] px-4 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-[#f5f3ed]">
          {title}
        </p>
        <p className="mt-1 max-w-[360px] text-xs font-medium leading-snug text-[#c6c3bb]">
          {description}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Array<SegmentOption<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex overflow-hidden rounded-md border border-[#6a6964] bg-[#383936]"
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            disabled={option.disabled}
            title={option.title}
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-9 min-w-24 rounded-none border-0 border-l border-[#6a6964] bg-transparent px-4 text-sm font-semibold text-[#f5f3ed] shadow-none first:border-l-0 hover:bg-[#464743]',
              isActive &&
                'bg-[#434440] text-white shadow-[inset_0_0_0_1px_#7b7973]',
              option.disabled &&
                'cursor-not-allowed opacity-40 hover:bg-transparent'
            )}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

function ToggleControl({
  id,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Checkbox
      id={id}
      role="switch"
      checked={checked}
      disabled={disabled}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      className={cn(
        'h-5 w-10 rounded-full border-0 bg-[#5b5c57] p-0 shadow-none transition-colors data-[state=checked]:bg-[#2dbd91] [&>span]:block [&>span]:h-4 [&>span]:w-4 [&>span]:translate-x-0.5 [&>span]:rounded-full [&>span]:bg-white [&>span]:text-transparent [&>span]:transition-transform data-[state=checked]:[&>span]:translate-x-[22px]',
        disabled && 'cursor-not-allowed opacity-45'
      )}
    />
  );
}

function SliderRow({
  title,
  description,
  value,
  min,
  max,
  step,
  label,
  onChange,
}: {
  title: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="border-t border-[#4d4c48] px-4 py-4 first:border-t-0">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold leading-tight text-[#f5f3ed]">
            {title}
          </p>
          <p className="mt-1 max-w-[420px] text-xs font-medium leading-snug text-[#c6c3bb]">
            {description}
          </p>
        </div>
        <span className="rounded-full bg-[#d8fff1] px-3 py-0.5 text-xs font-bold text-[#1b6653]">
          {label}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(nextValue) => onChange(nextValue[0] ?? value)}
        className="[&_[data-slot=slider-range]]:bg-[#7c7b75] [&_[data-slot=slider-thumb]]:border-[#74736d] [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-[#565550]"
      />
    </div>
  );
}

export function SettingsContent() {
  const [savedPreferences, setSavedPreferences] = useState<UserPreferences>(
    DEFAULT_RUNTIME_PREFERENCES
  );
  const [draftPreferences, setDraftPreferences] = useState<UserPreferences>(
    DEFAULT_RUNTIME_PREFERENCES
  );
  const [onboardingSnapshot, setOnboardingSnapshot] =
    useState<OnboardingSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forceDirty, setForceDirty] = useState(false);
  const [status, setStatus] = useState<{ type: StatusType; message: string }>({
    type: 'idle',
    message: '',
  });
  const [isSaving, startSaving] = useTransition();
  const previousCameraChoicesRef = useRef({
    emotion_detection: true,
    break_mechanic: 'relaxed' as BreakMechanic,
  });

  const isDirty = useMemo(
    () =>
      forceDirty ||
      !runtimePreferencesEqual(savedPreferences, draftPreferences),
    [draftPreferences, forceDirty, savedPreferences]
  );

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      const localPreferences = readRuntimePreferencesFromLocalState();

      try {
        const response = await getRuntimePreferences();
        const hasRemotePreferences =
          response.storage_available && response.updated_at !== null;
        const loadedPreferences = normalizeRuntimePreferences(
          hasRemotePreferences ? response.preferences : localPreferences
        );
        const snapshot = hasRemotePreferences
          ? (response.onboarding_snapshot ??
            runtimePreferencesFromOnboardingState())
          : runtimePreferencesFromOnboardingState();

        if (!isMounted) {
          return;
        }

        setSavedPreferences(loadedPreferences);
        setDraftPreferences(loadedPreferences);
        setOnboardingSnapshot(snapshot);

        if (hasRemotePreferences) {
          saveRuntimePreferencesToLocalProfile(loadedPreferences);
        } else if (!response.storage_available) {
          setStatus({
            type: 'error',
            message: 'Using local settings until preferences reconnect.',
          });
        }

        if (loadedPreferences.privacy_comfort !== 'off') {
          previousCameraChoicesRef.current = {
            emotion_detection: loadedPreferences.emotion_detection,
            break_mechanic: loadedPreferences.break_mechanic,
          };
        }
      } catch {
        console.warn(
          'Using local runtime preferences until backend preferences are available.'
        );
        const fallbackPreferences =
          normalizeRuntimePreferences(localPreferences);

        if (!isMounted) {
          return;
        }

        setSavedPreferences(fallbackPreferences);
        setDraftPreferences(fallbackPreferences);
        setOnboardingSnapshot(runtimePreferencesFromOnboardingState());
        setStatus({
          type: 'error',
          message: 'Using local settings until preferences reconnect.',
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setForceDirty(false);
        }
      }
    };

    void loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (status.type !== 'success') {
      return;
    }

    const timeout = window.setTimeout(() => {
      setStatus({ type: 'idle', message: '' });
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [status.type]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a[href]');

      if (!link) {
        return;
      }

      const shouldLeave = window.confirm('Discard unsaved settings changes?');

      if (!shouldLeave) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [isDirty]);

  const updateDraft = (patch: Partial<UserPreferences>) => {
    setStatus({ type: 'idle', message: '' });
    setDraftPreferences((current) => {
      const next = { ...current, ...patch };

      if (
        patch.privacy_comfort === 'off' &&
        current.privacy_comfort !== 'off'
      ) {
        previousCameraChoicesRef.current = {
          emotion_detection: current.emotion_detection,
          break_mechanic: current.break_mechanic,
        };
      }

      if (
        patch.privacy_comfort &&
        patch.privacy_comfort !== 'off' &&
        current.privacy_comfort === 'off'
      ) {
        next.emotion_detection =
          previousCameraChoicesRef.current.emotion_detection;
        next.break_mechanic = previousCameraChoicesRef.current.break_mechanic;
      }

      const normalized = normalizeRuntimePreferences(next);

      if (normalized.privacy_comfort !== 'off') {
        previousCameraChoicesRef.current = {
          emotion_detection: normalized.emotion_detection,
          break_mechanic: normalized.break_mechanic,
        };
      }

      return normalized;
    });
  };

  const saveChanges = () => {
    if (!isDirty) {
      return;
    }

    const preferences = normalizeRuntimePreferences(draftPreferences);
    setStatus({ type: 'idle', message: '' });

    startSaving(async () => {
      try {
        const response = await saveRuntimePreferences(preferences);
        const saved = normalizeRuntimePreferences(response.preferences);
        setSavedPreferences(saved);
        setDraftPreferences(saved);
        setOnboardingSnapshot(
          response.onboarding_snapshot ??
            runtimePreferencesFromOnboardingState()
        );
        saveRuntimePreferencesToLocalProfile(saved);
        setForceDirty(false);
        setStatus({ type: 'success', message: 'Saved' });
      } catch {
        console.warn(
          'Saved runtime preferences locally until backend preferences are available.'
        );
        setSavedPreferences(preferences);
        setDraftPreferences(preferences);
        setOnboardingSnapshot(
          (current) => current ?? runtimePreferencesFromOnboardingState()
        );
        saveRuntimePreferencesToLocalProfile(preferences);
        setForceDirty(false);
        setStatus({ type: 'success', message: 'Saved locally' });
      }
    });
  };

  const resetToOnboardingDefaults = () => {
    if (!onboardingSnapshot) {
      return;
    }

    const snapshot = normalizeRuntimePreferences(onboardingSnapshot);
    setDraftPreferences(snapshot);
    setForceDirty(true);
    setStatus({ type: 'idle', message: '' });

    if (snapshot.privacy_comfort !== 'off') {
      previousCameraChoicesRef.current = {
        emotion_detection: snapshot.emotion_detection,
        break_mechanic: snapshot.break_mechanic,
      };
    }
  };

  const cameraOff = draftPreferences.privacy_comfort === 'off';

  return (
    <div className="mx-auto max-w-[642px] space-y-5 pb-10 text-[#f3f1eb]">
      <div className="sticky top-0 z-20 -mx-2 flex items-center justify-between gap-4 bg-[#1f1e1d]/95 px-2 py-3 backdrop-blur">
        <h1 className="text-xl font-bold tracking-tight text-[#f5f3ed]">
          Settings
        </h1>
        <div className="flex items-center gap-3">
          {status.type !== 'idle' && (
            <span
              className={cn(
                'text-xs font-semibold',
                status.type === 'success' ? 'text-[#baf6df]' : 'text-[#ffb4a8]'
              )}
            >
              {status.message}
            </span>
          )}
          <Button
            type="button"
            disabled={!isDirty || isSaving || isLoading}
            onClick={saveChanges}
            className="min-w-32 rounded-md border-[#45433f] bg-[#2d2d2b] text-[#f5f3ed] shadow-none hover:bg-[#3a3a36] disabled:bg-[#262624] disabled:text-[#8c8982]"
          >
            {status.type === 'success' ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : isSaving ? (
              'Saving...'
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="rounded-lg border-[#55534e] bg-[#2f302e] p-5 text-sm text-[#c6c3bb] shadow-none">
          Loading preferences...
        </Card>
      ) : (
        <>
          <Section title="Camera & Privacy">
            <SettingRow
              title="Camera during study"
              description="Controls whether the camera is active and visible in study mode"
            >
              <SegmentedControl<PrivacyComfort>
                ariaLabel="Camera privacy"
                value={draftPreferences.privacy_comfort}
                options={[
                  { value: 'visible', label: 'Visible' },
                  { value: 'hidden', label: 'Hidden' },
                  { value: 'off', label: 'Off' },
                ]}
                onChange={(value) => updateDraft({ privacy_comfort: value })}
              />
            </SettingRow>

            <SettingRow
              title="Emotion detection"
              description="Run computer vision in the background to detect frustration and fatigue"
              className={cameraOff ? 'opacity-70' : undefined}
            >
              <ToggleControl
                id="emotionDetection"
                checked={draftPreferences.emotion_detection}
                disabled={cameraOff}
                onCheckedChange={(checked) =>
                  updateDraft({ emotion_detection: checked })
                }
              />
            </SettingRow>
          </Section>

          <Section title="Focus Expression">
            <SettingRow
              title="My concentration face"
              description="Helps calibrate the emotion model to avoid false frustration alerts"
            >
              <SegmentedControl<ExpressionTolerance>
                ariaLabel="Expression tolerance"
                value={draftPreferences.expression_tolerance}
                options={[
                  { value: 'neutral', label: 'Neutral' },
                  { value: 'intense', label: 'Intense' },
                  { value: 'variable', label: 'Variable' },
                ]}
                onChange={(value) =>
                  updateDraft({ expression_tolerance: value })
                }
              />
            </SettingRow>
          </Section>

          <Section title="Study Rhythm">
            <SliderRow
              title="Study block length"
              description="How long each Pomodoro work interval runs"
              min={5}
              max={120}
              step={5}
              value={draftPreferences.study_block_length}
              label={`${draftPreferences.study_block_length} min`}
              onChange={(value) => updateDraft({ study_block_length: value })}
            />
            <SliderRow
              title="Mini breaks per session"
              description="Short pauses distributed within one study session (1-10)"
              min={1}
              max={10}
              step={1}
              value={draftPreferences.mini_breaks_per_session}
              label={`${draftPreferences.mini_breaks_per_session} breaks`}
              onChange={(value) =>
                updateDraft({ mini_breaks_per_session: value })
              }
            />
          </Section>

          <Section title="Break Behaviour">
            <SettingRow
              title="Break mechanic"
              description="Accountable mode: break timer only starts once the camera sees you've left the frame"
            >
              <div className="space-y-1 text-right">
                <SegmentedControl<BreakMechanic>
                  ariaLabel="Break mechanic"
                  value={draftPreferences.break_mechanic}
                  options={[
                    { value: 'relaxed', label: 'Relaxed' },
                    {
                      value: 'accountable',
                      label: 'Accountable',
                      disabled: cameraOff,
                      title: cameraOff ? 'Requires camera' : undefined,
                    },
                  ]}
                  onChange={(value) => updateDraft({ break_mechanic: value })}
                />
                {cameraOff && (
                  <p className="text-xs font-semibold text-[#aaa7a0]">
                    Requires camera
                  </p>
                )}
              </div>
            </SettingRow>
            <SliderRow
              title="Recovery window"
              description="Cooldown after a frustration event before the app re-prompts you"
              min={5}
              max={30}
              step={1}
              value={draftPreferences.recovery_duration}
              label={`${draftPreferences.recovery_duration} min`}
              onChange={(value) => updateDraft({ recovery_duration: value })}
            />
          </Section>

          <Section title="Timer Display">
            <SettingRow
              title="Show countdown during focus mode"
              description="If off, the timer still runs - you'll get a notification when time's up"
            >
              <ToggleControl
                id="showTimer"
                checked={draftPreferences.show_timer}
                onCheckedChange={(checked) =>
                  updateDraft({ show_timer: checked })
                }
              />
            </SettingRow>
          </Section>

          <Section title="Reset">
            <SettingRow
              title="Restore onboarding defaults"
              description="Reset all preferences to what you set during setup"
            >
              <Button
                type="button"
                variant="outline"
                disabled={!onboardingSnapshot}
                onClick={resetToOnboardingDefaults}
                className="rounded-md border-[#6a6964] bg-transparent px-4 font-semibold text-[#f5f3ed] shadow-none hover:bg-[#3a3a36]"
              >
                Reset to defaults
              </Button>
            </SettingRow>
          </Section>
        </>
      )}
    </div>
  );
}
