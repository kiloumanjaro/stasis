import { Eye, EyeOff, VideoOff } from 'lucide-react';
import { OptionCard } from './shared';
import type { PrivacyComfort } from './types';

interface StepPrivacyProps {
  value: PrivacyComfort | null;
  onChange: (value: PrivacyComfort) => void;
}

export function StepPrivacy({ value, onChange }: StepPrivacyProps) {
  return (
    <div className="space-y-3">
      <OptionCard
        id="privacy-visible"
        icon={<Eye className="h-4 w-4" />}
        title="Visible"
        description="Camera feed shown in a corner overlay during study mode. Emotion detection runs."
        selected={value === 'visible'}
        onClick={() => onChange('visible')}
      />
      <OptionCard
        id="privacy-hidden"
        icon={<EyeOff className="h-4 w-4" />}
        title="Hidden"
        description="Camera feed is hidden once study mode activates, but emotion detection still runs in the background."
        selected={value === 'hidden'}
        onClick={() => onChange('hidden')}
      />
      <OptionCard
        id="privacy-off"
        icon={<VideoOff className="h-4 w-4" />}
        title="Off"
        description="Camera is disabled entirely. All computer vision features (emotion detection, break accountability) are skipped."
        selected={value === 'off'}
        onClick={() => onChange('off')}
      />
    </div>
  );
}
