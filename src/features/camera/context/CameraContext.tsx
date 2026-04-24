'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';

export type CameraPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied';

export type CameraErrorType =
  | 'blocked'
  | 'not-found'
  | 'in-use'
  | 'unsupported'
  | 'other'
  | null;

export interface CameraDevice {
  deviceId: string;
  label: string;
}

interface CameraContextType {
  videoRef: RefObject<HTMLVideoElement | null>;
  registerVideoRef: (ref: RefObject<HTMLVideoElement | null>) => void;

  isCameraActive: boolean;
  isLoading: boolean;
  permissionState: CameraPermissionState;
  errorType: CameraErrorType;
  errorMessage: string | null;

  devices: CameraDevice[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;

  setSessionActive: (active: boolean) => void;
  requestStream: () => Promise<void>;
  stopStream: () => void;
}

const BLOCKED_MESSAGE =
  'Camera access is blocked. Enable camera permissions in your browser settings, then reload this page.';

// Ordered preference for the auto-selected camera. Matched case-insensitively
// against the device label. First match wins; falls back to devices[0].
const PREFERRED_DEVICE_LABELS = ['USB2.0 HD UVC WebCam', 'UVC', 'USB'];

function pickDefaultDevice(devices: CameraDevice[]): string {
  for (const pattern of PREFERRED_DEVICE_LABELS) {
    const match = devices.find((d) =>
      d.label.toLowerCase().includes(pattern.toLowerCase())
    );
    if (match) return match.deviceId;
  }
  return devices[0]?.deviceId ?? '';
}

const CameraContext = createContext<CameraContextType | null>(null);

export function CameraProvider({ children }: { children: ReactNode }) {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const [registeredRef, setRegisteredRef] =
    useState<RefObject<HTMLVideoElement | null> | null>(null);
  const videoRef = registeredRef ?? internalVideoRef;

  const streamRef = useRef<MediaStream | null>(null);
  const sessionActiveRef = useRef(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] =
    useState<CameraPermissionState>('unknown');
  const [errorType, setErrorType] = useState<CameraErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceIdState] = useState<string>('');
  const userPickedDeviceRef = useRef(false);

  const stopStreamInternal = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, [videoRef]);

  const setBlockedError = useCallback(() => {
    setPermissionState('denied');
    setErrorType('blocked');
    setErrorMessage(BLOCKED_MESSAGE);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
      return;
    }

    let cancelled = false;
    let permStatus: PermissionStatus | null = null;

    const handleChange = () => {
      if (!permStatus || cancelled) return;
      const next = permStatus.state as CameraPermissionState;
      setPermissionState(next);
      if (next === 'denied') {
        stopStreamInternal();
        setBlockedError();
      } else if (next === 'granted') {
        setErrorType((prev) => (prev === 'blocked' ? null : prev));
        setErrorMessage((prev) => (prev === BLOCKED_MESSAGE ? null : prev));
      }
    };

    (async () => {
      try {
        permStatus = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        });
        if (cancelled) return;
        const state = permStatus.state as CameraPermissionState;
        setPermissionState(state);
        if (state === 'denied') {
          setBlockedError();
        }
        permStatus.onchange = handleChange;
      } catch {
        // Some browsers don't support permissions.query for 'camera'.
      }
    })();

    return () => {
      cancelled = true;
      if (permStatus) permStatus.onchange = null;
    };
  }, [setBlockedError, stopStreamInternal]);

  const enumerate = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      // Pre-permission, browsers may return placeholder entries with empty
      // deviceIds — drop those so the picker only shows selectable cameras.
      const videoDevices = all
        .filter((d) => d.kind === 'videoinput' && d.deviceId)
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));
      setDevices(videoDevices);
      setSelectedDeviceIdState((prev) => {
        if (prev && videoDevices.some((d) => d.deviceId === prev)) return prev;
        return pickDefaultDevice(videoDevices);
      });
    } catch {
      // Enumeration failures are non-fatal.
    }
  }, []);

  const requestStream = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setErrorType('unsupported');
      setErrorMessage('Camera API is not available in this browser.');
      return;
    }

    if (permissionState === 'denied') {
      setBlockedError();
      return;
    }

    setIsLoading(true);
    setErrorType(null);
    setErrorMessage(null);

    // Treat a manual request as activating the session so the late-resolution
    // guard below doesn't tear down the stream the user just asked for.
    sessionActiveRef.current = true;

    stopStreamInternal();

    // Only pin to a deviceId when the user explicitly picked one. Auto-selected
    // devices on Windows are often IR sensors or virtual cameras that fail with
    // NotReadableError — letting the browser resolve facingMode is more reliable.
    const videoConstraint: MediaTrackConstraints =
      userPickedDeviceRef.current && selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId }, facingMode: 'user' }
        : { facingMode: 'user' };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraint,
        audio: false,
      });

      if (!sessionActiveRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        setIsLoading(false);
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsCameraActive(true);
      setPermissionState('granted');

      await enumerate();
    } catch (err) {
      stopStreamInternal();
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
          case 'SecurityError':
            setBlockedError();
            break;
          case 'NotFoundError':
          case 'OverconstrainedError':
            setErrorType('not-found');
            setErrorMessage('No camera found on this device.');
            break;
          case 'NotReadableError':
          case 'AbortError':
            setErrorType('in-use');
            setErrorMessage(
              userPickedDeviceRef.current && selectedDeviceId
                ? 'The selected camera could not be opened. It may be in use by another app or unavailable. Pick a different camera.'
                : 'Camera could not be opened. It may be in use by another tab, app, or still releasing from a prior session.'
            );
            break;
          default:
            setErrorType('other');
            setErrorMessage(`Camera error: ${err.message}`);
        }
      } else {
        setErrorType('other');
        setErrorMessage('Failed to access camera.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    permissionState,
    selectedDeviceId,
    videoRef,
    enumerate,
    setBlockedError,
    stopStreamInternal,
  ]);

  const stopStream = useCallback(() => {
    stopStreamInternal();
  }, [stopStreamInternal]);

  const setSessionActive = useCallback(
    (active: boolean) => {
      sessionActiveRef.current = active;
      if (active) {
        if (!streamRef.current && !isLoading) {
          void requestStream();
        }
      } else {
        stopStreamInternal();
      }
    },
    [isLoading, requestStream, stopStreamInternal]
  );

  const setSelectedDeviceId = useCallback((id: string) => {
    userPickedDeviceRef.current = true;
    setSelectedDeviceIdState(id);
  }, []);

  const prevDeviceRef = useRef(selectedDeviceId);
  useEffect(() => {
    if (prevDeviceRef.current === selectedDeviceId) return;
    prevDeviceRef.current = selectedDeviceId;
    if (streamRef.current && sessionActiveRef.current) {
      void requestStream();
    }
  }, [selectedDeviceId, requestStream]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;
    void enumerate();
    const onDeviceChange = () => {
      void enumerate();
    };
    navigator.mediaDevices.addEventListener?.('devicechange', onDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener?.(
        'devicechange',
        onDeviceChange
      );
    };
  }, [enumerate]);

  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      stopStreamInternal();
    };
  }, [stopStreamInternal]);

  const registerVideoRef = useCallback(
    (ref: RefObject<HTMLVideoElement | null>) => {
      setRegisteredRef(ref);
    },
    []
  );

  const value: CameraContextType = {
    videoRef,
    registerVideoRef,
    isCameraActive,
    isLoading,
    permissionState,
    errorType,
    errorMessage,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    setSessionActive,
    requestStream,
    stopStream,
  };

  return (
    <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
  );
}

export function useCameraContext(): CameraContextType {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCameraContext must be used within a CameraProvider.');
  }
  return context;
}

export function useCameraContextSafe(): CameraContextType | null {
  return useContext(CameraContext);
}
