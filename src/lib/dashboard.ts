import { getAuthenticatedBackendUser } from '@/lib/backend-auth-server';

export interface DailyStats {
  cardsReviewed: number;
  pomodoroSessions: number;
  streakDay: number | null;
  dailyCardGoal: number | null;
  dailyCardGoalMet: boolean;
}

export interface DashboardGreetingData {
  displayName: string;
  dailyStats: DailyStats | null;
}

function getEmailPrefix(email: string | null | undefined): string {
  if (!email) {
    return 'there';
  }

  const [prefix] = email.split('@');
  return prefix?.trim() || 'there';
}

export async function getDashboardGreetingData(): Promise<DashboardGreetingData> {
  const user = await getAuthenticatedBackendUser();

  if (!user) {
    return {
      displayName: 'there',
      dailyStats: null,
    };
  }

  return {
    displayName: user.name?.trim() || getEmailPrefix(user.email),
    dailyStats: null,
  };
}
