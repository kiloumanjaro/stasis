import { BellOff, Clock } from 'lucide-react';
import { OptionCard } from './shared';

interface StepTimerVisibilityProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
}

export function StepTimerVisibility({
  value,
  onChange,
}: StepTimerVisibilityProps) {
  return (
    <div className="space-y-3">
      <OptionCard
        id="timer-visible"
        icon={<Clock className="h-4 w-4" />}
        title="Show Timer"
        description="The Pomodoro countdown is visible on screen during study sessions."
        selected={value === true}
        onClick={() => onChange(true)}
      />
      <OptionCard
        id="timer-hidden"
        icon={<BellOff className="h-4 w-4" />}
        title="Hide Timer"
        description="The timer runs silently. You'll receive a notification when the interval ends."
        selected={value === false}
        onClick={() => onChange(false)}
      />
    </div>
  );
}
