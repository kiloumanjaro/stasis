'use client';

import { cn } from '@/lib/utils';
import {
  Focus,
  AlertTriangle,
  Moon,
  HelpCircle,
  Minus,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { CVResponse } from '../types';

interface CVDataDisplayProps {
  data: CVResponse | null;
  className?: string;
}

/**
 * Displays the current CV analysis data with visual indicators
 */
export function CVDataDisplay({ data, className }: CVDataDisplayProps) {
  // Emotion configuration with icons and colors
  const getEmotionConfig = (emotion: CVResponse['emotion']) => {
    switch (emotion) {
      case 'focused':
        return {
          icon: Focus,
          label: 'Focused',
          emoji: '🎯',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
        };
      case 'distracted':
        return {
          icon: AlertTriangle,
          label: 'Distracted',
          emoji: '😵‍💫',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
        };
      case 'tired':
        return {
          icon: Moon,
          label: 'Tired',
          emoji: '😴',
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
        };
      case 'confused':
        return {
          icon: HelpCircle,
          label: 'Confused',
          emoji: '🤔',
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
        };
      case 'neutral':
      default:
        return {
          icon: Minus,
          label: 'Neutral',
          emoji: '😐',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
        };
    }
  };

  // Gaze direction configuration
  const getGazeConfig = (gaze: CVResponse['gaze']) => {
    const gazeMap: Record<
      string,
      { label: string; emoji: string; description: string }
    > = {
      center: {
        label: 'Center',
        emoji: '👁️',
        description: 'Looking at screen',
      },
      left: { label: 'Left', emoji: '👈', description: 'Looking left' },
      right: { label: 'Right', emoji: '👉', description: 'Looking right' },
      up: { label: 'Up', emoji: '👆', description: 'Looking up' },
      down: { label: 'Down', emoji: '👇', description: 'Looking down' },
      away: { label: 'Away', emoji: '🙈', description: 'Looking away' },
    };

    return (
      gazeMap[gaze] || { label: gaze, emoji: '👁️', description: 'Unknown' }
    );
  };

  // Empty state
  if (!data) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-8 text-muted-foreground',
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

  const emotionConfig = getEmotionConfig(data.emotion);
  const gazeConfig = getGazeConfig(data.gaze);
  const EmotionIcon = emotionConfig.icon;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Primary Emotion Display */}
      <div
        className={cn(
          'flex items-center gap-4 rounded-lg p-4',
          emotionConfig.bgColor
        )}
      >
        <div className="text-4xl">{emotionConfig.emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <EmotionIcon className={cn('h-5 w-5', emotionConfig.color)} />
            <span className={cn('text-lg font-semibold', emotionConfig.color)}>
              {emotionConfig.label}
            </span>
          </div>
          {data.confidence !== undefined && (
            <p className="mt-1 text-xs text-muted-foreground">
              Confidence: {Math.round(data.confidence * 100)}%
            </p>
          )}
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Gaze Direction */}
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            <span>Gaze</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xl">{gazeConfig.emoji}</span>
            <span className="font-medium">{gazeConfig.label}</span>
          </div>
        </div>

        {/* Confusion Status */}
        <div
          className={cn(
            'rounded-lg border p-3',
            data.confusion ? 'border-orange-500/50 bg-orange-500/5' : 'bg-card'
          )}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Confusion</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xl">{data.confusion ? '😕' : '✅'}</span>
            <span
              className={cn(
                'font-medium',
                data.confusion ? 'text-orange-500' : 'text-green-500'
              )}
            >
              {data.confusion ? 'Detected' : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-center text-xs text-muted-foreground">
        Last updated: {new Date(data.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
