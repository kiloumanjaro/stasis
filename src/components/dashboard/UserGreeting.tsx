'use client';

import { useEffect, useState } from 'react';

import type { DailyStats } from '@/lib/dashboard';
import { readSettingsProfile } from '@/lib/frontend-store';

interface UserGreetingProps {
  displayName: string;
  pictureUrl: string | null;
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

function getFirstName(displayName: string): string {
  const [firstName] = displayName.trim().split(/\s+/).filter(Boolean);
  return firstName || 'Learner';
}

function resolveDisplayName(
  baseDisplayName: string,
  storedDisplayName?: string | null
) {
  const stored = storedDisplayName?.trim();
  if (stored) {
    return stored;
  }

  const base = baseDisplayName.trim();
  if (base) {
    return base;
  }

  return 'Learner';
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return 'S';
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
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

function getContextLine(
  resolvedDisplayName: string,
  dailyStats: DailyStats | null
): string {
  if (dailyStats?.dailyCardGoalMet && dailyStats.cardsReviewed > 0) {
    return `${resolvedDisplayName}, you've already completed all ${dailyStats.cardsReviewed} cards for today.`;
  }

  if (dailyStats?.streakDay && dailyStats.streakDay > 0) {
    return `${resolvedDisplayName}, you're on a ${dailyStats.streakDay}-day streak.`;
  }

  if (
    dailyStats &&
    dailyStats.cardsReviewed > 0 &&
    dailyStats.pomodoroSessions === 0
  ) {
    return `${resolvedDisplayName}, you've reviewed ${dailyStats.cardsReviewed} cards so far. Ready for a focus session?`;
  }

  return `${resolvedDisplayName}, ready to start today's session?`;
}

export function UserGreeting({
  displayName,
  pictureUrl,
  dailyStats,
}: UserGreetingProps) {
  const [visitCount, setVisitCount] = useState(1);
  const [resolvedDisplayName, setResolvedDisplayName] = useState(
    resolveDisplayName(displayName)
  );

  useEffect(() => {
    setVisitCount(trackSameDayVisit());

    const storedDisplayName = readSettingsProfile().display_name;
    setResolvedDisplayName(resolveDisplayName(displayName, storedDisplayName));
  }, [displayName]);

  const salutation = getSalutation();
  const headingLead = visitCount > 1 ? 'Welcome back' : salutation;
  const firstName = getFirstName(resolvedDisplayName);
  const mobileDisplayName = truncateForMobile(firstName);
  const contextLine = getContextLine(firstName, dailyStats);
  const initials = getInitials(resolvedDisplayName);

  return (
    <section className="flex min-h-[72px] flex-col justify-center gap-3 px-1 py-2 sm:min-h-[88px] sm:px-2">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {`${headingLead},`}
        </h1>
        <p className="text-3xl font-semibold tracking-tight text-foreground sm:hidden sm:text-4xl">
          {mobileDisplayName}
        </p>
        <p className="hidden text-3xl font-semibold tracking-tight text-foreground sm:block sm:text-4xl">
          {firstName}
        </p>
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-foreground/90 sm:h-12 sm:w-12">
          {pictureUrl ? (
            <img
              src={pictureUrl}
              alt={`${resolvedDisplayName} profile`}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </div>
      <p className="text-base text-muted-foreground sm:text-lg">
        {contextLine}
      </p>
    </section>
  );
}
