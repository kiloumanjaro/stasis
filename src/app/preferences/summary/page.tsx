'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { UserPreferences } from '@/types/preferences';
import { calculateAdaptiveParameters } from '@/lib/preferences/calculator';
import { Icon } from '@iconify/react';
import ModelViewer from '@/components/preferences/ModelViewer';
import { savePreferenceSummary } from '@/lib/frontend-store';
import {
  Brain,
  Zap,
  Heart,
  Database,
  Gauge,
  Target,
  Flame,
  Clock,
  RotateCcw,
  TrendingUp,
  Lightbulb,
  MessageCircle,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';

const scoreToPreferences = (
  scores: Record<string, number>
): UserPreferences => {
  return {
    attentionControl: {
      focusDespiteDistractions: scores.attention,
      concentrationDuration: scores.attention,
      mindWandering: 100 - scores.attention,
      taskSwitchingDifficulty: scores.attention,
    },
    adhdIndicators: {
      sustainedAttentionDifficulty: Math.ceil((scores.adhd / 100) * 5) || 1,
      distractibility: Math.ceil((scores.adhd / 100) * 5) || 1,
      restlessnessOrFidgeting: Math.ceil((scores.adhd / 100) * 5) || 1,
      impulsivity: Math.ceil((scores.adhd / 100) * 5) || 1,
    },
    stressAndAnxiety: {
      anxietyFrequency: scores.stress,
      worryControl: 100 - scores.stress,
      physicalTension: scores.stress,
      overwhelmFeeling: scores.stress,
    },
    workingMemory: {
      multiStepInstructions: scores.memory,
      mentalCalculation: scores.memory,
      simultaneousConcepts: scores.memory,
      rereadingFrequency: 100 - scores.memory,
    },
    processingSpeed: {
      conceptUnderstanding: scores.speed,
      readingSpeed: scores.speed,
      noteTakingPace: scores.speed,
      timePressureComfort: scores.speed,
    },
    gritAndPersistence: {
      taskCompletion: scores.grit,
      longTermGoalConsistency: scores.grit,
      setbackRecovery: scores.grit,
      challengePreference: scores.grit,
    },
    motivationAndRegulation: {
      intrinsicInterest: scores.motivation,
      externalRewardNeed: 100 - scores.motivation,
      selfScheduling: scores.motivation,
      processEnjoyment: scores.motivation,
    },
  };
};

const getScoreLevel = (
  score: number
): { label: string; color: string; bgColor: string } => {
  if (score >= 70)
    return { label: 'High', color: 'text-green-400', bgColor: 'bg-green-500' };
  if (score >= 40)
    return {
      label: 'Moderate',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500',
    };
  return { label: 'Low', color: 'text-red-400', bgColor: 'bg-red-500' };
};

const MetricCard = ({
  icon: IconComponent,
  title,
  score,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  score: number;
  description: string;
}) => {
  const level = getScoreLevel(score);
  return (
    <div className="rounded-lg border border-[#4a4a46]/50 bg-[#1f1e1d] p-4 transition-colors hover:border-[#4a4a46]">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <IconComponent className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">{title}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className={`text-xs font-medium ${level.color}`}>
            {level.label}
          </span>
          <span className="text-sm font-semibold text-white">{score}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a28]">
          <div
            className={`h-full transition-all ${level.bgColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
};

function SummaryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const attention = parseFloat(searchParams.get('attention') || '50');
  const adhd = parseFloat(searchParams.get('adhd') || '50');
  const stress = parseFloat(searchParams.get('stress') || '50');
  const memory = parseFloat(searchParams.get('memory') || '50');
  const speed = parseFloat(searchParams.get('speed') || '50');
  const grit = parseFloat(searchParams.get('grit') || '50');
  const motivation = parseFloat(searchParams.get('motivation') || '50');

  const scores = { attention, adhd, stress, memory, speed, grit, motivation };
  const prefs = scoreToPreferences(scores);
  const params = calculateAdaptiveParameters(prefs);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      savePreferenceSummary({
        scores,
        adaptiveParams: params,
        savedAt: new Date().toISOString(),
      });

      router.push('/upload');
    } catch (error) {
      console.error('Error saving preferences locally:', error);
      setSaveError('An error occurred while saving your preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const metrics = [
    {
      icon: Brain,
      title: 'Attention & Focus',
      score: scores.attention,
      description: 'Your ability to maintain concentration',
    },
    {
      icon: Zap,
      title: 'Activity & Restlessness',
      score: scores.adhd,
      description: 'Level of restlessness indicators',
    },
    {
      icon: Heart,
      title: 'Stress & Anxiety',
      score: scores.stress,
      description: 'Your stress and anxiety levels',
    },
    {
      icon: Database,
      title: 'Working Memory',
      score: scores.memory,
      description: 'Capacity to hold information',
    },
    {
      icon: Gauge,
      title: 'Learning Pace',
      score: scores.speed,
      description: 'Speed of information processing',
    },
    {
      icon: Target,
      title: 'Persistence & Grit',
      score: scores.grit,
      description: 'Your ability to persist through challenges',
    },
    {
      icon: Flame,
      title: 'Self-Motivation',
      score: scores.motivation,
      description: 'Your intrinsic drive to learn',
    },
  ];

  return (
    <div className="min-h-screen bg-[#1f1e1d] p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl">Your Learning Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Personalized study recommendations based on your cognitive profile
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#4a4a46] bg-[#30302e] px-4 py-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: params.theme.primary }}
            />
            <span className="text-sm font-medium">{params.theme.name}</span>
          </div>
        </div>

        {/* 3D Model */}
        <div className="flex justify-center">
          <div className="h-80 w-full max-w-2xl overflow-hidden rounded-lg border border-[#4a4a46] bg-[#e5e5df]">
            <ModelViewer
              url="/model/Untitled1.glb"
              width="100%"
              height={320}
              enableHoverRotation={true}
              defaultRotationX={0}
              defaultRotationY={0}
              showScreenshotButton={false}
              enableManualZoom={false}
              autoFrame
            />
          </div>
        </div>

        {/* Cognitive Profile Metrics */}
        <Card className="border border-[#4a4a46] bg-[#30302e]">
          <CardHeader>
            <CardTitle className="text-lg">Cognitive Profile</CardTitle>
            <CardDescription>
              Your strengths and areas for support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.title} {...metric} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Study Parameters */}
        <Card className="border border-[#4a4a46] bg-[#30302e]">
          <CardHeader>
            <CardTitle className="text-lg">
              Optimized Study Parameters
            </CardTitle>
            <CardDescription>
              Personalized settings for maximum productivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-lg border border-[#4a4a46]/50 bg-[#1f1e1d] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Session Duration
                  </span>
                </div>
                <p className="text-2xl font-semibold">
                  {params.sessionDuration}
                </p>
                <p className="text-xs text-muted-foreground">minutes</p>
              </div>

              <div className="rounded-lg border border-[#4a4a46]/50 bg-[#1f1e1d] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Break Frequency
                  </span>
                </div>
                <p className="text-2xl font-semibold">
                  {params.breakFrequency}
                </p>
                <p className="text-xs text-muted-foreground">minutes</p>
              </div>

              <div className="rounded-lg border border-[#4a4a46]/50 bg-[#1f1e1d] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Break Duration
                  </span>
                </div>
                <p className="text-2xl font-semibold">{params.breakDuration}</p>
                <p className="text-xs text-muted-foreground">minutes</p>
              </div>

              <div className="rounded-lg border border-[#4a4a46]/50 bg-[#1f1e1d] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Difficulty
                  </span>
                </div>
                <p className="text-lg font-semibold capitalize">
                  {params.difficultyProgression}
                </p>
                <p className="text-xs text-muted-foreground">progression</p>
              </div>

              <div className="rounded-lg border border-[#4a4a46]/50 bg-[#1f1e1d] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Content Density
                  </span>
                </div>
                <p className="text-lg font-semibold capitalize">
                  {params.contentDensity}
                </p>
                <p className="text-xs text-muted-foreground">material</p>
              </div>

              <div className="rounded-lg border border-[#4a4a46]/50 bg-[#1f1e1d] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Feedback
                  </span>
                </div>
                <p className="text-lg font-semibold capitalize">
                  {params.feedbackFrequency}
                </p>
                <p className="text-xs text-muted-foreground">frequency</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Recommendations */}
        <Card className="border border-[#4a4a46] bg-[#30302e]">
          <CardHeader>
            <CardTitle className="text-lg">Key Recommendations</CardTitle>
            <CardDescription>
              Tailored suggestions based on your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-[#4a4a46]/50 bg-[#1f1e1d] p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <Icon
                      icon="bi:clock-history"
                      className="h-4 w-4 text-primary"
                    />
                  </div>
                  <h4 className="font-medium">Session Structure</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Study for {params.sessionDuration} minutes with breaks every{' '}
                  {params.breakFrequency} minutes for {params.breakDuration}{' '}
                  minutes.
                </p>
              </div>

              <div className="rounded-lg border border-[#4a4a46]/50 bg-[#1f1e1d] p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <Icon icon="bi:layers" className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-medium">Content Approach</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use {params.contentDensity} content density with{' '}
                  {params.repetitionFrequency} repetition frequency for optimal
                  retention.
                </p>
              </div>

              <div className="rounded-lg border border-[#4a4a46]/50 bg-[#1f1e1d] p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <Icon icon="bi:palette" className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-medium">Color Theme</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  The {params.theme.name} theme supports your learning style and
                  helps maintain focus and engagement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex flex-col items-center gap-4 pt-4">
          {saveError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <Icon icon="bi:exclamation-circle" className="h-4 w-4" />
              {saveError}
            </div>
          )}
          <div className="flex gap-4">
            <Button
              onClick={() => router.push('/preferences')}
              variant="ghost"
              className="gap-2 border border-[#4a4a46] bg-[#30302e]"
              disabled={isSaving}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Questionnaire
            </Button>
            <Button
              onClick={handleSaveProfile}
              variant="ghost"
              className="gap-2 border border-[#4a4a46] bg-green-400"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Icon
                    icon="bi:arrow-repeat"
                    className="h-4 w-4 animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Icon icon="bi:check-lg" className="h-4 w-4" />
                  Save & Continue
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <SummaryPageContent />
    </Suspense>
  );
}
