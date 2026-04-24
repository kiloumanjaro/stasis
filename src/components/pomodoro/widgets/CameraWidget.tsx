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

export function CameraWidget() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const camera = useCameraContextSafe();

  useEffect(() => {
    camera?.registerVideoRef(videoRef);
  }, [camera]);

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
    requestStream,
  } = camera;

  if (errorType === 'blocked' || permissionState === 'denied') {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 px-2">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <p className="text-center text-sm font-medium text-destructive">
          Camera access blocked
        </p>
        <p className="text-center text-xs text-muted-foreground">
          {errorMessage ??
            'Enable camera permissions for this site in your browser settings, then reload.'}
        </p>
      </div>
    );
  }

  if (errorType) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 px-2">
        <VideoOff className="h-10 w-10 text-destructive" />
        <p className="text-center text-sm text-destructive">
          {errorMessage ?? 'Failed to access camera.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void requestStream()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-center text-sm text-muted-foreground">
          Requesting camera access…
        </p>
      </div>
    );
  }

  const selectedLabel =
    devices.find((d) => d.deviceId === selectedDeviceId)?.label ??
    'Auto (default camera)';

  const picker = devices.length > 0 && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between text-sm">
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        {devices.map((device) => (
          <DropdownMenuItem
            key={device.deviceId}
            onClick={() => setSelectedDeviceId(device.deviceId)}
            className={device.deviceId === selectedDeviceId ? 'bg-accent' : ''}
          >
            <span className="truncate">{device.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (!isCameraActive) {
    return (
      <div className="flex flex-col gap-3">
        {picker}
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-md bg-muted px-3">
          <Camera className="h-10 w-10 text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">
            {devices.length === 0
              ? 'Pick a camera to use for this session.'
              : 'Camera locked in for this session. Starts when the focus timer runs.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void requestStream()}
          >
            {devices.length === 0 ? 'Choose camera' : 'Preview'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {picker}
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full scale-x-[-1] object-cover"
        />
      </div>
    </div>
  );
}
