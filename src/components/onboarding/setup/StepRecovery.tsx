import { Heart } from 'lucide-react';
import { SliderField } from './shared';
import { Card, CardContent } from '@/components/ui/card';

interface StepRecoveryProps {
  value: number;
  onChange: (value: number) => void;
}

export function StepRecovery({ value, onChange }: StepRecoveryProps) {
  return (
    <Card className="border-[#2A2A35] bg-[#131316]">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center gap-2 text-[#7C6FF7]">
          <Heart className="h-4 w-4" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-[#5A5A72]">
            Cooldown Period
          </span>
        </div>

        <p className="text-[12px] leading-relaxed text-[#6E6E82]">
          After the emotion model detects frustration, the app enters a cooldown
          period and won&apos;t re-prompt or nag you. Set how long that window
          lasts.
        </p>

        <SliderField
          id="recovery-duration"
          label="Recovery duration"
          value={value}
          min={3}
          max={30}
          step={1}
          unit="min"
          onChange={onChange}
        />
      </CardContent>
    </Card>
  );
}
