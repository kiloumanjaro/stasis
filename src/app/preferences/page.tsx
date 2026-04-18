'use client';

import { PreferenceQuestionnaire } from '@/components/preferences/PreferenceQuestionnaire';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import LightRays from '@/components/LightRays';
import { useState } from 'react';

export default function PreferencesPage() {
  const [raysColor, setRaysColor] = useState('#ffffff');

  return (
    <div className="relative min-h-screen">
      {/* Background LightRays */}
      <div className="fixed inset-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor={raysColor}
          raysSpeed={1}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>

      {/* Questionnaire - on top of background */}
      <div className="relative z-10">
        <PreferenceQuestionnaire onColorChange={setRaysColor} />
      </div>

      {/* Sign-out button - on top of everything */}
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
