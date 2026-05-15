'use client';

import { useMemo, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { EmotionSnapshot } from '../types';

/* ─────────────────────────── Constants ─────────────────────────── */

/** Three-band emotion model for chart Y-axis */
const EMOTION_BANDS = {
  confused: 0,
  focused: 1,
  happy: 2,
} as const;

/** Y-axis tick labels (index → label) */
const BAND_LABELS: Record<number, string> = {
  0: 'Confused',
  1: 'Focused',
  2: 'Happy',
};

/** Line colors per dominant emotion */
const EMOTION_LINE_COLORS = {
  confused: '#f87171', // red-400
  focused: '#60a5fa', // blue-400
  happy: '#4ade80', // green-400
} as const;

type EmotionBand = keyof typeof EMOTION_BANDS;

/* ─────────────────────────── Types ─────────────────────────── */

interface EmotionDataPoint {
  /** Elapsed minutes from session start */
  minute: number;
  /** Numeric emotion value: 0=Confused, 1=Focused, 2=Happy */
  value: number;
  /** Emotion band label */
  emotion: EmotionBand;
}

interface EmotionStat {
  emotion: EmotionBand;
  label: string;
  percentage: number;
  color: string;
}

interface EmotionTrendChartProps {
  /** Real emotion history from CVContext */
  history: EmotionSnapshot[];
  /** Session start timestamp (for calculating elapsed time) */
  sessionStartTime?: number;
  /** Maximum data points to render */
  maxItems?: number;
  className?: string;
}

/* ─────────────────────────── Helpers ─────────────────────────── */

/**
 * Maps raw CV emotion strings to the three-band model.
 * Unknown emotions default to "focused".
 */
function mapToEmotionBand(rawEmotion: string): EmotionBand {
  switch (rawEmotion) {
    case 'confused':
      return 'confused';
    case 'happy':
      return 'happy';
    case 'focused':
    case 'neutral':
    case 'distracted':
    case 'tired':
    default:
      return 'focused';
  }
}

/**
 * Generates realistic dummy emotion data for placeholder rendering.
 * Weighted distribution: ~65% focused, ~15% happy, ~20% confused.
 */
function generateDummyEmotionData(durationMinutes: number): EmotionDataPoint[] {
  const points: EmotionDataPoint[] = [];
  const intervalMinutes = 0.5; // one point per 30 seconds
  const totalPoints = Math.floor(durationMinutes / intervalMinutes);

  // Deterministic seed-like approach using index for consistency
  for (let i = 0; i <= totalPoints; i++) {
    const minute = Math.round(i * intervalMinutes * 10) / 10;
    const rand = Math.sin(i * 7.3 + 2.1) * 0.5 + 0.5; // pseudo-random 0-1

    let emotion: EmotionBand;
    if (rand < 0.2) {
      emotion = 'confused';
    } else if (rand < 0.35) {
      emotion = 'happy';
    } else {
      emotion = 'focused';
    }

    points.push({
      minute,
      value: EMOTION_BANDS[emotion],
      emotion,
    });
  }

  return points;
}

/* ─────────────────────────── Component ─────────────────────────── */

/**
 * Renders an emotion trend line chart using Recharts.
 *
 * Displays three emotion bands (Confused / Focused / Happy) on the Y-axis
 * and elapsed session time on the X-axis. Falls back to dummy data when
 * no real history is available so the chart is always functional.
 */
export function EmotionTrendChart({
  history,
  sessionStartTime,
  maxItems = 60,
  className,
}: EmotionTrendChartProps) {
  // Stable ref for dummy data so it doesn't regenerate on every render
  const dummyDataRef = useRef<EmotionDataPoint[] | null>(null);

  // Transform real history into chart-ready data points
  const realDataPoints = useMemo((): EmotionDataPoint[] => {
    if (history.length === 0) return [];

    const startTime = sessionStartTime ?? history[0].timestamp;
    const items = history.slice(-maxItems);

    return items.map((snapshot) => {
      const emotion = mapToEmotionBand(snapshot.emotion);
      const elapsedMinutes =
        Math.round(((snapshot.timestamp - startTime) / 60000) * 10) / 10;

      return {
        minute: Math.max(0, elapsedMinutes),
        value: EMOTION_BANDS[emotion],
        emotion,
      };
    });
  }, [history, sessionStartTime, maxItems]);

  // Use real data or generate dummy data once
  const chartData = useMemo((): EmotionDataPoint[] => {
    if (realDataPoints.length > 0) return realDataPoints;

    if (!dummyDataRef.current) {
      dummyDataRef.current = generateDummyEmotionData(18);
    }
    return dummyDataRef.current;
  }, [realDataPoints]);

  // Calculate emotion distribution statistics
  const emotionStats = useMemo((): EmotionStat[] => {
    const counts: Record<EmotionBand, number> = {
      happy: 0,
      focused: 0,
      confused: 0,
    };

    chartData.forEach((point) => {
      counts[point.emotion] += 1;
    });

    const total = chartData.length || 1;

    return [
      {
        emotion: 'happy',
        label: 'Happy',
        percentage: Math.round((counts.happy / total) * 100),
        color: EMOTION_LINE_COLORS.happy,
      },
      {
        emotion: 'focused',
        label: 'Focus',
        percentage: Math.round((counts.focused / total) * 100),
        color: EMOTION_LINE_COLORS.focused,
      },
      {
        emotion: 'confused',
        label: 'Confused',
        percentage: Math.round((counts.confused / total) * 100),
        color: EMOTION_LINE_COLORS.confused,
      },
    ];
  }, [chartData]);

  // Determine dominant emotion for line color
  const dominantEmotionColor = useMemo((): string => {
    const dominant = emotionStats.reduce((prev, curr) =>
      curr.percentage > prev.percentage ? curr : prev
    );
    return dominant.color;
  }, [emotionStats]);

  // Empty state — should rarely show since we have dummy fallback
  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-6 text-muted-foreground',
          className
        )}
      >
        <p className="text-sm">No trend data yet</p>
        <p className="mt-1 text-xs opacity-70">
          History will appear as analysis runs
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {/* Recharts Line Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 12, bottom: 4, left: -8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(60 3% 28% / 0.3)"
            vertical={false}
          />
          <XAxis
            dataKey="minute"
            tick={{ fontSize: 10, fill: 'hsl(60 1% 57%)' }}
            tickFormatter={(val: number) => `${Math.round(val)}`}
            stroke="hsl(60 3% 28% / 0.5)"
            axisLine={{ stroke: 'hsl(60 3% 28% / 0.3)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 2]}
            ticks={[0, 1, 2]}
            tickFormatter={(val: number) => BAND_LABELS[val] ?? ''}
            tick={{ fontSize: 10, fill: 'hsl(60 1% 57%)' }}
            stroke="hsl(60 3% 28% / 0.5)"
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={dominantEmotionColor}
            strokeWidth={2}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Emotion Summary Chips */}
      <div className="flex items-center justify-around pt-2">
        {emotionStats.map(({ emotion, label, percentage, color }) => (
          <div key={emotion} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground">
              {label} {percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
