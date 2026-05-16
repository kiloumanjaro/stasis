'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { useFaceApiCV } from '../hooks/useFaceApiCV';
import { useCameraContextSafe } from './CameraContext';
import type { CVResponse, EmotionSnapshot } from '../types';

/**
 * Configuration for history tracking
 */
const HISTORY_CONFIG = {
  /** Maximum history entries to keep */
  maxHistoryLength: 100,
} as const;

/**
 * CV Context Type Definition
 * Provides CV analysis data and connection state
 */
interface CVContextType {
  /** Latest CV analysis data from face detection */
  latestData: CVResponse | null;
  /** Whether face detection models are loaded and active */
  isConnected: boolean;
  /** History of emotion snapshots for trend analysis */
  history: EmotionSnapshot[];
  /** Current connection error if any */
  error: string | null;
  /** Whether the camera is active and detection is running */
  isCapturing: boolean;
}

/**
 * CV Context
 * Provides CV analysis data to consumer components
 */
const CVContext = createContext<CVContextType | null>(null);

/**
 * CV Provider Props
 */
interface CVProviderProps {
  children: ReactNode;
}

/**
 * CV Provider Component
 * Manages browser-based face detection using face-api.js
 *
 * This provider:
 * - Consumes the camera video element from CameraContext
 * - Manages face detection via useFaceApiCV hook
 * - Maintains a history of emotion snapshots for trend analysis
 * - Processes everything client-side (no video transmission)
 */
export function CVProvider({ children }: CVProviderProps) {
  // Consume camera context to access video element
  const cameraContext = useCameraContextSafe();
  const videoRef = cameraContext?.videoRef;
  const isCameraActive = cameraContext?.isCameraActive ?? false;

  // Use face-api.js hook for face detection
  const { connectionStatus, latestCVData, error, isModelLoaded } =
    useFaceApiCV(videoRef);

  // Refs for history tracking
  const historyRef = useRef<EmotionSnapshot[]>([]);

  // Derived state
  const isConnected = connectionStatus === 'connected' && isModelLoaded;
  const isCapturing = isConnected && isCameraActive;

  /**
   * Add a snapshot to the history
   * Maintains maximum history length by removing oldest entries
   */
  const addToHistory = useCallback((data: CVResponse) => {
    const snapshot: EmotionSnapshot = {
      emotion: data.emotion,
      gaze: data.gaze,
      confusion: data.confusion,
      timestamp: data.timestamp,
      confidence: data.confidence,
    };

    historyRef.current = [
      ...historyRef.current.slice(-(HISTORY_CONFIG.maxHistoryLength - 1)),
      snapshot,
    ];
  }, []);

  /**
   * Update history when new CV data is received
   */
  useEffect(() => {
    if (latestCVData) {
      addToHistory(latestCVData);
    }
  }, [latestCVData, addToHistory]);

  const value: CVContextType = {
    latestData: latestCVData,
    isConnected,
    history: historyRef.current,
    error,
    isCapturing,
  };

  return <CVContext.Provider value={value}>{children}</CVContext.Provider>;
}

/**
 * Hook to access the CV Context
 * @throws Error if used outside of CVProvider
 */
export function useCVContext(): CVContextType {
  const context = useContext(CVContext);

  if (!context) {
    throw new Error(
      'useCVContext must be used within a CVProvider. ' +
        'Make sure to wrap your component tree with <CVProvider>.'
    );
  }

  return context;
}

/**
 * Hook to safely access the CV Context (returns null if not available)
 * Use this when the context is optional
 */
export function useCVContextSafe(): CVContextType | null {
  return useContext(CVContext);
}
