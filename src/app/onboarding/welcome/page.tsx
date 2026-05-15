'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BookOpen, Timer, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  markOnboardingComplete,
  saveOnboardingState,
} from '@/lib/frontend-store';

const FEATURES = [
  { icon: BookOpen, label: 'AI Flashcards' },
  { icon: Timer, label: 'Pomodoro Timer' },
  { icon: Smile, label: 'Mood Monitoring' },
] as const;

export default function WelcomePage() {
  const router = useRouter();
  const [skipping, setSkipping] = useState(false);

  const handleSkip = async () => {
    setSkipping(true);
    saveOnboardingState({ skipped: true });
    markOnboardingComplete();
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-[520px] flex-col items-center gap-8 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[10px] bg-[#2D2860]">
          <Image src="/images/icon.png" alt="Stasis" width={36} height={36} />
        </div>

        <div className="space-y-3">
          <h1 className="text-[32px] font-bold leading-tight text-[#EAEAF0]">
            Welcome to Stasis
          </h1>
          <p className="text-sm text-[#9090A8]">
            Study smarter with AI flashcards and focus tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-[#2A2A35] bg-[#131316] px-3.5 py-1.5"
            >
              <Icon className="h-3.5 w-3.5 text-[#9090A8]" />
              <span className="text-[13px] font-medium text-[#9090A8]">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex w-full max-w-[320px] flex-col items-center gap-3">
          <Button
            onClick={() => router.push('/onboarding/setup')}
            className="w-full"
          >
            Get Started
          </Button>
          <button
            onClick={handleSkip}
            disabled={skipping}
            className="text-sm text-[#5A5A72] transition-colors hover:text-[#9090A8] disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
