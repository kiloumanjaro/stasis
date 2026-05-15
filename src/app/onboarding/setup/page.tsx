'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  VideoOff,
  Meh,
  Frown,
  Shuffle,
  Timer,
  Coffee,
  Heart,
  Sofa,
  UserCheck,
  Clock,
  BellOff,
  CheckCircle,
  Camera,
  Activity,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { UserPreferences } from '@/types/onboarding';
import {
  markOnboardingComplete,
  type OnboardingState,
} from '@/lib/frontend-store';

const TOTAL_STEPS = 6;

type PrivacyComfort = UserPreferences['privacy_comfort'];
type ExpressionTolerance = UserPreferences['expression_tolerance'];
type BreakMechanic = UserPreferences['break_mechanic'];

/* ------------------------------------------------------------------ */
/*  Option card component — reused across single-select enum steps    */
/* ------------------------------------------------------------------ */

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  disabledNote?: string;
  onClick: () => void;
  id: string;
}

function OptionCard({
  icon,
  title,
  description,
  selected,
  disabled,
  disabledNote,
  onClick,
  id,
}: OptionCardProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`group flex w-full gap-3.5 rounded-xl border p-4 text-left transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed border-[#1E1E26] bg-[#0f0f12] opacity-50'
          : selected
            ? 'border-[#7C6FF7]/60 bg-[#7C6FF7]/[0.08] shadow-[0_0_0_1px_rgba(124,111,247,0.15)]'
            : 'border-[#2A2A35] bg-[#131316] hover:border-[#3A3A48] hover:bg-[#171719]'
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
          selected
            ? 'bg-[#7C6FF7]/20 text-[#7C6FF7]'
            : 'bg-[#1C1C22] text-[#5A5A72]'
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] font-medium transition-colors duration-200 ${
            selected ? 'text-[#EAEAF0]' : 'text-[#BBBBC8]'
          }`}
        >
          {title}
        </p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-[#6E6E82]">
          {description}
        </p>
        {disabled && disabledNote && (
          <p className="mt-1 text-[11px] italic text-[#5A5A72]">
            {disabledNote}
          </p>
        )}
      </div>
      <div
        className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
          selected
            ? 'border-[#7C6FF7] bg-[#7C6FF7]'
            : 'border-[#3A3A48] bg-transparent'
        }`}
      >
        {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Slider step field component                                       */
/* ------------------------------------------------------------------ */

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  id: string;
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  id,
}: SliderFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-[#9090A8]">
          {label}
        </label>
        <span className="rounded-md bg-[#1C1C22] px-2.5 py-0.5 text-[13px] font-semibold tabular-nums text-[#EAEAF0]">
          {value} {unit}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
      />
      <div className="flex justify-between text-[11px] text-[#5A5A72]">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main wizard                                                       */
/* ------------------------------------------------------------------ */

export default function OnboardingSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [completing, setCompleting] = useState(false);

  // Step 1
  const [privacyComfort, setPrivacyComfort] = useState<PrivacyComfort | null>(
    null
  );
  // Step 2
  const [expressionTolerance, setExpressionTolerance] =
    useState<ExpressionTolerance | null>(null);
  // Step 3
  const [studyBlockLength, setStudyBlockLength] = useState(25);
  const [miniBreaksPerSession, setMiniBreaksPerSession] = useState(2);
  // Step 4
  const [recoveryDuration, setRecoveryDuration] = useState(10);
  // Step 5
  const [breakMechanic, setBreakMechanic] = useState<BreakMechanic | null>(
    null
  );
  // Step 6
  const [showTimer, setShowTimer] = useState<boolean | null>(null);

  /* ---- progress ---- */
  const progressFraction = useMemo(() => {
    if (currentStep <= TOTAL_STEPS) return currentStep / TOTAL_STEPS;
    return 1; // summary screen
  }, [currentStep]);

  /* ---- can continue? ---- */
  const canContinue = useMemo(() => {
    switch (currentStep) {
      case 1:
        return privacyComfort !== null;
      case 2:
        return expressionTolerance !== null;
      case 3:
        return true; // sliders always passable
      case 4:
        return true;
      case 5:
        return privacyComfort === 'off' || breakMechanic !== null;
      case 6:
        return showTimer !== null;
      default:
        return true;
    }
  }, [
    currentStep,
    privacyComfort,
    expressionTolerance,
    breakMechanic,
    showTimer,
  ]);

  /* ---- navigation ---- */
  const goBack = useCallback(() => {
    if (currentStep === 1) {
      router.push('/onboarding/welcome');
    } else {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep, router]);

  const goForward = useCallback(() => {
    if (currentStep <= TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  /* ---- completion ---- */
  const buildPreferences = useCallback((): Partial<OnboardingState> => {
    return {
      privacy_comfort: privacyComfort ?? 'visible',
      expression_tolerance: expressionTolerance ?? 'neutral',
      study_block_length: studyBlockLength,
      mini_breaks_per_session: miniBreaksPerSession,
      recovery_duration: recoveryDuration,
      break_mechanic:
        privacyComfort === 'off' ? 'relaxed' : (breakMechanic ?? 'relaxed'),
      show_timer: showTimer ?? true,
    };
  }, [
    privacyComfort,
    expressionTolerance,
    studyBlockLength,
    miniBreaksPerSession,
    recoveryDuration,
    breakMechanic,
    showTimer,
  ]);

  const handleComplete = useCallback(() => {
    setCompleting(true);
    markOnboardingComplete(buildPreferences());
    router.push('/dashboard');
  }, [buildPreferences, router]);

  /* ---- step titles ---- */
  const stepMeta: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: 'Camera Privacy',
      subtitle:
        'How comfortable are you with the camera being active during study sessions?',
    },
    2: {
      title: 'Micro-Expression Tolerance',
      subtitle:
        "What do you typically look like when you're concentrating hard?",
    },
    3: {
      title: 'Study Rhythm',
      subtitle: 'Configure your study block and mini-break structure.',
    },
    4: {
      title: 'Recovery Window',
      subtitle:
        'How long should the app wait before re-engaging after detecting frustration?',
    },
    5: {
      title: 'Break Mechanic',
      subtitle: 'How should breaks work for you?',
    },
    6: {
      title: 'Timer Visibility',
      subtitle:
        'Should the Pomodoro countdown be visible during study sessions?',
    },
  };

  const isSummary = currentStep > TOTAL_STEPS;

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-[520px] space-y-8 px-6">
        {/* ---- progress bar ---- */}
        <div className="flex items-center gap-4">
          <div className="h-0.5 flex-1 rounded-full bg-[#1E1E26]">
            <div
              className="h-full rounded-full bg-[#7C6FF7] transition-[width] duration-300"
              style={{ width: `${progressFraction * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-xs text-[#5A5A72]">
            {isSummary ? 'Summary' : `${currentStep} of ${TOTAL_STEPS}`}
          </span>
        </div>

        {/* ---- header ---- */}
        {!isSummary && (
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#EAEAF0]">
              {stepMeta[currentStep]?.title}
            </h1>
            <p className="text-sm text-[#9090A8]">
              {stepMeta[currentStep]?.subtitle}
            </p>
          </div>
        )}

        {/* ---- step content ---- */}
        <div className="space-y-4">
          {currentStep === 1 && (
            <StepPrivacy value={privacyComfort} onChange={setPrivacyComfort} />
          )}
          {currentStep === 2 && (
            <StepExpression
              value={expressionTolerance}
              onChange={setExpressionTolerance}
            />
          )}
          {currentStep === 3 && (
            <StepStudyRhythm
              blockLength={studyBlockLength}
              onBlockLengthChange={setStudyBlockLength}
              miniBreaks={miniBreaksPerSession}
              onMiniBreaksChange={setMiniBreaksPerSession}
            />
          )}
          {currentStep === 4 && (
            <StepRecovery
              value={recoveryDuration}
              onChange={setRecoveryDuration}
            />
          )}
          {currentStep === 5 && (
            <StepBreakMechanic
              value={breakMechanic}
              onChange={setBreakMechanic}
              cameraOff={privacyComfort === 'off'}
            />
          )}
          {currentStep === 6 && (
            <StepTimerVisibility value={showTimer} onChange={setShowTimer} />
          )}
          {isSummary && <StepSummary preferences={buildPreferences()} />}
        </div>

        {/* ---- navigation ---- */}
        <div className="flex items-center justify-between">
          {!isSummary ? (
            <>
              <Button
                onClick={goBack}
                variant="ghost"
                size="icon"
                className="rounded-full border border-[#2A2A35]"
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                onClick={goForward}
                disabled={!canContinue}
                className="px-8"
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setCurrentStep(TOTAL_STEPS)}
                variant="ghost"
                size="icon"
                className="rounded-full border border-[#2A2A35]"
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleComplete}
                disabled={completing}
                className="px-8"
              >
                {completing ? 'Loading...' : 'Go to Dashboard'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Step 1 — Camera Privacy                                           */
/* ================================================================== */

function StepPrivacy({
  value,
  onChange,
}: {
  value: PrivacyComfort | null;
  onChange: (v: PrivacyComfort) => void;
}) {
  return (
    <div className="space-y-3">
      <OptionCard
        id="privacy-visible"
        icon={<Eye className="h-4 w-4" />}
        title="Visible"
        description="Camera feed shown in a corner overlay during study mode. Emotion detection runs."
        selected={value === 'visible'}
        onClick={() => onChange('visible')}
      />
      <OptionCard
        id="privacy-hidden"
        icon={<EyeOff className="h-4 w-4" />}
        title="Hidden"
        description="Camera feed is hidden once study mode activates, but emotion detection still runs in the background."
        selected={value === 'hidden'}
        onClick={() => onChange('hidden')}
      />
      <OptionCard
        id="privacy-off"
        icon={<VideoOff className="h-4 w-4" />}
        title="Off"
        description="Camera is disabled entirely. All computer vision features (emotion detection, break accountability) are skipped."
        selected={value === 'off'}
        onClick={() => onChange('off')}
      />
    </div>
  );
}

/* ================================================================== */
/*  Step 2 — Micro-Expression Tolerance                               */
/* ================================================================== */

function StepExpression({
  value,
  onChange,
}: {
  value: ExpressionTolerance | null;
  onChange: (v: ExpressionTolerance) => void;
}) {
  return (
    <div className="space-y-3">
      <OptionCard
        id="expression-neutral"
        icon={<Meh className="h-4 w-4" />}
        title="Neutral"
        description="I look calm while focused. Use standard sensitivity."
        selected={value === 'neutral'}
        onClick={() => onChange('neutral')}
      />
      <OptionCard
        id="expression-intense"
        icon={<Frown className="h-4 w-4" />}
        title="Intense"
        description="I tend to frown or look serious. Raise the threshold before flagging a negative emotion state."
        selected={value === 'intense'}
        onClick={() => onChange('intense')}
      />
      <OptionCard
        id="expression-variable"
        icon={<Shuffle className="h-4 w-4" />}
        title="Variable"
        description="No strong pattern. Use a rolling baseline calibrated over the first few sessions."
        selected={value === 'variable'}
        onClick={() => onChange('variable')}
      />
    </div>
  );
}

/* ================================================================== */
/*  Step 3 — Study Rhythm (two sliders)                               */
/* ================================================================== */

function StepStudyRhythm({
  blockLength,
  onBlockLengthChange,
  miniBreaks,
  onMiniBreaksChange,
}: {
  blockLength: number;
  onBlockLengthChange: (v: number) => void;
  miniBreaks: number;
  onMiniBreaksChange: (v: number) => void;
}) {
  return (
    <div className="space-y-6 rounded-xl border border-[#2A2A35] bg-[#131316] p-6">
      <div className="flex items-center gap-2 text-[#7C6FF7]">
        <Timer className="h-4 w-4" />
        <span className="text-[11px] font-medium uppercase tracking-widest text-[#5A5A72]">
          Session Structure
        </span>
      </div>

      <SliderField
        id="study-block-length"
        label="Study block length"
        value={blockLength}
        min={15}
        max={90}
        step={5}
        unit="min"
        onChange={onBlockLengthChange}
      />

      <div className="h-px bg-[#1E1E26]" />

      <SliderField
        id="mini-breaks-per-session"
        label="Mini breaks per session"
        value={miniBreaks}
        min={1}
        max={3}
        step={1}
        unit=""
        onChange={onMiniBreaksChange}
      />
    </div>
  );
}

/* ================================================================== */
/*  Step 4 — Recovery Window                                          */
/* ================================================================== */

function StepRecovery({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-6 rounded-xl border border-[#2A2A35] bg-[#131316] p-6">
      <div className="flex items-center gap-2 text-[#7C6FF7]">
        <Heart className="h-4 w-4" />
        <span className="text-[11px] font-medium uppercase tracking-widest text-[#5A5A72]">
          Cooldown Period
        </span>
      </div>

      <p className="text-[12px] leading-relaxed text-[#6E6E82]">
        After the emotion model detects frustration, the app enters a cooldown
        period and won&apos;t re-prompt or nag you. Set how long that window
        lasts.
      </p>

      <SliderField
        id="recovery-duration"
        label="Recovery duration"
        value={value}
        min={3}
        max={30}
        step={1}
        unit="min"
        onChange={onChange}
      />
    </div>
  );
}

/* ================================================================== */
/*  Step 5 — Break Mechanic                                           */
/* ================================================================== */

function StepBreakMechanic({
  value,
  onChange,
  cameraOff,
}: {
  value: BreakMechanic | null;
  onChange: (v: BreakMechanic) => void;
  cameraOff: boolean;
}) {
  // If camera is off, force relaxed and disable accountable
  const effectiveValue = cameraOff ? 'relaxed' : value;

  return (
    <div className="space-y-3">
      <OptionCard
        id="break-relaxed"
        icon={<Sofa className="h-4 w-4" />}
        title="Relaxed"
        description="The break timer begins immediately when the study interval ends. No camera check is performed."
        selected={effectiveValue === 'relaxed'}
        onClick={() => onChange('relaxed')}
        disabled={false}
      />
      <OptionCard
        id="break-accountable"
        icon={<UserCheck className="h-4 w-4" />}
        title="Accountable"
        description="The break timer doesn't start until the camera confirms you've left the frame. Once you step away, the countdown begins."
        selected={effectiveValue === 'accountable'}
        onClick={() => onChange('accountable')}
        disabled={cameraOff}
        disabledNote="Requires camera to be enabled"
      />
    </div>
  );
}

/* ================================================================== */
/*  Step 6 — Timer Visibility                                         */
/* ================================================================== */

function StepTimerVisibility({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <OptionCard
        id="timer-visible"
        icon={<Clock className="h-4 w-4" />}
        title="Show Timer"
        description="The Pomodoro countdown is visible on screen during study sessions."
        selected={value === true}
        onClick={() => onChange(true)}
      />
      <OptionCard
        id="timer-hidden"
        icon={<BellOff className="h-4 w-4" />}
        title="Hide Timer"
        description="The timer runs silently. You'll receive a notification when the interval ends."
        selected={value === false}
        onClick={() => onChange(false)}
      />
    </div>
  );
}

/* ================================================================== */
/*  Summary Screen                                                    */
/* ================================================================== */

const PRIVACY_LABELS: Record<string, string> = {
  visible: 'Visible',
  hidden: 'Hidden',
  off: 'Off',
};

const EXPRESSION_LABELS: Record<string, string> = {
  neutral: 'Neutral',
  intense: 'Intense',
  variable: 'Variable',
};

const BREAK_LABELS: Record<string, string> = {
  relaxed: 'Relaxed',
  accountable: 'Accountable',
};

function StepSummary({
  preferences,
}: {
  preferences: Partial<OnboardingState>;
}) {
  const rows: Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
    accent?: boolean;
  }> = [
    {
      icon: <Camera className="h-3.5 w-3.5" />,
      label: 'Camera privacy',
      value: PRIVACY_LABELS[preferences.privacy_comfort ?? 'visible'],
      accent: preferences.privacy_comfort !== 'off',
    },
    {
      icon: <Activity className="h-3.5 w-3.5" />,
      label: 'Expression tolerance',
      value: EXPRESSION_LABELS[preferences.expression_tolerance ?? 'neutral'],
    },
    {
      icon: <Timer className="h-3.5 w-3.5" />,
      label: 'Study block',
      value: `${preferences.study_block_length ?? 25} min`,
    },
    {
      icon: <Coffee className="h-3.5 w-3.5" />,
      label: 'Mini breaks',
      value: `${preferences.mini_breaks_per_session ?? 2} per session`,
    },
    {
      icon: <Heart className="h-3.5 w-3.5" />,
      label: 'Recovery window',
      value: `${preferences.recovery_duration ?? 10} min`,
    },
    {
      icon: <Shield className="h-3.5 w-3.5" />,
      label: 'Break mechanic',
      value: BREAK_LABELS[preferences.break_mechanic ?? 'relaxed'],
    },
    {
      icon: <Clock className="h-3.5 w-3.5" />,
      label: 'Timer visibility',
      value: preferences.show_timer ? 'Visible' : 'Hidden',
    },
  ];

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2A2A35] bg-[#1C1C22]">
          <CheckCircle className="h-6 w-6 text-[#7C6FF7]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#EAEAF0]">
            You&apos;re all set
          </h1>
          <p className="text-sm text-[#9090A8]">
            Here&apos;s a summary of your setup.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#2A2A35] bg-[#131316] p-6">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-[#5A5A72]">
          Configuration
        </p>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] text-[#9090A8]">
                {row.icon}
                {row.label}
              </div>
              <span
                className={`text-[13px] font-medium ${
                  row.accent === false ? 'text-[#5A5A72]' : 'text-[#EAEAF0]'
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
