'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Activity, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useCVContext } from '../context/CVContext';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { CVDataDisplay } from './CVDataDisplay';
import { EmotionTrendChart } from './EmotionTrendChart';

interface CVMonitorProps {
  /** Additional class names */
  className?: string;
}

/**
 * CV Monitor Widget - Displays real-time computer vision analysis data
 *
 * This component consumes data from CVContext and renders the analysis UI.
 * The actual WebSocket connection and data fetching is handled by CVContext.
 */
export function CVMonitor({ className }: CVMonitorProps) {
  // Consume CV context for real-time data
  const {
    latestData,
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

  // State for collapsible sections
  const [showChart, setShowChart] = useState(true);

  // Use context data
  const cvData = latestData;
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
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Focus Monitor</CardTitle>
              <p className="text-xs text-muted-foreground">
                Video stays local. Only mapped emotion labels sync while focus
                monitoring is active.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ConnectionStatusBadge status={localStatus} />
            <Badge className={cn('border-none', recordingTone)}>
              {recordingLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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
              {cvData
                ? new Date(cvData.timestamp).toLocaleTimeString()
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

        <CVDataDisplay data={cvData} />

        {/* Collapsible Trend Chart Section - Only show when we have data */}
        {history.length > 0 && (
          <div className="border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-2"
              onClick={() => setShowChart(!showChart)}
            >
              <span className="text-xs font-medium text-muted-foreground">
                Trend Analysis
              </span>
              {showChart ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showChart && (
              <div className="mt-3">
                <EmotionTrendChart history={history} maxItems={20} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
