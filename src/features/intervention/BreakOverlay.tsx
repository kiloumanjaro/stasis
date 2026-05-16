'use client';

import { useEffect, useRef, useState } from 'react';
import { Coffee, Moon, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InterventionTrigger } from './useIntervention';

const SHORT_BREAK_TIPS = [
  'Look at something 20 feet away for 20 seconds. Your eyes will thank you.',
  'Stand up, roll your shoulders, sit back down. Three seconds well spent.',
  'Take 3 slow deep breaths. In through the nose, out through the mouth.',
  'Drink some water. Dehydration tanks focus faster than you think.',
  'Close your eyes for 10 seconds. Let your brain defrag.',
];

const LONG_BREAK_TIPS = [
  'Step away from the screen. Walk to another room — even briefly.',
  'Do a quick stretch: neck rolls, wrist circles, torso twist.',
  'Splash cold water on your face. Instant refresh.',
  'Grab a snack. Your brain runs on glucose.',
  'Look outside if you can. Natural light resets your circadian rhythm.',
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface BreakOverlayProps {
  intervention: InterventionTrigger;
  onComplete: () => void;
  onSkip: () => void;
}

export function BreakOverlay({
  intervention,
  onComplete,
  onSkip,
}: BreakOverlayProps) {
  const isLong = intervention.action === 'LONG_BREAK';
  const totalSeconds =
    intervention.duration > 0 ? intervention.duration : isLong ? 900 : 300;

  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tips = isLong ? LONG_BREAK_TIPS : SHORT_BREAK_TIPS;
  const [tip] = useState(() => tips[Math.floor(Math.random() * tips.length)]!);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onComplete]);

  const progress = 1 - remaining / totalSeconds;

  const circumference = 2 * Math.PI * 54; // r=54
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#1a1a18]/95 backdrop-blur-sm">
      {/* Icon + label */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className={cn(
            'flex size-14 items-center justify-center rounded-full',
            isLong ? 'bg-purple-500/15' : 'bg-blue-500/15'
          )}
        >
          {isLong ? (
            <Moon size={28} className="text-purple-400" />
          ) : (
            <Coffee size={28} className="text-blue-400" />
          )}
        </div>
        <h2 className="text-2xl font-semibold text-white">
          {isLong ? 'Long Break' : 'Short Break'}
        </h2>
        <p className="text-sm text-[#8a8a86]">{intervention.reason}</p>
      </div>

      {/* Circular countdown */}
      <div className="relative mb-8 flex items-center justify-center">
        <svg width="128" height="128" className="-rotate-90">
          {/* Track */}
          <circle
            cx="64"
            cy="64"
            r="54"
            fill="none"
            stroke="#3a3a38"
            strokeWidth="6"
          />
          {/* Progress */}
          <circle
            cx="64"
            cy="64"
            r="54"
            fill="none"
            stroke={isLong ? '#a78bfa' : '#60a5fa'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="absolute font-mono text-3xl font-semibold text-white">
          {formatTime(remaining)}
        </span>
      </div>

      {/* Tip */}
      <div className="mb-10 max-w-xs rounded-lg border border-[#3a3a38] bg-[#252523] px-5 py-4 text-center">
        <p className="text-sm leading-relaxed text-[#b0b0ac]">{tip}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSkip}
          className="flex items-center gap-2 rounded-md border border-[#4a4a46] bg-transparent px-4 py-2 text-sm text-[#8a8a86] transition-colors hover:border-[#6a6a66] hover:text-[#c0c0bc]"
        >
          <SkipForward size={14} />
          Skip break
        </button>
        <button
          onClick={onComplete}
          className={cn(
            'rounded-md px-5 py-2 text-sm font-medium text-white transition-colors',
            isLong
              ? 'bg-purple-600 hover:bg-purple-500'
              : 'bg-blue-600 hover:bg-blue-500'
          )}
        >
          I&apos;m refreshed
        </button>
      </div>
    </div>
  );
}
