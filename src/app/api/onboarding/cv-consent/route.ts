import { getBackendUser } from '@/lib/backend-auth';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const user = await getBackendUser(request.headers.get('cookie') ?? '');

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const { enabled }: { enabled: boolean } = await request.json();

  const { error } = await supabase
    .from('user_profiles')
    .upsert({ id: user.id, cv_monitoring_enabled: enabled });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
