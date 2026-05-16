'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChevronLeft, EyeOff, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { saveOnboardingState } from '@/lib/frontend-store';
import { cn } from '@/lib/utils';
import {
  DEFAULT_RUNTIME_PREFERENCES,
  normalizeRuntimePreferences,
  type BreakMechanic,
  type PrivacyComfort,
  type UserPreferences,
} from '@/types/runtime-preferences';

const privacyOptions: Array<{
  value: PrivacyComfort;
  label: string;
  icon: typeof Camera;
  description: string;
}> = [
  {
    value: 'visible',
    label: 'Visible',
    icon: Camera,
    description: 'Show camera feed while studying.',
  },
  {
    value: 'hidden',
    label: 'Hidden',
    icon: EyeOff,
    description: 'Use camera signals without showing the feed.',
  },
  {
    value: 'off',
    label: 'Off',
    icon: ShieldCheck,
    description: 'Keep camera-based features disabled.',
  },
];

const breakOptions: Array<{ value: BreakMechanic; label: string }> = [
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'accountable', label: 'Accountable' },
];

export default function PermissionsPage() {
  const router = useRouter();
  const previousCameraChoicesRef = useRef({
    break_mechanic: 'relaxed' as BreakMechanic,
  });
  const [preferences, setPreferences] = useState<UserPreferences>(
    DEFAULT_RUNTIME_PREFERENCES
  );
  const [saving, setSaving] = useState(false);

  const updatePreferences = (patch: Partial<UserPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };

      if (
        patch.privacy_comfort === 'off' &&
        current.privacy_comfort !== 'off'
      ) {
        previousCameraChoicesRef.current = {
          break_mechanic: current.break_mechanic,
        };
      }

      if (
        patch.privacy_comfort &&
        patch.privacy_comfort !== 'off' &&
        current.privacy_comfort === 'off'
      ) {
        next.break_mechanic = previousCameraChoicesRef.current.break_mechanic;
      }

      const normalized = normalizeRuntimePreferences(next);
      if (normalized.privacy_comfort !== 'off') {
        previousCameraChoicesRef.current = {
          break_mechanic: normalized.break_mechanic,
        };
      }

      return normalized;
    });
  };

  const handleContinue = async () => {
    const normalized = normalizeRuntimePreferences(preferences);
    setSaving(true);

    saveOnboardingState({
      cvMonitoringEnabled: normalized.privacy_comfort !== 'off',
      privacyComfort: normalized.privacy_comfort,
      breakMechanic: normalized.break_mechanic,
    });
    router.push('/onboarding/complete');
  };

  const cameraOff = preferences.privacy_comfort === 'off';

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-[560px] space-y-8 px-6">
        <div className="flex items-center gap-4">
          <div className="h-0.5 flex-1 rounded-full bg-[#1E1E26]">
            <div className="h-full w-3/4 rounded-full bg-[#7C6FF7] transition-[width] duration-300" />
          </div>
          <span className="shrink-0 text-xs text-[#5A5A72]">3 of 4</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#EAEAF0]">
            Camera & Privacy
          </h1>
          <p className="text-sm text-[#9090A8]">
            Let Stasis analyze your webcam feed locally to improve your study
            sessions.
          </p>
        </div>

        <Card className="space-y-6 rounded-xl border-[#2A2A35] bg-[#131316] p-6 shadow-none">
          <div className="grid gap-3 sm:grid-cols-3">
            {privacyOptions.map(({ value, label, icon: Icon, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => updatePreferences({ privacy_comfort: value })}
                className={cn(
                  'rounded-lg border border-[#2A2A35] bg-[#1C1C22] p-4 text-left transition-colors hover:border-[#7C6FF7]/70',
                  preferences.privacy_comfort === value &&
                    'border-[#7C6FF7] bg-[#211f35]'
                )}
              >
                <Icon className="mb-3 h-5 w-5 text-[#7C6FF7]" />
                <p className="text-sm font-semibold text-[#EAEAF0]">{label}</p>
                <p className="mt-1 text-xs leading-snug text-[#9090A8]">
                  {description}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[13px] font-semibold text-[#EAEAF0]">
                Break mechanic
              </p>
              <p className="mt-1 text-xs text-[#9090A8]">
                No video ever leaves your device. When monitoring is enabled,
                Stasis may sync mapped emotion labels to your account during
                focus sessions. Accountable breaks require an active camera.
              </p>
            </div>
            <div className="inline-flex w-full overflow-hidden rounded-md border border-[#3A3A45] bg-[#1C1C22]">
              {breakOptions.map((option) => {
                const disabled = cameraOff && option.value === 'accountable';
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    title={disabled ? 'Requires camera' : undefined}
                    onClick={() =>
                      updatePreferences({ break_mechanic: option.value })
                    }
                    className={cn(
                      'h-10 flex-1 rounded-none border-0 border-l border-[#3A3A45] bg-transparent text-[#9090A8] shadow-none first:border-l-0 hover:bg-[#24242c] hover:text-[#EAEAF0]',
                      preferences.break_mechanic === option.value &&
                        'bg-[#292933] text-[#EAEAF0]',
                      disabled && 'opacity-40'
                    )}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
            {cameraOff && (
              <p className="text-xs font-medium text-[#5A5A72]">
                Accountable mode requires camera.
              </p>
            )}
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.push('/onboarding/preferences')}
            variant="ghost"
            size="icon"
            className="rounded-full border border-[#2A2A35]"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button onClick={handleContinue} disabled={saving} className="px-8">
            {saving ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
