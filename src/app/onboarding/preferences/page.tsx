'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { saveOnboardingState } from '@/lib/frontend-store';
import { cn } from '@/lib/utils';
import type { StudyPreferences } from '@/types/onboarding';
import {
  DEFAULT_RUNTIME_PREFERENCES,
  type ExpressionTolerance,
} from '@/types/runtime-preferences';

const expressionOptions: Array<{
  value: ExpressionTolerance;
  label: string;
}> = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'intense', label: 'Intense' },
  { value: 'variable', label: 'Variable' },
];

function SliderField({
  label,
  description,
  value,
  min,
  max,
  step,
  valueLabel,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  valueLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label className="text-[13px] font-semibold text-[#EAEAF0]">
            {label}
          </Label>
          <p className="mt-1 text-xs text-[#9090A8]">{description}</p>
        </div>
        <span className="rounded-full bg-[#d8fff1] px-3 py-0.5 text-xs font-bold text-[#1b6653]">
          {valueLabel}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(nextValue) => onChange(nextValue[0] ?? value)}
      />
    </div>
  );
}

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const [form, setForm] = useState<StudyPreferences>({
    focusGoalMinutes: DEFAULT_RUNTIME_PREFERENCES.study_block_length,
    breakDurationMinutes: 5,
    dailyGoalCards: 20,
    expressionTolerance: DEFAULT_RUNTIME_PREFERENCES.expression_tolerance,
    studyBlockLength: DEFAULT_RUNTIME_PREFERENCES.study_block_length,
    miniBreaksPerSession: DEFAULT_RUNTIME_PREFERENCES.mini_breaks_per_session,
    recoveryDuration: DEFAULT_RUNTIME_PREFERENCES.recovery_duration,
    showTimer: DEFAULT_RUNTIME_PREFERENCES.show_timer,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const updateForm = (patch: Partial<StudyPreferences>) => {
    setSaveError(false);
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      saveOnboardingState({
        focusGoalMinutes: form.studyBlockLength,
        breakDurationMinutes: form.breakDurationMinutes,
        dailyGoalCards: form.dailyGoalCards,
        expressionTolerance: form.expressionTolerance,
        studyBlockLength: form.studyBlockLength,
        miniBreaksPerSession: form.miniBreaksPerSession,
        recoveryDuration: form.recoveryDuration,
        showTimer: form.showTimer,
      });
      router.push('/onboarding/permissions');
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-[560px] space-y-8 px-6">
        <div className="flex items-center gap-4">
          <div className="h-0.5 flex-1 rounded-full bg-[#1E1E26]">
            <div className="h-full w-2/4 rounded-full bg-[#7C6FF7] transition-[width] duration-300" />
          </div>
          <span className="shrink-0 text-xs text-[#5A5A72]">2 of 4</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#EAEAF0]">
            Study Preferences
          </h1>
          <p className="text-sm text-[#9090A8]">
            Tune your rhythm and how Stasis interprets focus signals.
          </p>
        </div>

        <Card className="space-y-7 rounded-xl border-[#2A2A35] bg-[#131316] p-6 shadow-none">
          <div className="space-y-3">
            <Label className="text-[13px] font-semibold text-[#EAEAF0]">
              My concentration face
            </Label>
            <div className="inline-flex w-full overflow-hidden rounded-md border border-[#3A3A45] bg-[#1C1C22]">
              {expressionOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  onClick={() =>
                    updateForm({ expressionTolerance: option.value })
                  }
                  className={cn(
                    'h-10 flex-1 rounded-none border-0 border-l border-[#3A3A45] bg-transparent text-[#9090A8] shadow-none first:border-l-0 hover:bg-[#24242c] hover:text-[#EAEAF0]',
                    form.expressionTolerance === option.value &&
                      'bg-[#292933] text-[#EAEAF0]'
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <SliderField
            label="Study block length"
            description="How long each Pomodoro work interval runs"
            min={15}
            max={90}
            step={5}
            value={form.studyBlockLength}
            valueLabel={`${form.studyBlockLength} min`}
            onChange={(value) =>
              updateForm({
                studyBlockLength: value,
                focusGoalMinutes: value,
              })
            }
          />

          <SliderField
            label="Mini breaks per session"
            description="Short pauses distributed within one study session"
            min={1}
            max={3}
            step={1}
            value={form.miniBreaksPerSession}
            valueLabel={`${form.miniBreaksPerSession} breaks`}
            onChange={(value) => updateForm({ miniBreaksPerSession: value })}
          />

          <SliderField
            label="Recovery window"
            description="Cooldown after frustration before Stasis re-prompts"
            min={3}
            max={30}
            step={1}
            value={form.recoveryDuration}
            valueLabel={`${form.recoveryDuration} min`}
            onChange={(value) => updateForm({ recoveryDuration: value })}
          />

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-[#2A2A35] bg-[#1C1C22] p-3">
            <div>
              <span className="text-[13px] font-semibold text-[#EAEAF0]">
                Show countdown during focus mode
              </span>
              <p className="mt-1 text-xs text-[#9090A8]">
                The timer still runs when hidden.
              </p>
            </div>
            <Checkbox
              role="switch"
              checked={form.showTimer}
              onCheckedChange={(checked) =>
                updateForm({ showTimer: checked === true })
              }
              className="h-5 w-10 rounded-full border-0 bg-[#5b5c57] data-[state=checked]:bg-[#2dbd91]"
            />
          </label>
        </Card>

        {saveError && (
          <p className="text-center text-sm text-[#F04F4F]">
            Failed to save preferences. Please try again.
          </p>
        )}

        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.push('/onboarding/welcome')}
            variant="ghost"
            size="icon"
            className="rounded-full border border-[#2A2A35]"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="px-8">
            {saving ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
