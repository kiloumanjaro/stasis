'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  markOnboardingComplete,
  type OnboardingState,
} from '@/lib/frontend-store';
import { STEP_META } from '@/components/onboarding/setup/constants';
import { StepBreakMechanic } from '@/components/onboarding/setup/StepBreakMechanic';
import { StepExpression } from '@/components/onboarding/setup/StepExpression';
import { StepPrivacy } from '@/components/onboarding/setup/StepPrivacy';
import { StepRecovery } from '@/components/onboarding/setup/StepRecovery';
import { StepStudyRhythm } from '@/components/onboarding/setup/StepStudyRhythm';
import { StepSummary } from '@/components/onboarding/setup/StepSummary';
import { StepTimerVisibility } from '@/components/onboarding/setup/StepTimerVisibility';
import {
  TOTAL_STEPS,
  type BreakMechanic,
  type ExpressionTolerance,
  type PrivacyComfort,
} from '@/components/onboarding/setup/types';

export default function OnboardingSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [completing, setCompleting] = useState(false);

  const [privacyComfort, setPrivacyComfort] = useState<PrivacyComfort | null>(
    null
  );
  const [expressionTolerance, setExpressionTolerance] =
    useState<ExpressionTolerance | null>(null);
  const [studyBlockLength, setStudyBlockLength] = useState(25);
  const [miniBreaksPerSession, setMiniBreaksPerSession] = useState(2);
  const [recoveryDuration, setRecoveryDuration] = useState(10);
  const [breakMechanic, setBreakMechanic] = useState<BreakMechanic | null>(
    null
  );
  const [showTimer, setShowTimer] = useState<boolean | null>(null);

  const isSummary = currentStep > TOTAL_STEPS;

  const progressFraction = useMemo(() => {
    if (currentStep <= TOTAL_STEPS) {
      return currentStep / TOTAL_STEPS;
    }

    return 1;
  }, [currentStep]);

  const canContinue = useMemo(() => {
    switch (currentStep) {
      case 1:
        return privacyComfort !== null;
      case 2:
        return expressionTolerance !== null;
      case 3:
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

  const goBack = useCallback(() => {
    if (currentStep === 1) {
      router.push('/onboarding/welcome');
      return;
    }

    setCurrentStep((step) => step - 1);
  }, [currentStep, router]);

  const goForward = useCallback(() => {
    if (currentStep <= TOTAL_STEPS) {
      setCurrentStep((step) => step + 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    setCompleting(true);
    markOnboardingComplete(buildPreferences());
    router.push('/dashboard');
  }, [buildPreferences, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-[520px] space-y-8 px-6">
        <div className="flex items-center gap-4">
          <Progress value={progressFraction * 100} className="h-0.5 flex-1" />
          <span className="shrink-0 text-xs text-[#5A5A72]">
            {isSummary ? 'Summary' : `${currentStep} of ${TOTAL_STEPS}`}
          </span>
        </div>

        {!isSummary && (
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#EAEAF0]">
              {STEP_META[currentStep]?.title}
            </h1>
            <p className="text-sm text-[#9090A8]">
              {STEP_META[currentStep]?.subtitle}
            </p>
          </div>
        )}

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
