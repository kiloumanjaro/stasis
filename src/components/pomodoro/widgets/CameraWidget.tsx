'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  VideoOff,
  ChevronDown,
  RefreshCw,
  ShieldAlert,
  Camera,
} from 'lucide-react';
import { useCameraContextSafe } from '@/features/camera/context/CameraContext';
import { cn } from '@/lib/utils';

export function CameraWidget() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const camera = useCameraContextSafe();

  useEffect(() => {
    camera?.registerVideoRef(videoRef);
  }, [camera]);

  const stream = camera?.stream ?? null;
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!camera) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3">
        <VideoOff className="h-10 w-10 text-muted-foreground" />
        <p className="text-center text-sm text-muted-foreground">
          Camera unavailable: provider not initialized.
        </p>
      </div>
    );
  }

  const {
    isCameraActive,
    isLoading,
    permissionState,
    errorType,
    errorMessage,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
  } = camera;

  const isBlocked = errorType === 'blocked' || permissionState === 'denied';
  const hasOtherError = !isBlocked && !!errorType;

  const selectedLabel =
    devices.find((d) => d.deviceId === selectedDeviceId)?.label ??
    'Select a camera';

  const picker = devices.length > 0 && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-sm"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-[100] w-[280px]">
        {devices.map((device) => (
          <DropdownMenuItem
            key={device.deviceId}
            onClick={() => setSelectedDeviceId(device.deviceId)}
            className={device.deviceId === selectedDeviceId ? 'bg-accent' : ''}
          >
            <span className="truncate">{device.label || 'Unnamed camera'}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const idleMessage =
    devices.length === 0
      ? 'No cameras detected.'
      : !selectedDeviceId
        ? 'Pick a camera to use during focus sessions.'
        : 'Camera turns on when a focus session is running.';

  return (
    <div className="flex flex-col gap-3">
      {picker}
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            'h-full w-full scale-x-[-1] object-cover',
            !isCameraActive && 'invisible'
          )}
        />

        {isBlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted px-3">
            <ShieldAlert className="h-10 w-10 text-destructive" />
            <p className="text-center text-sm font-medium text-destructive">
              Camera access blocked
            </p>
            <p className="text-center text-xs text-muted-foreground">
              {errorMessage ??
                'Enable camera permissions for this site in your browser settings, then reload.'}
            </p>
          </div>
        )}

        {hasOtherError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted px-3">
            <VideoOff className="h-10 w-10 text-destructive" />
            <p className="text-center text-sm text-destructive">
              {errorMessage ?? 'Failed to access camera.'}
            </p>
          </div>
        )}

        {!isBlocked && !hasOtherError && isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              Requesting camera access…
            </p>
          </div>
        )}

        {!isBlocked && !hasOtherError && !isLoading && !isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-3">
            <Camera className="h-10 w-10 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              {idleMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
