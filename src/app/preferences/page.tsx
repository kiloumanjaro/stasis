'use client';

import { PreferenceQuestionnaire } from '@/components/preferences/PreferenceQuestionnaire';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function PreferencesPage() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <PreferenceQuestionnaire />
      </div>

      <form
        action="/auth/logout"
        method="post"
        className="fixed bottom-4 right-4 z-20"
      >
        <Button variant="ghost" size="icon" type="submit" title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
