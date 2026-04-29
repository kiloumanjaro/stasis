import { getBackendUser } from '@/lib/backend-auth';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type OnboardingCheckRequest = {
  currentPath?: string;
};

export async function POST(request: Request) {
  const user = await getBackendUser(request.headers.get('cookie') ?? '');

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const body = (await request
    .json()
    .catch(() => ({}))) as OnboardingCheckRequest;
  const currentPath = body.currentPath ?? '';

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const redirectPath =
    !profile?.onboarding_completed && !currentPath.startsWith('/onboarding')
      ? '/onboarding/welcome'
      : null;

  return NextResponse.json({ redirectPath });
}
