import { Sofa, UserCheck } from 'lucide-react';
import { OptionCard } from './shared';
import type { BreakMechanic } from './types';

interface StepBreakMechanicProps {
  value: BreakMechanic | null;
  onChange: (value: BreakMechanic) => void;
  cameraOff: boolean;
}

export function StepBreakMechanic({
  value,
  onChange,
  cameraOff,
}: StepBreakMechanicProps) {
  const effectiveValue = cameraOff ? 'relaxed' : value;

  return (
    <div className="space-y-3">
      <OptionCard
        id="break-relaxed"
        icon={<Sofa className="h-4 w-4" />}
        title="Relaxed"
        description="The break timer begins immediately when the study interval ends. No camera check is performed."
        selected={effectiveValue === 'relaxed'}
        onClick={() => onChange('relaxed')}
      />
      <OptionCard
        id="break-accountable"
        icon={<UserCheck className="h-4 w-4" />}
        title="Accountable"
        description="The break timer doesn't start until the camera confirms you've left the frame. Once you step away, the countdown begins."
        selected={effectiveValue === 'accountable'}
        onClick={() => onChange('accountable')}
        disabled={cameraOff}
        disabledNote="Requires camera to be enabled"
      />
    </div>
  );
}
