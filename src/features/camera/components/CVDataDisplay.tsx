'use client';

import { cn } from '@/lib/utils';
import { Focus, HelpCircle, Minus, Eye, EyeOff } from 'lucide-react';
import type { CVResponse } from '../types';

interface CVDataDisplayProps {
  data: CVResponse | null;
  className?: string;
}

/** Compact emotion config — icon + color, no emojis */
const EMOTION_CONFIG: Record<
  string,
  {
    icon: typeof Focus;
    label: string;
    color: string;
    dotColor: string;
  }
> = {
  focused: {
    icon: Focus,
    label: 'Focused',
    color: 'text-green-500',
    dotColor: 'bg-green-500',
  },
  distracted: {
    icon: Eye,
    label: 'Distracted',
    color: 'text-yellow-500',
    dotColor: 'bg-yellow-500',
  },
  tired: {
    icon: Minus,
    label: 'Tired',
    color: 'text-blue-400',
    dotColor: 'bg-blue-400',
  },
  confused: {
    icon: HelpCircle,
    label: 'Confused',
    color: 'text-red-400',
    dotColor: 'bg-red-400',
  },
  neutral: {
    icon: Minus,
    label: 'Neutral',
    color: 'text-muted-foreground',
    dotColor: 'bg-muted-foreground',
  },
};

/**
 * Displays the current CV analysis state in a compact, minimalist layout.
 * Shows current emotion + gaze direction in a single row.
 */
export function CVDataDisplay({ data, className }: CVDataDisplayProps) {
  if (!data) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg bg-muted/50 px-3 py-4 text-center',
          className
        )}
      >
        <EyeOff className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">Waiting for analysis data...</p>
        <p className="mt-1 text-xs opacity-70">
          Start your camera and a focus session to begin monitoring
        </p>
      </div>
    );
  }

  const config = EMOTION_CONFIG[data.emotion] ?? EMOTION_CONFIG.neutral;
  const EmotionIcon = config.icon;

  const gazeLabel =
    data.gaze === 'center'
      ? 'On screen'
      : data.gaze.charAt(0).toUpperCase() + data.gaze.slice(1);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Compact status row */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
        {/* Emotion indicator */}
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', config.dotColor)} />
          <EmotionIcon className={cn('h-3.5 w-3.5', config.color)} />
          <span className={cn('text-xs font-medium', config.color)}>
            {config.label}
          </span>
        </div>

        {/* Divider */}
        <span className="h-3 w-px bg-border/50" />

        {/* Gaze */}
        <div className="flex items-center gap-1.5">
          <Eye className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{gazeLabel}</span>
        </div>

        {/* Divider */}
        {data.confusion && <span className="h-3 w-px bg-border/50" />}

        {/* Confusion flag (only shown when detected) */}
        {data.confusion && (
          <div className="flex items-center gap-1.5">
            <HelpCircle className="h-3 w-3 text-red-400" />
            <span className="text-xs text-red-400">Confused</span>
          </div>
        )}
      </div>

      {/* Confidence (subtle, below the row) */}
      {data.confidence !== undefined && (
        <p className="text-right text-[10px] text-muted-foreground/70">
          Confidence: {Math.round(data.confidence * 100)}%
        </p>
      )}
    </div>
  );
}
