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
  pictureUrl: string | null;
  dailyStats: DailyStats | null;
}

function getEmailPrefix(email: string | null | undefined): string {
  if (!email) {
    return 'Learner';
  }

  const [prefix] = email.split('@');
  return prefix?.trim() || 'Learner';
}

export async function getDashboardGreetingData(): Promise<DashboardGreetingData> {
  const user = await getAuthenticatedBackendUser();

  if (!user) {
    return {
      displayName: 'Learner',
      pictureUrl: null,
      dailyStats: null,
    };
  }

  return {
    displayName: user.name?.trim() || getEmailPrefix(user.email),
    pictureUrl: user.pictureUrl?.trim() || null,
    dailyStats: null,
  };
}
