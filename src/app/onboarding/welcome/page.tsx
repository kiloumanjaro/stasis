'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BookOpen, Timer, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { markOnboardingComplete } from '@/lib/frontend-store';

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
    try {
      await markOnboardingComplete({ skipped: true });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      setSkipping(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-[520px] flex-col items-center gap-8 px-6 text-center">
        <Image src="/images/stasis.png" alt="Stasis" width={80} height={80} />

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
            <Badge
              key={label}
              variant="outline"
              className="flex items-center gap-1.5 rounded-full border-[#2A2A35] bg-[#131316] px-3.5 py-1.5 text-[#9090A8]"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[13px] font-medium">{label}</span>
            </Badge>
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
