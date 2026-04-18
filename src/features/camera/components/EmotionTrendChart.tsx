'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { EmotionSnapshot } from '../types';

interface EmotionTrendChartProps {
  history: EmotionSnapshot[];
  maxItems?: number;
  className?: string;
}

// Emotion to color mapping for chart visualization
const EMOTION_COLORS: Record<string, string> = {
  focused: '#22c55e', // green-500
  distracted: '#eab308', // yellow-500
  tired: '#60a5fa', // blue-400
  confused: '#f97316', // orange-500
  neutral: '#6b7280', // gray-500
};

// Emotion to y-position mapping (0-100 scale, higher = better)
const EMOTION_VALUES: Record<string, number> = {
  focused: 100,
  neutral: 70,
  confused: 50,
  distracted: 30,
  tired: 20,
};

/**
 * Visualizes emotion history as a trend line chart
 */
export function EmotionTrendChart({
  history,
  maxItems = 20,
  className,
}: EmotionTrendChartProps) {
  // Process history data for visualization
  const chartData = useMemo(() => {
    const items = history.slice(-maxItems);
    return items.map((snapshot, index) => ({
      ...snapshot,
      value: EMOTION_VALUES[snapshot.emotion] ?? 50,
      color: EMOTION_COLORS[snapshot.emotion] ?? '#6b7280',
      x: (index / Math.max(items.length - 1, 1)) * 100,
    }));
  }, [history, maxItems]);

  // Type for emotion statistics
  interface EmotionStat {
    emotion: string;
    count: number;
    percentage: number;
    color: string;
  }

  // Calculate emotion distribution
  const emotionStats = useMemo((): EmotionStat[] => {
    if (history.length === 0) return [];

    const counts: Record<string, number> = {};
    history.forEach((snapshot) => {
      counts[snapshot.emotion] = (counts[snapshot.emotion] || 0) + 1;
    });

    const total = history.length;
    return Object.entries(counts).map(([emotion, count]) => ({
      emotion,
      count,
      percentage: Math.round((count / total) * 100),
      color: EMOTION_COLORS[emotion] ?? '#6b7280',
    }));
  }, [history]);

  // Empty state
  if (history.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-6 text-muted-foreground',
          className
        )}
      >
        <svg
          className="mb-2 h-8 w-8 opacity-50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 3v18h18" />
          <path d="M7 16l4-4 4 4 5-6" />
        </svg>
        <p className="text-sm">No trend data yet</p>
        <p className="mt-1 text-xs opacity-70">
          History will appear as analysis runs
        </p>
      </div>
    );
  }

  // Generate SVG path for trend line
  const generatePath = () => {
    if (chartData.length < 2) return '';

    const points = chartData.map((d, i) => {
      const x = (i / (chartData.length - 1)) * 280 + 10; // 10px padding
      const y = 90 - (d.value / 100) * 80; // Invert Y, 10px top padding
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Trend Chart */}
      <div className="rounded-lg border bg-card p-3">
        <h4 className="mb-2 text-xs font-medium text-muted-foreground">
          Focus Trend
        </h4>
        <svg viewBox="0 0 300 100" className="h-24 w-full">
          {/* Grid lines */}
          <line
            x1="10"
            y1="10"
            x2="10"
            y2="90"
            stroke="currentColor"
            strokeOpacity="0.1"
          />
          <line
            x1="10"
            y1="90"
            x2="290"
            y2="90"
            stroke="currentColor"
            strokeOpacity="0.1"
          />
          <line
            x1="10"
            y1="50"
            x2="290"
            y2="50"
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeDasharray="4"
          />

          {/* Trend line */}
          <path
            d={generatePath()}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>

          {/* Data points */}
          {chartData.map((point, i) => {
            const x = (i / Math.max(chartData.length - 1, 1)) * 280 + 10;
            const y = 90 - (point.value / 100) * 80;
            return (
              <circle
                key={point.timestamp}
                cx={x}
                cy={y}
                r="3"
                fill={point.color}
                className="transition-all duration-200"
              />
            );
          })}

          {/* Y-axis labels */}
          <text x="4" y="14" fontSize="8" fill="currentColor" opacity="0.5">
            😊
          </text>
          <text x="4" y="54" fontSize="8" fill="currentColor" opacity="0.5">
            😐
          </text>
          <text x="4" y="94" fontSize="8" fill="currentColor" opacity="0.5">
            😔
          </text>
        </svg>
      </div>

      {/* Emotion Distribution */}
      <div className="rounded-lg border bg-card p-3">
        <h4 className="mb-2 text-xs font-medium text-muted-foreground">
          Session Distribution
        </h4>
        <div className="space-y-2">
          {emotionStats
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 4)
            .map((stat) => (
              <div key={stat.emotion} className="flex items-center gap-2">
                <div className="w-16 truncate text-xs capitalize">
                  {stat.emotion}
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${stat.percentage}%`,
                      backgroundColor: stat.color,
                    }}
                  />
                </div>
                <div className="w-8 text-right text-xs text-muted-foreground">
                  {stat.percentage}%
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Samples: {history.length}</span>
        <span>
          Duration:{' '}
          {history.length >= 2
            ? `${Math.round((history[history.length - 1].timestamp - history[0].timestamp) / 1000)}s`
            : '0s'}
        </span>
      </div>
    </div>
  );
}
