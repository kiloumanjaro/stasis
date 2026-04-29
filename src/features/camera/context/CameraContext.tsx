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
  stream: MediaStream | null;

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

const CameraContext = createContext<CameraContextType | null>(null);

export function CameraProvider({ children }: { children: ReactNode }) {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const [registeredRef, setRegisteredRef] =
    useState<RefObject<HTMLVideoElement | null> | null>(null);
  const videoRef = registeredRef ?? internalVideoRef;

  const streamRef = useRef<MediaStream | null>(null);
  const sessionActiveRef = useRef(false);
  const userPickedDeviceRef = useRef(false);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] =
    useState<CameraPermissionState>('unknown');
  const [errorType, setErrorType] = useState<CameraErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceIdState] = useState<string>('');

  const stopStreamInternal = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
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
      const videoDevices = all
        .filter((d) => d.kind === 'videoinput' && d.deviceId)
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));
      setDevices(videoDevices);
      setSelectedDeviceIdState((prev) =>
        prev && videoDevices.some((d) => d.deviceId === prev) ? prev : ''
      );
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

    // Mark active so the late-resolution guard below doesn't tear down the
    // stream the user explicitly asked for.
    sessionActiveRef.current = true;

    stopStreamInternal();

    const videoConstraint: MediaTrackConstraints =
      userPickedDeviceRef.current && selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId }, facingMode: 'user' }
        : { facingMode: 'user' };

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraint,
        audio: false,
      });

      if (!sessionActiveRef.current) {
        newStream.getTracks().forEach((t) => t.stop());
        setIsLoading(false);
        return;
      }

      streamRef.current = newStream;
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
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
    if (!selectedDeviceId) return;
    void requestStream();
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
      if (ref.current && streamRef.current) {
        ref.current.srcObject = streamRef.current;
      }
    },
    []
  );

  const value: CameraContextType = {
    videoRef,
    registerVideoRef,
    stream,
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
