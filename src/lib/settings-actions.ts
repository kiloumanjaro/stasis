'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

export type DefaultCardSort = 'due_date' | 'difficulty' | 'random';
export type GazeSensitivity = 'low' | 'medium' | 'high';
export type CompletionSound = 'none' | 'soft_chime' | 'bell';

export interface SettingsProfile {
  id?: string;
  email?: string | null;
  display_name?: string | null;
  focus_goal_minutes?: number | null;
  break_duration_minutes?: number | null;
  long_break_duration_minutes?: number | null;
  daily_goal_cards?: number | null;
  default_card_sort?: DefaultCardSort | null;
  shortcuts_enabled?: boolean | null;
  cv_monitoring_enabled?: boolean | null;
  burnout_threshold_minutes?: number | null;
  gaze_sensitivity?: GazeSensitivity | null;
  heatmap_range_days?: 30 | 60 | 90 | null;
  card_animation_enabled?: boolean | null;
  completion_sound?: CompletionSound | null;
  reminder_enabled?: boolean | null;
  reminder_time?: string | null;
}

type SettingsErrorReason = 'unauthenticated' | 'profile_error';

interface SettingsDefaults {
  focus_goal_minutes: number;
  break_duration_minutes: number;
  long_break_duration_minutes: number;
  daily_goal_cards: number;
  default_card_sort: DefaultCardSort;
  shortcuts_enabled: boolean;
  cv_monitoring_enabled: boolean;
  burnout_threshold_minutes: number;
  gaze_sensitivity: GazeSensitivity;
  heatmap_range_days: 30 | 60 | 90;
  card_animation_enabled: boolean;
  completion_sound: CompletionSound;
  reminder_enabled: boolean;
  reminder_time: string;
}

const DEFAULT_SETTINGS: SettingsDefaults = {
  focus_goal_minutes: 25,
  break_duration_minutes: 5,
  long_break_duration_minutes: 20,
  daily_goal_cards: 20,
  default_card_sort: 'due_date',
  shortcuts_enabled: true,
  cv_monitoring_enabled: false,
  burnout_threshold_minutes: 10,
  gaze_sensitivity: 'medium',
  heatmap_range_days: 30,
  card_animation_enabled: true,
  completion_sound: 'soft_chime',
  reminder_enabled: false,
  reminder_time: '08:00',
};

const REMINDER_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

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

function normalizeDisplayName(value: string | null | undefined): string {
  return (value ?? '').trim().slice(0, 40);
}

async function syncDisplayName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string | null },
  displayName: string | null | undefined
) {
  const trimmed = normalizeDisplayName(displayName);
  const normalized = trimmed.length > 0 ? trimmed : null;

  const { error: legacyError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      full_name: normalized,
      email: user.email ?? null,
    },
    { onConflict: 'id' }
  );

  if (legacyError) {
    console.error('Failed to update legacy profile display name:', legacyError);
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      name: normalized,
      full_name: normalized,
      display_name: normalized,
    },
  });

  if (metadataError) {
    console.error(
      'Failed to update auth metadata display name:',
      metadataError
    );
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return clamp(Math.round(parsed), min, max);
}

function toBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeSettings(input: SettingsProfile): SettingsProfile {
  return {
    display_name: input.display_name?.slice(0, 40) ?? null,
    focus_goal_minutes: toNumber(
      input.focus_goal_minutes,
      DEFAULT_SETTINGS.focus_goal_minutes,
      5,
      120
    ),
    break_duration_minutes: toNumber(
      input.break_duration_minutes,
      DEFAULT_SETTINGS.break_duration_minutes,
      1,
      30
    ),
    long_break_duration_minutes: toNumber(
      input.long_break_duration_minutes,
      DEFAULT_SETTINGS.long_break_duration_minutes,
      10,
      60
    ),
    daily_goal_cards: toNumber(
      input.daily_goal_cards,
      DEFAULT_SETTINGS.daily_goal_cards,
      5,
      200
    ),
    default_card_sort:
      input.default_card_sort === 'difficulty' ||
      input.default_card_sort === 'random'
        ? input.default_card_sort
        : 'due_date',
    shortcuts_enabled: toBoolean(
      input.shortcuts_enabled,
      DEFAULT_SETTINGS.shortcuts_enabled
    ),
    cv_monitoring_enabled: toBoolean(
      input.cv_monitoring_enabled,
      DEFAULT_SETTINGS.cv_monitoring_enabled
    ),
    burnout_threshold_minutes: toNumber(
      input.burnout_threshold_minutes,
      DEFAULT_SETTINGS.burnout_threshold_minutes,
      5,
      20
    ),
    gaze_sensitivity:
      input.gaze_sensitivity === 'low' || input.gaze_sensitivity === 'high'
        ? input.gaze_sensitivity
        : 'medium',
    heatmap_range_days:
      input.heatmap_range_days === 60 || input.heatmap_range_days === 90
        ? input.heatmap_range_days
        : 30,
    card_animation_enabled: toBoolean(
      input.card_animation_enabled,
      DEFAULT_SETTINGS.card_animation_enabled
    ),
    completion_sound:
      input.completion_sound === 'none' || input.completion_sound === 'bell'
        ? input.completion_sound
        : 'soft_chime',
    reminder_enabled: toBoolean(
      input.reminder_enabled,
      DEFAULT_SETTINGS.reminder_enabled
    ),
    reminder_time: REMINDER_TIME_PATTERN.test(input.reminder_time ?? '')
      ? input.reminder_time
      : DEFAULT_SETTINGS.reminder_time,
  };
}

function buildDefaultProfileForUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: { name?: string };
}): SettingsProfile {
  return {
    ...DEFAULT_SETTINGS,
    id: user.id,
    email: user.email ?? null,
    display_name: user.user_metadata?.name ?? null,
  };
}

async function fetchUserProfileRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  return await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: 'User is not authenticated.' };
  }

  return { supabase, user, error: null };
}

export async function getSettingsProfile() {
  const { supabase, user, error } = await getAuthenticatedUser();

  if (!user || error) {
    return {
      ok: false,
      reason: 'unauthenticated' as SettingsErrorReason,
      message: error,
      profile: null as SettingsProfile | null,
    };
  }

  if (!hasConfiguredSupabaseConnection()) {
    return {
      ok: true,
      reason: null as SettingsErrorReason | null,
      message: null,
      profile: buildDefaultProfileForUser(user),
    };
  }

  const { data, error: profileError } = await fetchUserProfileRow(
    supabase,
    user.id
  );

  if (profileError) {
    return {
      ok: false,
      reason: 'profile_error' as SettingsErrorReason,
      message: profileError.message,
      profile: buildDefaultProfileForUser(user),
    };
  }

  const base = (data ?? {}) as Partial<SettingsProfile>;
  const profile: SettingsProfile = {
    ...DEFAULT_SETTINGS,
    ...base,
    id: user.id,
    email: user.email ?? null,
    display_name:
      (base?.display_name as string | undefined) ??
      user.user_metadata?.name ??
      null,
  };

  return {
    ok: true,
    reason: null as SettingsErrorReason | null,
    message: null,
    profile,
  };
}

export async function saveSettingsProfile(input: SettingsProfile) {
  const { supabase, user, error } = await getAuthenticatedUser();

  if (!user || error) {
    return { ok: false, message: error };
  }

  if (!hasConfiguredSupabaseConnection()) {
    return {
      ok: false,
      message: 'Settings storage is unavailable. Configure Supabase to save.',
    };
  }

  const { data: existingData, error: existingError } =
    await fetchUserProfileRow(supabase, user.id);

  if (existingError) {
    return { ok: false, message: existingError.message };
  }

  const existing = (existingData ?? {}) as Partial<SettingsProfile>;
  const merged: SettingsProfile = {
    ...DEFAULT_SETTINGS,
    ...existing,
    ...input,
    id: user.id,
    email: user.email ?? existing.email ?? null,
    display_name:
      input.display_name ??
      existing.display_name ??
      user.user_metadata?.name ??
      null,
  };

  const normalized = normalizeSettings(merged);

  const payload = {
    id: user.id,
    ...normalized,
    email: user.email ?? existing.email ?? null,
  };

  const { error: upsertError } = await supabase
    .from('user_profiles')
    .upsert(payload, { onConflict: 'id' });

  if (upsertError) {
    return { ok: false, message: upsertError.message };
  }

  await syncDisplayName(supabase, user, normalized.display_name);

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  revalidatePath('/pomodoro');

  return {
    ok: true,
    message: 'Settings updated successfully.',
  };
}

export async function updateDisplayNameAction(displayName: string) {
  const trimmed = normalizeDisplayName(displayName);

  const { supabase, user, error } = await getAuthenticatedUser();

  if (!user || error) {
    return { ok: false, message: error };
  }

  if (!hasConfiguredSupabaseConnection()) {
    return {
      ok: false,
      message: 'Settings storage is unavailable. Configure Supabase to save.',
    };
  }

  const { error: upsertError } = await supabase.from('user_profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      display_name: trimmed,
    },
    { onConflict: 'id' }
  );

  if (upsertError) {
    return { ok: false, message: upsertError.message };
  }

  await syncDisplayName(supabase, user, trimmed);

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  revalidatePath('/pomodoro');

  return { ok: true, message: 'Display name updated.' };
}

export async function updatePasswordAction(nextPassword: string) {
  const password = nextPassword ?? '';
  if (password.length < 8) {
    return {
      ok: false,
      message: 'Password must be at least 8 characters long.',
    };
  }

  const { supabase, user, error } = await getAuthenticatedUser();

  if (!user || error) {
    return { ok: false, message: error };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  return { ok: true, message: 'Password changed successfully.' };
}

export async function exportUserDataAction() {
  const { supabase, user, error } = await getAuthenticatedUser();

  if (!user || error) {
    return {
      ok: false,
      message: error,
      data: null as Record<string, unknown> | null,
    };
  }

  const tables = [
    'flashcards',
    'review_logs',
    'pomodoro_sessions',
    'daily_stats',
  ];
  const exportData: Record<string, unknown> = {
    user_id: user.id,
    exported_at: new Date().toISOString(),
  };

  for (const table of tables) {
    const { data, error: tableError } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', user.id);

    exportData[table] = tableError ? [] : (data ?? []);
  }

  return {
    ok: true,
    message: 'Export prepared.',
    data: exportData,
  };
}

export async function deleteAccountAction() {
  const { supabase, user, error } = await getAuthenticatedUser();

  if (!user || error) {
    return { ok: false, message: error };
  }

  const tablesWithUserId = [
    'review_logs',
    'pomodoro_sessions',
    'daily_stats',
    'flashcards',
  ];

  for (const table of tablesWithUserId) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq('user_id', user.id);

    if (deleteError && deleteError.code !== 'PGRST116') {
      return {
        ok: false,
        message: `Failed to delete ${table}: ${deleteError.message}`,
      };
    }
  }

  const { error: profileDeleteError } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', user.id);

  if (profileDeleteError && profileDeleteError.code !== 'PGRST116') {
    return { ok: false, message: profileDeleteError.message };
  }

  const { error: legacyProfileDeleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (
    legacyProfileDeleteError &&
    legacyProfileDeleteError.code !== 'PGRST116'
  ) {
    return { ok: false, message: legacyProfileDeleteError.message };
  }

  const { error: signOutError } = await supabase.auth.signOut();

  if (signOutError) {
    return { ok: false, message: signOutError.message };
  }

  return {
    ok: true,
    message: 'Your account data was deleted and you have been signed out.',
  };
}
