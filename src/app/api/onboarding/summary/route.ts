import { getBackendUser } from '@/lib/backend-auth';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const user = await getBackendUser(request.headers.get('cookie') ?? '');

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      'focus_goal_minutes, break_duration_minutes, daily_goal_cards, cv_monitoring_enabled'
    )
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
