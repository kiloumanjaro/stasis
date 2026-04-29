'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Timer, Clock, LayoutGrid, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileSummary {
  focus_goal_minutes: number;
  break_duration_minutes: number;
  daily_goal_cards: number;
  cv_monitoring_enabled: boolean | null;
}

export default function CompletePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetch('/api/onboarding/summary')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProfileSummary | null) => setProfile(data));
  }, []);

  const handleComplete = async () => {
    setCompleting(true);
    await fetch('/api/onboarding/complete', { method: 'POST' });
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-[520px] space-y-8 px-6">
        <div className="flex items-center gap-4">
          <div className="h-0.5 flex-1 rounded-full bg-[#1E1E26]">
            <div className="h-full w-full rounded-full bg-[#7C6FF7] transition-[width] duration-300" />
          </div>
          <span className="shrink-0 text-xs text-[#5A5A72]">4 of 4</span>
        </div>

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
          {profile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-[#9090A8]">
                  <Timer className="h-3.5 w-3.5" />
                  Focus session
                </div>
                <span className="text-[13px] font-medium text-[#EAEAF0]">
                  {profile.focus_goal_minutes} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-[#9090A8]">
                  <Clock className="h-3.5 w-3.5" />
                  Break duration
                </div>
                <span className="text-[13px] font-medium text-[#EAEAF0]">
                  {profile.break_duration_minutes} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-[#9090A8]">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Daily card goal
                </div>
                <span className="text-[13px] font-medium text-[#EAEAF0]">
                  {profile.daily_goal_cards} cards
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-[#9090A8]">
                  <Camera className="h-3.5 w-3.5" />
                  CV monitoring
                </div>
                <span
                  className={`text-[13px] font-medium ${
                    profile.cv_monitoring_enabled
                      ? 'text-[#7C6FF7]'
                      : 'text-[#5A5A72]'
                  }`}
                >
                  {profile.cv_monitoring_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 w-28 animate-pulse rounded bg-[#1C1C22]" />
                  <div className="h-3 w-16 animate-pulse rounded bg-[#1C1C22]" />
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleComplete}
          disabled={completing}
          className="w-full"
        >
          {completing ? 'Loading...' : 'Go to Dashboard'}
        </Button>
      </div>
    </div>
  );
}
