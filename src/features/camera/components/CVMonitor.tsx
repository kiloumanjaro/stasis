'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Activity, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useCVContext } from '../context/CVContext';
import type { ConnectionStatus } from '../types';
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
  const { latestData, isConnected, history, error } = useCVContext();

  // State for collapsible sections
  const [showChart, setShowChart] = useState(true);

  // Derive connection status from context
  const connectionStatus: ConnectionStatus = error
    ? 'error'
    : isConnected
      ? 'connected'
      : 'disconnected';

  // Use context data
  const cvData = latestData;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Focus Monitor</CardTitle>
          </div>
          <ConnectionStatusBadge status={connectionStatus} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error State - Backend Unavailable */}
        {(error || connectionStatus === 'error') && !isConnected && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Backend Unavailable</AlertTitle>
            <AlertDescription className="text-sm">
              <p>The computer vision backend is currently unavailable.</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Please contact support if this issue persists.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Data Display - Only show when connected or has data */}
        {(connectionStatus === 'connected' || cvData) && (
          <CVDataDisplay data={cvData} />
        )}

        {/* Collapsible Trend Chart Section - Only show when we have data */}
        {(connectionStatus === 'connected' || history.length > 0) && (
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
