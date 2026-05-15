import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

interface OptionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  disabledNote?: string;
  onClick: () => void;
  id: string;
}

export function OptionCard({
  icon,
  title,
  description,
  selected,
  disabled,
  disabledNote,
  onClick,
  id,
}: OptionCardProps) {
  return (
    <Card
      id={id}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'cursor-pointer transition-all duration-200',
        selected
          ? 'border-[#7C6FF7]/60 bg-[#7C6FF7]/[0.08] shadow-[0_0_0_1px_rgba(124,111,247,0.15)]'
          : disabled
            ? 'cursor-not-allowed border-[#1E1E26] bg-[#0f0f12] opacity-50'
            : 'border-[#2A2A35] bg-[#131316] hover:border-[#3A3A48] hover:bg-[#171719]'
      )}
    >
      <CardContent className="flex gap-3.5 p-4">
        <div
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
            selected
              ? 'bg-[#7C6FF7]/20 text-[#7C6FF7]'
              : 'bg-[#1C1C22] text-[#5A5A72]'
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-[13px] font-medium transition-colors duration-200',
              selected ? 'text-[#EAEAF0]' : 'text-[#BBBBC8]'
            )}
          >
            {title}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[#6E6E82]">
            {description}
          </p>
          {disabled && disabledNote && (
            <p className="mt-1 text-[11px] italic text-[#5A5A72]">
              {disabledNote}
            </p>
          )}
        </div>
        <div
          className={cn(
            'mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
            selected
              ? 'border-[#7C6FF7] bg-[#7C6FF7]'
              : 'border-[#3A3A48] bg-transparent'
          )}
        >
          {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
      </CardContent>
    </Card>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  id: string;
}

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  id,
}: SliderFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-[13px] font-medium text-[#9090A8]">
          {label}
        </Label>
        <Badge
          variant="secondary"
          className="rounded-md bg-[#1C1C22] px-2.5 py-0.5 text-[13px] font-semibold tabular-nums text-[#EAEAF0]"
        >
          {value} {unit}
        </Badge>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
      />
      <div className="flex justify-between text-[11px] text-[#5A5A72]">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}
