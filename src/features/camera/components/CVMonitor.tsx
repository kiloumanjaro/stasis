'use client';

import { useMemo, useState } from 'react';
import { Activity, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCVContext } from '../context/CVContext';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { CVDataDisplay } from './CVDataDisplay';
import { EmotionTrendChart } from './EmotionTrendChart';

interface CVMonitorProps {
  /** Additional class names */
  className?: string;
}

/**
 * CV Monitor Widget - Displays real-time computer vision analysis data.
 *
 * Renders inside a DraggableWidget, so this component outputs only the
 * inner content while still surfacing local readiness and sync state.
 */
export function CVMonitor({ className }: CVMonitorProps) {
  const {
    latestData,
    isConnected,
    history,
    localStatus,
    error,
    cameraError,
    syncError,
    recordingState,
    pendingSnapshotCount,
    isSocketConnected,
    sessionId,
  } = useCVContext();

  const [showChart, setShowChart] = useState(true);

  const elapsedMinutes = useMemo((): number => {
    if (history.length < 2) return 0;
    const firstTimestamp = history[0].timestamp;
    const lastTimestamp = history[history.length - 1].timestamp;
    return Math.round((lastTimestamp - firstTimestamp) / 60000);
  }, [history]);

  const sessionStartTime =
    history.length > 0 ? history[0].timestamp : undefined;

  const recordingTone =
    recordingState === 'recording'
      ? 'bg-green-500/10 text-green-500'
      : recordingState === 'flushing'
        ? 'bg-yellow-500/10 text-yellow-500'
        : recordingState === 'starting' || recordingState === 'ending'
          ? 'bg-blue-500/10 text-blue-400'
          : recordingState === 'error'
            ? 'bg-red-500/10 text-red-400'
            : 'bg-muted text-muted-foreground';

  const recordingLabel =
    recordingState === 'recording'
      ? 'Recording'
      : recordingState === 'flushing'
        ? 'Syncing'
        : recordingState === 'starting'
          ? 'Starting'
          : recordingState === 'ending'
            ? 'Ending'
            : recordingState === 'error'
              ? 'Sync error'
              : 'Idle';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <ConnectionStatusBadge status={localStatus} />
          </div>
          <p className="text-xs text-muted-foreground">
            Video stays local. Only mapped emotion labels sync during active
            focus monitoring.
          </p>
        </div>
        <Badge className={cn('border-none', recordingTone)}>
          {recordingLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-muted-foreground">Socket</p>
          <p className="mt-1 font-medium">
            {isSocketConnected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-muted-foreground">Queued snapshots</p>
          <p className="mt-1 font-medium">{pendingSnapshotCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-muted-foreground">Session</p>
          <p className="mt-1 truncate font-medium">
            {sessionId ? sessionId : 'Not recording'}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-muted-foreground">Latest sample</p>
          <p className="mt-1 font-medium">
            {latestData
              ? new Date(latestData.timestamp).toLocaleTimeString()
              : 'None'}
          </p>
        </div>
      </div>

      {cameraError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Camera Unavailable</AlertTitle>
          <AlertDescription className="text-sm">
            <p>{cameraError}</p>
          </AlertDescription>
        </Alert>
      )}

      {error && !cameraError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Model Unavailable</AlertTitle>
          <AlertDescription className="text-sm">
            <p>{error}</p>
          </AlertDescription>
        </Alert>
      )}

      {syncError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Recording Sync Issue</AlertTitle>
          <AlertDescription className="text-sm">
            <p>{syncError}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Local analysis continues even when sync is temporarily failing.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {(isConnected || latestData) && !error ? (
        <CVDataDisplay data={latestData} />
      ) : (
        <CVDataDisplay data={null} />
      )}

      {history.length > 0 && (
        <div className="border-t border-border/50 pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between px-2"
            onClick={() => setShowChart((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Trend Analysis
              </span>
              <span className="text-xs text-muted-foreground">
                {elapsedMinutes > 0 ? `Last ${elapsedMinutes}m` : 'Recent'}
              </span>
            </div>
            {showChart ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showChart && (
            <div className="mt-3">
              <EmotionTrendChart
                history={history}
                sessionStartTime={sessionStartTime}
                maxItems={60}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
