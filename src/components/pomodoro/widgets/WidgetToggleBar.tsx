'use client';

import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WidgetToggleBarProps {
  cameraOpen: boolean;
  timerOpen: boolean;
  monitorOpen: boolean;
  onToggleCamera: () => void;
  onToggleTimer: () => void;
  onToggleMonitor: () => void;
}

export function WidgetToggleBar({
  cameraOpen,
  timerOpen,
  monitorOpen,
  onToggleCamera,
  onToggleTimer,
  onToggleMonitor,
}: WidgetToggleBarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Camera Toggle */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          'h-9 w-9 rounded-md transition-all',
          cameraOpen &&
            'border-[#778d5e] bg-[#778d5e] text-white hover:bg-[#778d5e]/90 hover:text-white'
        )}
        onClick={onToggleCamera}
        title={cameraOpen ? 'Hide Camera' : 'Show Camera'}
      >
        <Icon icon="bi:camera-video" className="h-4 w-4" />
      </Button>

      {/* Timer Toggle */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          'h-9 w-9 rounded-md transition-all',
          timerOpen &&
            'border-[#778d5e] bg-[#778d5e] text-white hover:bg-[#778d5e]/90 hover:text-white'
        )}
        onClick={onToggleTimer}
        title={timerOpen ? 'Hide Timer' : 'Show Timer'}
      >
        <Icon icon="bi:stopwatch" className="h-4 w-4" />
      </Button>

      {/* CV Monitor Toggle */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          'h-9 w-9 rounded-md transition-all',
          monitorOpen &&
            'border-[#778d5e] bg-[#778d5e] text-white hover:bg-[#778d5e]/90 hover:text-white'
        )}
        onClick={onToggleMonitor}
        title={monitorOpen ? 'Hide Focus Monitor' : 'Show Focus Monitor'}
      >
        <Icon icon="bi:activity" className="h-4 w-4" />
      </Button>
    </div>
  );
}
