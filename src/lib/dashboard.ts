import type { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';

type DashboardRow = Record<string, unknown>;
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type SupabaseQueryError = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

const PROFILE_TABLES = ['user_profiles', 'profiles'] as const;
const DAILY_STATS_TABLE = 'daily_stats';

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

function hasConfiguredSupabaseConnection(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return false;
  }

  const invalidValues = new Set([
    'your-supabase-project-url',
    'your-supabase-anon-key',
    'mock-anon-key',
  ]);

  return !invalidValues.has(url.toLowerCase()) && !invalidValues.has(anonKey);
}

function readString(
  row: DashboardRow | null | undefined,
  keys: readonly string[]
): string | null {
  if (!row) {
    return null;
  }

  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return null;
}

function readNumber(
  row: DashboardRow | null | undefined,
  keys: readonly string[]
): number | null {
  if (!row) {
    return null;
  }

  for (const key of keys) {
    const value = row[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readBoolean(
  row: DashboardRow | null | undefined,
  keys: readonly string[]
): boolean | null {
  if (!row) {
    return null;
  }

  for (const key of keys) {
    const value = row[key];

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      if (value === 'true') {
        return true;
      }

      if (value === 'false') {
        return false;
      }
    }
  }

  return null;
}

function getEmailPrefix(email: string | null | undefined): string {
  if (!email) {
    return 'there';
  }

  const [prefix] = email.split('@');
  return prefix?.trim() || 'there';
}

function getDisplayName(user: User, profileRow: DashboardRow | null): string {
  const metadata =
    user.user_metadata && typeof user.user_metadata === 'object'
      ? (user.user_metadata as DashboardRow)
      : null;

  return (
    readString(profileRow, ['display_name', 'full_name']) ||
    readString(metadata, ['display_name', 'full_name', 'name']) ||
    getEmailPrefix(user.email)
  );
}

function getTodayKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function normalizeDailyStats(row: DashboardRow | null): DailyStats | null {
  if (!row) {
    return null;
  }

  const cardsReviewed =
    readNumber(row, [
      'cards_reviewed',
      'cardsReviewed',
      'reviewed_cards',
      'review_count',
    ]) ?? 0;

  const pomodoroSessions =
    readNumber(row, [
      'pomodoro_sessions',
      'pomodoroSessions',
      'focus_sessions',
      'sessions_completed',
    ]) ?? 0;

  const streakDay = readNumber(row, [
    'streak_day',
    'streakDay',
    'current_streak_day',
    'current_streak',
  ]);

  const dailyCardGoal = readNumber(row, [
    'daily_card_goal',
    'dailyCardGoal',
    'card_goal',
    'goal_cards',
  ]);

  const goalFlag = readBoolean(row, [
    'goal_met',
    'goalMet',
    'daily_card_goal_met',
    'dailyGoalMet',
  ]);

  return {
    cardsReviewed,
    pomodoroSessions,
    streakDay,
    dailyCardGoal,
    dailyCardGoalMet:
      goalFlag ??
      (dailyCardGoal !== null ? cardsReviewed >= dailyCardGoal : false),
  };
}

function isIgnorableOptionalQueryError(
  error: SupabaseQueryError | null
): boolean {
  if (!error) {
    return false;
  }

  if (error.code === 'PGRST116') {
    return true;
  }

  const message = [error.message, error.details, error.hint]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  if (!message) {
    return true;
  }

  return (
    message.includes('fetch failed') ||
    message.includes('econnrefused') ||
    message.includes('connect multiple') ||
    message.includes('does not exist') ||
    message.includes('could not find') ||
    message.includes('relation') ||
    message.includes('schema cache')
  );
}

async function getProfileRow(
  supabase: SupabaseServerClient,
  userId: string
): Promise<DashboardRow | null> {
  for (const [index, table] of PROFILE_TABLES.entries()) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error) {
      return (data as DashboardRow | null) ?? null;
    }

    if (error.code === 'PGRST116') {
      return null;
    }

    const isLastAttempt = index === PROFILE_TABLES.length - 1;
    if (isLastAttempt) {
      console.error(`Error fetching profile from ${table}:`, error);
    }
  }

  return null;
}

async function getDailyStats(
  supabase: SupabaseServerClient,
  userId: string
): Promise<DailyStats | null> {
  const today = getTodayKey();

  const { data, error } = await supabase
    .from(DAILY_STATS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (error) {
    if (!isIgnorableOptionalQueryError(error)) {
      console.error('Error fetching daily stats:', error);
    }
    return null;
  }

  return normalizeDailyStats((data as DashboardRow | null) ?? null);
}

export async function getDashboardGreetingData(): Promise<DashboardGreetingData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      displayName: 'there',
      dailyStats: null,
    };
  }

  if (!hasConfiguredSupabaseConnection()) {
    return {
      displayName: getDisplayName(user, null),
      dailyStats: null,
    };
  }

  const [profileRow, dailyStats] = await Promise.all([
    getProfileRow(supabase, user.id),
    getDailyStats(supabase, user.id),
  ]);

  return {
    displayName: getDisplayName(user, profileRow),
    dailyStats,
  };
}
