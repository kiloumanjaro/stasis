import { redirect } from 'next/navigation';

import { SettingsContent } from '@/components/settings/SettingsContent';
import { getSettingsProfile } from '@/lib/settings-actions';

export default async function SettingsPage() {
  const result = await getSettingsProfile();

  if (!result.ok && result.reason === 'unauthenticated') {
    redirect('/auth/sign-up');
  }

  if (!result.profile) {
    redirect('/dashboard');
  }

  return <SettingsContent initialProfile={result.profile} />;
}
