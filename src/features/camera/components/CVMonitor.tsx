'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCVContext } from '../context/CVContext';
import type { ConnectionStatus } from '../types';
import { CVDataDisplay } from './CVDataDisplay';
import { EmotionTrendChart } from './EmotionTrendChart';

interface CVMonitorProps {
  /** Additional class names */
  className?: string;
}

/**
 * CV Monitor Widget — Displays real-time computer vision analysis data.
 *
 * Renders inside a DraggableWidget (which already provides Card wrapper,
 * header, and close button). This component outputs only the inner content.
 */
export function CVMonitor({ className }: CVMonitorProps) {
  const { latestData, isConnected, history, error } = useCVContext();

  const [isTrendEnabled, setIsTrendEnabled] = useState(true);

  // Derive connection status
  const connectionStatus: ConnectionStatus = error
    ? 'error'
    : isConnected
      ? 'connected'
      : 'disconnected';

  // Calculate elapsed session time from history
  const elapsedMinutes = useMemo((): number => {
    if (history.length < 2) return 0;
    const firstTimestamp = history[0].timestamp;
    const lastTimestamp = history[history.length - 1].timestamp;
    return Math.round((lastTimestamp - firstTimestamp) / 60000);
  }, [history]);

  const sessionStartTime =
    history.length > 0 ? history[0].timestamp : undefined;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Status Row: Connection + Trend Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-block h-2 w-2 rounded-full',
              connectionStatus === 'connected'
                ? 'bg-green-500'
                : connectionStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-muted-foreground'
            )}
          />
          <span className="text-xs font-medium text-card-foreground">
            {connectionStatus === 'connected'
              ? 'Connected'
              : connectionStatus === 'error'
                ? 'Error'
                : 'Disconnected'}
          </span>
        </div>

        {/* Trend Analysis Toggle */}
        <label className="flex cursor-pointer items-center gap-2">
          <span className="text-xs text-muted-foreground">Trend Analysis</span>
          <button
            role="switch"
            aria-checked={isTrendEnabled}
            onClick={() => setIsTrendEnabled((prev) => !prev)}
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
              isTrendEnabled ? 'bg-green-500' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
                isTrendEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
              )}
            />
          </button>
        </label>
      </div>

      {/* CV Data Display — Current state */}
      {(connectionStatus === 'connected' || latestData) && !error ? (
        <CVDataDisplay data={latestData} />
      ) : (
        <div className="flex items-center justify-center rounded-lg bg-muted/50 px-3 py-4">
          <p className="text-xs text-muted-foreground">
            Waiting for analysis data...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isConnected && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
          <p className="text-xs font-medium text-red-400">
            Backend Unavailable
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            The computer vision backend is currently unavailable.
          </p>
        </div>
      )}

      {/* Trend Chart Section */}
      {isTrendEnabled && (
        <div className="border-t border-border/50 pt-3">
          {/* Section Header */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-card-foreground">
              Emotion Trend
            </span>
            <span className="text-xs text-muted-foreground">
              {elapsedMinutes > 0 ? `Last ${elapsedMinutes}m` : 'Last 18m'}
            </span>
          </div>

          {/* Chart */}
          <EmotionTrendChart
            history={history}
            sessionStartTime={sessionStartTime}
            maxItems={60}
          />
        </div>
      )}
    </div>
  );
}
