'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { COLOR_THEMES } from '@/types/preferences';
import {
  Brain,
  Database,
  Flame,
  Gauge,
  Heart,
  Target,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';

const INITIAL_SIMPLE_SCORES = {
  attention: 50,
  adhd: 50,
  stress: 50,
  memory: 50,
  speed: 50,
  grit: 50,
  motivation: 50,
};

interface PreferenceQuestionnaireProps {
  onColorChange?: (color: string) => void;
}

export function PreferenceQuestionnaire({
  onColorChange,
}: PreferenceQuestionnaireProps) {
  const router = useRouter();
  const [scores, setScores] = useState(INITIAL_SIMPLE_SCORES);
  const [currentSection, setCurrentSection] = useState(0);

  const sections = [
    {
      key: 'attention',
      title: 'Attention & Focus',
      icon: Brain,
      description:
        'How well can you sustain attention and manage distractions?',
      left: 'Poor Focus',
      right: 'Excellent Focus',
    },
    {
      key: 'adhd',
      title: 'Activity & Restlessness',
      icon: Zap,
      description:
        'Do you experience restlessness, impulsivity, or distractibility?',
      left: 'Very Calm',
      right: 'Very Restless',
    },
    {
      key: 'stress',
      title: 'Stress & Anxiety',
      icon: Heart,
      description: 'How often do you feel stressed, anxious, or overwhelmed?',
      left: 'Very Calm',
      right: 'Very Stressed',
    },
    {
      key: 'memory',
      title: 'Working Memory',
      icon: Database,
      description: 'How well can you hold and manipulate information mentally?',
      left: 'Weak Memory',
      right: 'Strong Memory',
    },
    {
      key: 'speed',
      title: 'Learning Pace',
      icon: Gauge,
      description: 'How quickly do you understand and process new information?',
      left: 'Slow Learner',
      right: 'Fast Learner',
    },
    {
      key: 'grit',
      title: 'Persistence & Grit',
      icon: Target,
      description: 'How well do you persist through challenges and setbacks?',
      left: 'Give Up Easily',
      right: 'Very Persistent',
    },
    {
      key: 'motivation',
      title: 'Self-Motivation',
      icon: Flame,
      description: 'How self-directed and internally motivated are you?',
      left: 'Need External Push',
      right: 'Self-Driven',
    },
  ];

  const section = sections[currentSection];
  const progress = ((currentSection + 1) / sections.length) * 100;

  const handleSliderChange = (value: number[]) => {
    setScores((prev) => ({
      ...prev,
      [section.key]: value[0],
    }));
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = () => {
    const params = new URLSearchParams({
      attention: scores.attention.toString(),
      adhd: scores.adhd.toString(),
      stress: scores.stress.toString(),
      memory: scores.memory.toString(),
      speed: scores.speed.toString(),
      grit: scores.grit.toString(),
      motivation: scores.motivation.toString(),
    });

    router.push(`/preferences/summary?${params.toString()}`);
  };

  // Determine theme and intensity based on the CURRENT section being viewed
  // This makes each section equally responsive
  const getCurrentTheme = () => {
    const sectionKey = section.key;

    switch (sectionKey) {
      case 'attention':
        return COLOR_THEMES.highFocus; // Blue
      case 'adhd':
        return COLOR_THEMES.adhdFriendly; // Orange
      case 'stress':
        return COLOR_THEMES.lowStress; // Calm blue
      case 'memory':
        return COLOR_THEMES.energizing; // Warm orange
      case 'speed':
        return COLOR_THEMES.highFocus; // Cool blue
      case 'grit':
        return COLOR_THEMES.motivational; // Coral
      case 'motivation':
        return COLOR_THEMES.motivational; // Coral
      default:
        return COLOR_THEMES.balanced; // Green
    }
  };

  const currentTheme = getCurrentTheme();

  // Helper function to mix a color with white
  const mixColorWithWhite = (hexColor: string, whiteMix: number) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const newR = Math.round(r + (255 - r) * whiteMix);
    const newG = Math.round(g + (255 - g) * whiteMix);
    const newB = Math.round(b + (255 - b) * whiteMix);

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  // Memoize the background color calculation
  const currentScore = scores[section.key as keyof typeof scores];
  const backgroundColor = useMemo(() => {
    const baseColor = currentTheme.primary;
    const intensity = currentScore / 100;
    return mixColorWithWhite(baseColor, 1 - intensity * 0.85);
  }, [currentTheme.primary, currentScore]);

  // Track previous color to avoid unnecessary updates
  const prevColorRef = useRef(backgroundColor);

  // Notify parent of color changes for LightRays
  useEffect(() => {
    if (onColorChange && prevColorRef.current !== backgroundColor) {
      prevColorRef.current = backgroundColor;
      onColorChange(backgroundColor);
    }
  }, [backgroundColor, onColorChange]);

  const SectionIcon = section.icon;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Progress Bar with Avatar Message Bubble */}
      <div className="absolute top-6 z-10 w-full">
        <div className="container mx-auto p-4">
          <div className="flex items-start gap-4">
            {/* Avatar Placeholder */}
            <Image
              src="/images/icon.png"
              alt="Avatar"
              width={48}
              height={48}
              className="flex-shrink-0 rounded-full"
            />

            {/* Message Bubble with Progress */}
            <div className="relative flex-1 rounded-2xl border border-border bg-card px-8 py-6 shadow-sm backdrop-blur-sm">
              {/* Arrow Tail */}
              <div className="absolute -left-2 top-4 h-4 w-4 rotate-45 border-b border-l border-border bg-card" />

              {/* Progress Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-medium">
                    Section {currentSection + 1} of {sections.length}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {Math.round(progress)}% Complete
                  </span>
                </div>
                <Progress value={progress} className="h-2 bg-primary/20" />
                <div className="!mt-4 flex items-center gap-2 text-xs">
                  <div
                    className="mb-0.5 h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: currentTheme.primary }}
                  />
                  <span className="font-medium text-muted-foreground">
                    {currentTheme.name}
                  </span>
                  <span className="text-muted-foreground">
                    • {currentTheme.description}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto flex max-w-3xl flex-1 items-center p-6">
        <div className="w-full space-y-6">
          <Card>
            <CardHeader className="rounded-t-xl bg-secondary">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <SectionIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 py-8">
              <div className="space-y-6">
                <div className="text-center">
                  <p className="mb-8 text-lg">
                    Rate yourself on this dimension:
                  </p>
                </div>
                <div className="space-y-4">
                  <Slider
                    value={[scores[section.key as keyof typeof scores]]}
                    onValueChange={handleSliderChange}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {section.left}
                    </span>
                    <span className="text-2xl font-bold text-foreground">
                      {scores[section.key as keyof typeof scores]}
                    </span>
                    <span className="text-muted-foreground">
                      {section.right}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <Button
              onClick={handlePrevious}
              disabled={currentSection === 0}
              size="icon"
              className="rounded-full bg-[#292929] text-white hover:bg-[#1b1b1b]"
              aria-label="Previous section"
            >
              <ChevronLeft className="h-10 w-10" />
            </Button>

            {/* Slide Indicator Dots */}
            <div className="flex gap-2">
              {sections.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const diff = index - currentSection;
                    if (diff > 0) {
                      for (let i = 0; i < diff; i++) handleNext();
                    } else if (diff < 0) {
                      for (let i = 0; i < Math.abs(diff); i++) handlePrevious();
                    }
                  }}
                  className={`rounded-full transition-all ${
                    index === currentSection
                      ? 'h-2 w-6 bg-[#292929]'
                      : 'h-2 w-2 bg-[#292929]/40 hover:bg-[#292929]/60'
                  }`}
                  aria-label={`Go to section ${index + 1}`}
                />
              ))}
            </div>

            {currentSection < sections.length - 1 ? (
              <Button
                onClick={handleNext}
                size="icon"
                className="rounded-full bg-[#292929] text-white hover:bg-[#1b1b1b]"
                aria-label="Next section"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                size="icon"
                className="rounded-full bg-[#292929] text-white hover:bg-[#1b1b1b]"
                aria-label="Complete assessment"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
