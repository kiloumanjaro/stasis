'use client';

import { useEffect, useState } from 'react';

import type { DailyStats } from '@/lib/dashboard';
import { readSettingsProfile } from '@/lib/frontend-store';

interface UserGreetingProps {
  displayName: string;
  dailyStats: DailyStats | null;
}

const SAME_DAY_VISIT_STORAGE_KEY = 'stasis-dashboard-visit-tracker';

type VisitTracker = {
  date: string;
  count: number;
};

function getSalutation(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour >= 5 && hour <= 11) {
    return 'Good morning';
  }

  if (hour >= 12 && hour <= 16) {
    return 'Good afternoon';
  }

  if (hour >= 17 && hour <= 20) {
    return 'Good evening';
  }

  return 'Good night';
}

function truncateForMobile(displayName: string): string {
  const maxLength = 20;

  if (displayName.length <= maxLength) {
    return displayName;
  }

  return `${displayName.slice(0, maxLength - 3)}...`;
}

function getTodayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function readVisitTracker(): VisitTracker | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(SAME_DAY_VISIT_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<VisitTracker>;
    if (
      typeof parsed.date === 'string' &&
      typeof parsed.count === 'number' &&
      Number.isFinite(parsed.count)
    ) {
      return {
        date: parsed.date,
        count: parsed.count,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function trackSameDayVisit(): number {
  if (typeof window === 'undefined') {
    return 1;
  }

  const today = getTodayKey();
  const existingTracker = readVisitTracker();

  const nextTracker: VisitTracker =
    existingTracker?.date === today
      ? {
          date: today,
          count: existingTracker.count + 1,
        }
      : {
          date: today,
          count: 1,
        };

  window.localStorage.setItem(
    SAME_DAY_VISIT_STORAGE_KEY,
    JSON.stringify(nextTracker)
  );

  return nextTracker.count;
}

function getContextLine(dailyStats: DailyStats | null): string {
  if (dailyStats?.dailyCardGoalMet && dailyStats.cardsReviewed > 0) {
    return `Goal hit. You've reviewed all ${dailyStats.cardsReviewed} cards for today.`;
  }

  if (dailyStats?.streakDay && dailyStats.streakDay > 0) {
    return `Day ${dailyStats.streakDay} streak. Keep it going.`;
  }

  if (
    dailyStats &&
    dailyStats.cardsReviewed > 0 &&
    dailyStats.pomodoroSessions === 0
  ) {
    return `You've reviewed ${dailyStats.cardsReviewed} cards. Start a focus session?`;
  }

  return "Ready to start today's session?";
}

export function UserGreeting({ displayName, dailyStats }: UserGreetingProps) {
  const [visitCount, setVisitCount] = useState(1);
  const [resolvedDisplayName, setResolvedDisplayName] = useState(displayName);

  useEffect(() => {
    setVisitCount(trackSameDayVisit());

    const storedDisplayName = readSettingsProfile().display_name?.trim();
    if (storedDisplayName) {
      setResolvedDisplayName(storedDisplayName);
    }
  }, []);

  const salutation = getSalutation();
  const headingLead = visitCount > 1 ? 'Welcome back' : salutation;
  const mobileDisplayName = truncateForMobile(resolvedDisplayName);
  const contextLine = getContextLine(dailyStats);

  return (
    <section className="flex min-h-[72px] flex-col justify-center gap-1 rounded-2xl border border-border/60 bg-background/20 px-4 py-4 sm:min-h-[80px] sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        <span className="sm:hidden">{`${headingLead}, ${mobileDisplayName}`}</span>
        <span className="hidden sm:inline">{`${headingLead}, ${resolvedDisplayName}`}</span>
      </h1>
      <p className="text-sm text-muted-foreground">{contextLine}</p>
    </section>
  );
}
