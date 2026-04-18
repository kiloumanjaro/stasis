'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VideoOff, ChevronDown, RefreshCw } from 'lucide-react';
import { useCameraContextSafe } from '@/features/camera/context/CameraContext';

interface CameraDevice {
  deviceId: string;
  label: string;
}

export function CameraWidget() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraContext = useCameraContextSafe();

  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Register videoRef with camera context
  useEffect(() => {
    if (cameraContext) {
      cameraContext.registerVideoRef(videoRef);
    }
  }, [cameraContext]);

  // 1. On mount: Request permission and fetch available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        // Request permission first to get access to device labels
        const initialStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        // Once we have permission, enumerate devices
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices
          .filter((device) => device.kind === 'videoinput')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${index + 1}`,
          }));

        setDevices(videoDevices);

        // Set the first camera as the default
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }

        // Stop the initial stream so we can start a specific one later
        initialStream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError') {
            setError('Camera access denied. Please allow camera permissions.');
          } else if (err.name === 'NotFoundError') {
            setError('No camera found on this device.');
          } else {
            setError(`Camera error: ${err.message}`);
          }
        } else {
          setError('Failed to access camera');
        }
      } finally {
        setIsLoading(false);
      }
    };

    getCameras();
  }, []);

  // 2. When selectedDeviceId changes: Start the stream for that specific camera
  useEffect(() => {
    if (!selectedDeviceId) return;

    let currentStream: MediaStream | null = null;

    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDeviceId } },
          audio: false,
        });

        currentStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        cameraContext?.setCameraActive(true);
      } catch (err) {
        console.error('Error starting stream:', err);
        cameraContext?.setCameraActive(false);
      }
    };

    startStream();

    // Cleanup: Stop the stream when component unmounts or camera changes
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
        cameraContext?.setCameraActive(false);
      }
    };
  }, [selectedDeviceId, cameraContext]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-center text-sm text-muted-foreground">
          Requesting camera access...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4">
        <VideoOff className="h-12 w-12 text-destructive" />
        <p className="text-center text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Camera Selection Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-sm"
            disabled={devices.length === 0}
          >
            <span className="truncate">
              {devices.find((d) => d.deviceId === selectedDeviceId)?.label ||
                'Select Camera'}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px]">
          {devices.map((device) => (
            <DropdownMenuItem
              key={device.deviceId}
              onClick={() => setSelectedDeviceId(device.deviceId)}
              className={
                device.deviceId === selectedDeviceId ? 'bg-accent' : ''
              }
            >
              <span className="truncate">{device.label}</span>
            </DropdownMenuItem>
          ))}
          {devices.length === 0 && (
            <DropdownMenuItem disabled>No cameras detected</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Video Preview */}
      <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
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
