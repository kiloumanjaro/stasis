'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StudyPreferences } from '@/types/onboarding';

interface FormErrors {
  focusGoalMinutes?: string;
  breakDurationMinutes?: string;
  dailyGoalCards?: string;
}

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const [form, setForm] = useState<StudyPreferences>({
    focusGoalMinutes: 25,
    breakDurationMinutes: 5,
    dailyGoalCards: 20,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (form.focusGoalMinutes < 5 || form.focusGoalMinutes > 120)
      errs.focusGoalMinutes = 'Must be between 5 and 120';
    if (form.breakDurationMinutes < 1 || form.breakDurationMinutes > 30)
      errs.breakDurationMinutes = 'Must be between 1 and 30';
    if (form.dailyGoalCards < 5 || form.dailyGoalCards > 200)
      errs.dailyGoalCards = 'Must be between 5 and 200';
    return errs;
  };

  const handleChange =
    (field: keyof StudyPreferences) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      setForm((prev) => ({ ...prev, [field]: isNaN(value) ? 0 : value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setSaveError(false);
    };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    const res = await fetch('/api/onboarding/save-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      router.push('/onboarding/permissions');
    } else {
      setSaveError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-[520px] space-y-8 px-6">
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
            Customize your focus sessions and daily goals.
          </p>
        </div>

        <div className="space-y-6 rounded-xl border border-[#2A2A35] bg-[#131316] p-6">
          <div className="space-y-1.5">
            <Label
              htmlFor="focus"
              className="text-[13px] font-medium text-[#9090A8]"
            >
              Focus session length
            </Label>
            <div className="relative">
              <Input
                id="focus"
                type="number"
                value={form.focusGoalMinutes}
                onChange={handleChange('focusGoalMinutes')}
                min={5}
                max={120}
                className="border-[#2A2A35] bg-[#1C1C22] pr-12 text-[#EAEAF0]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#5A5A72]">
                min
              </span>
            </div>
            {errors.focusGoalMinutes && (
              <p className="text-xs text-[#F04F4F]">
                {errors.focusGoalMinutes}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="break"
              className="text-[13px] font-medium text-[#9090A8]"
            >
              Short break length
            </Label>
            <div className="relative">
              <Input
                id="break"
                type="number"
                value={form.breakDurationMinutes}
                onChange={handleChange('breakDurationMinutes')}
                min={1}
                max={30}
                className="border-[#2A2A35] bg-[#1C1C22] pr-12 text-[#EAEAF0]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#5A5A72]">
                min
              </span>
            </div>
            {errors.breakDurationMinutes && (
              <p className="text-xs text-[#F04F4F]">
                {errors.breakDurationMinutes}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="cards"
              className="text-[13px] font-medium text-[#9090A8]"
            >
              Daily card review goal
            </Label>
            <div className="relative">
              <Input
                id="cards"
                type="number"
                value={form.dailyGoalCards}
                onChange={handleChange('dailyGoalCards')}
                min={5}
                max={200}
                className="border-[#2A2A35] bg-[#1C1C22] pr-14 text-[#EAEAF0]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#5A5A72]">
                cards
              </span>
            </div>
            {errors.dailyGoalCards && (
              <p className="text-xs text-[#F04F4F]">{errors.dailyGoalCards}</p>
            )}
          </div>
        </div>

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
