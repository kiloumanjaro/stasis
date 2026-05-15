import type { ReactNode } from 'react';
import {
  Activity,
  Camera,
  CheckCircle,
  Clock,
  Coffee,
  Heart,
  Shield,
  Timer,
} from 'lucide-react';
import { BREAK_LABELS, EXPRESSION_LABELS, PRIVACY_LABELS } from './constants';
import type { SummaryPreferences } from './types';

interface StepSummaryProps {
  preferences: SummaryPreferences;
}

export function StepSummary({ preferences }: StepSummaryProps) {
  const rows: Array<{
    icon: ReactNode;
    label: string;
    value: string;
    accent?: boolean;
  }> = [
    {
      icon: <Camera className="h-3.5 w-3.5" />,
      label: 'Camera privacy',
      value: PRIVACY_LABELS[preferences.privacy_comfort ?? 'visible'],
      accent: preferences.privacy_comfort !== 'off',
    },
    {
      icon: <Activity className="h-3.5 w-3.5" />,
      label: 'Expression tolerance',
      value: EXPRESSION_LABELS[preferences.expression_tolerance ?? 'neutral'],
    },
    {
      icon: <Timer className="h-3.5 w-3.5" />,
      label: 'Study block',
      value: `${preferences.study_block_length ?? 25} min`,
    },
    {
      icon: <Coffee className="h-3.5 w-3.5" />,
      label: 'Mini breaks',
      value: `${preferences.mini_breaks_per_session ?? 2} per session`,
    },
    {
      icon: <Heart className="h-3.5 w-3.5" />,
      label: 'Recovery window',
      value: `${preferences.recovery_duration ?? 10} min`,
    },
    {
      icon: <Shield className="h-3.5 w-3.5" />,
      label: 'Break mechanic',
      value: BREAK_LABELS[preferences.break_mechanic ?? 'relaxed'],
    },
    {
      icon: <Clock className="h-3.5 w-3.5" />,
      label: 'Timer visibility',
      value: preferences.show_timer ? 'Visible' : 'Hidden',
    },
  ];

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2A2A35] bg-[#1C1C22]">
          <CheckCircle className="h-6 w-6 text-[#7C6FF7]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#EAEAF0]">
            You&apos;re all set
          </h1>
          <p className="text-sm text-[#9090A8]">
            Here&apos;s a summary of your setup.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#2A2A35] bg-[#131316] p-6">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-[#5A5A72]">
          Configuration
        </p>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] text-[#9090A8]">
                {row.icon}
                {row.label}
              </div>
              <span
                className={`text-[13px] font-medium ${
                  row.accent === false ? 'text-[#5A5A72]' : 'text-[#EAEAF0]'
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
