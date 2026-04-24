import type { DailyStats } from '@/lib/dashboard';

interface UserGreetingProps {
  displayName: string;
  dailyStats: DailyStats | null;
}

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
  const salutation = getSalutation();
  const mobileDisplayName = truncateForMobile(displayName);
  const contextLine = getContextLine(dailyStats);

  return (
    <section className="flex min-h-[72px] flex-col justify-center gap-1 rounded-2xl border border-border/60 bg-background/20 px-4 py-4 sm:min-h-[80px] sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        <span className="sm:hidden">{`${salutation}, ${mobileDisplayName}`}</span>
        <span className="hidden sm:inline">{`${salutation}, ${displayName}`}</span>
      </h1>
      <p className="text-sm text-muted-foreground">{contextLine}</p>
    </section>
  );
}
