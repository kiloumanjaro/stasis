'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';

/**
 * Camera Context Type Definition
 * Provides shared access to the video element and camera state
 */
interface CameraContextType {
  /** Reference to the video element from the camera widget */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Whether the camera is currently active and streaming */
  isCameraActive: boolean;
  /** Register a video element reference from the camera widget */
  registerVideoRef: (ref: RefObject<HTMLVideoElement | null>) => void;
  /** Update the camera active state */
  setCameraActive: (active: boolean) => void;
}

/**
 * Camera Context
 * Shares the video element reference between camera widget and CV monitor
 */
const CameraContext = createContext<CameraContextType | null>(null);

/**
 * Camera Provider Props
 */
interface CameraProviderProps {
  children: ReactNode;
}

/**
 * Camera Provider Component
 * Wraps components that need access to the shared camera video element
 */
export function CameraProvider({ children }: CameraProviderProps) {
  // Internal ref that will be updated when the camera widget registers its ref
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Track the registered video ref from the camera widget
  const [registeredRef, setRegisteredRef] =
    useState<RefObject<HTMLVideoElement | null> | null>(null);

  // Track whether the camera is actively streaming
  const [isCameraActive, setIsCameraActive] = useState(false);

  /**
   * Register a video element reference from the camera widget
   * This allows other components to access the same video stream
   */
  const registerVideoRef = useCallback(
    (ref: RefObject<HTMLVideoElement | null>) => {
      setRegisteredRef(ref);
    },
    []
  );

  /**
   * Update the camera active state
   * Called by the camera widget when the stream starts/stops
   */
  const setCameraActive = useCallback((active: boolean) => {
    setIsCameraActive(active);
  }, []);

  // Use the registered ref if available, otherwise use the internal ref
  const videoRef = registeredRef ?? internalVideoRef;

  const value: CameraContextType = {
    videoRef,
    isCameraActive,
    registerVideoRef,
    setCameraActive,
  };

  return (
    <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
  );
}

/**
 * Hook to access the Camera Context
 * @throws Error if used outside of CameraProvider
 */
export function useCameraContext(): CameraContextType {
  const context = useContext(CameraContext);

  if (!context) {
    throw new Error(
      'useCameraContext must be used within a CameraProvider. ' +
        'Make sure to wrap your component tree with <CameraProvider>.'
    );
  }

  return context;
}

/**
 * Hook to safely access the Camera Context (returns null if not available)
 * Use this when the context is optional
 */
export function useCameraContextSafe(): CameraContextType | null {
  return useContext(CameraContext);
}
