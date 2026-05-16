'use client';

import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '../types';

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

/**
 * Visual indicator for WebSocket connection status
 */
export function ConnectionStatusBadge({
  status,
  className,
}: ConnectionStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          label: 'Connected',
          variant: 'default' as const,
          className: 'bg-green-500/90 hover:bg-green-500/80 text-white',
          iconClassName: 'text-white',
        };
      case 'connecting':
        return {
          icon: Loader2,
          label: 'Connecting',
          variant: 'secondary' as const,
          className: 'bg-yellow-500/90 hover:bg-yellow-500/80 text-white',
          iconClassName: 'text-white animate-spin',
        };
      case 'reconnecting':
        return {
          icon: Loader2,
          label: 'Reconnecting',
          variant: 'secondary' as const,
          className: 'bg-orange-500/90 hover:bg-orange-500/80 text-white',
          iconClassName: 'text-white animate-spin',
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Error',
          variant: 'destructive' as const,
          className: 'bg-red-500/90 hover:bg-red-500/80 text-white',
          iconClassName: 'text-white',
        };
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          label: 'Disconnected',
          variant: 'outline' as const,
          className: 'bg-muted text-muted-foreground',
          iconClassName: 'text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1',
        config.className,
        className
      )}
    >
      <Icon className={cn('h-3 w-3', config.iconClassName)} />
      <span className="text-xs font-medium">{config.label}</span>
    </Badge>
  );
}
