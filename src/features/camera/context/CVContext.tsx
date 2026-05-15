'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  EmotionApiError,
  emotionClient,
  type EndEmotionSessionPayload,
} from '@/lib/emotion-client';
import {
  connectEmotionSocket,
  disconnectEmotionSocket,
  emitEmotionFrame,
  getEmotionSocket,
} from '@/lib/emotion-socket';
import { useFaceApiCV } from '../hooks/useFaceApiCV';
import { useCameraContextSafe } from './CameraContext';
import type {
  ConnectionStatus,
  CVResponse,
  EmotionRecordingState,
  EmotionSnapshot,
  EmotionTransportSnapshot,
  StopRecordingReason,
} from '../types';

const HISTORY_CONFIG = {
  maxHistoryLength: 100,
} as const;

const RECORDING_CONFIG = {
  minPersistConfidence: 0.5,
  sampleIntervalMs: 1000,
  flushIntervalMs: 5000,
  defaultBackoffMs: 10000,
} as const;

interface CVContextType {
  latestData: CVResponse | null;
  isConnected: boolean;
  localStatus: ConnectionStatus;
  history: EmotionSnapshot[];
  error: string | null;
  cameraError: string | null;
  syncError: string | null;
  isCapturing: boolean;
  isSocketConnected: boolean;
  recordingState: EmotionRecordingState;
  sessionId: string | null;
  pendingSnapshotCount: number;
  startRecordingSession: () => Promise<string | null>;
  stopRecordingSession: (reason?: StopRecordingReason) => Promise<void>;
  flushPendingSnapshots: () => Promise<void>;
}

const CVContext = createContext<CVContextType | null>(null);

interface CVProviderProps {
  children: ReactNode;
}

function toEmotionSnapshot(data: CVResponse): EmotionSnapshot {
  return {
    emotion: data.emotion,
    gaze: data.gaze,
    confusion: data.confusion,
    timestamp: data.timestamp,
    confidence: data.confidence,
  };
}

function toTransportSnapshot(data: CVResponse): EmotionTransportSnapshot {
  return {
    emotion: data.emotion,
    gaze: data.gaze,
    confusion: data.confusion,
    client_ts: data.timestamp,
    confidence: data.confidence,
  };
}

function getEndSessionStats(sessionSummary: {
  totalSnapshots: number;
  confusionCount: number;
  emotionCounts: Record<string, number>;
}): EndEmotionSessionPayload['sessionStats'] {
  const dominantEmotion =
    Object.entries(sessionSummary.emotionCounts).sort(
      ([, left], [, right]) => right - left
    )[0]?.[0] ?? 'neutral';

  return {
    totalSnapshots: sessionSummary.totalSnapshots,
    dominantEmotion,
    confusionCount: sessionSummary.confusionCount,
  };
}

export function CVProvider({ children }: CVProviderProps) {
  const cameraContext = useCameraContextSafe();
  const videoRef = cameraContext?.videoRef;
  const isCameraActive = cameraContext?.isCameraActive ?? false;
  const cameraError = cameraContext?.errorMessage ?? null;

  const { connectionStatus, latestCVData, error, isModelLoaded } =
    useFaceApiCV(videoRef);

  const [history, setHistory] = useState<EmotionSnapshot[]>([]);
  const [recordingState, setRecordingState] =
    useState<EmotionRecordingState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingSnapshotCount, setPendingSnapshotCount] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const historyRef = useRef<EmotionSnapshot[]>([]);
  const recordingStateRef = useRef<EmotionRecordingState>('idle');
  const requestedRecordingRef = useRef(false);
  const activeSessionIdRef = useRef<string | null>(null);
  const flushInFlightRef = useRef<Promise<void> | null>(null);
  const startPromiseRef = useRef<Promise<string | null> | null>(null);
  const stopPromiseRef = useRef<Promise<void> | null>(null);
  const queueRef = useRef<EmotionTransportSnapshot[]>([]);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backoffUntilRef = useRef(0);
  const lastSampleAtRef = useRef(0);
  const sessionSummaryRef = useRef<{
    totalSnapshots: number;
    confusionCount: number;
    emotionCounts: Record<string, number>;
  }>({
    totalSnapshots: 0,
    confusionCount: 0,
    emotionCounts: {},
  });

  const localStatus: ConnectionStatus = cameraError
    ? 'error'
    : connectionStatus;
  const isConnected = localStatus === 'connected' && isModelLoaded;
  const isCapturing = isConnected && isCameraActive;

  const setRecordingStateSafe = useCallback((next: EmotionRecordingState) => {
    recordingStateRef.current = next;
    setRecordingState(next);
  }, []);

  const resetSessionSummary = useCallback(() => {
    sessionSummaryRef.current = {
      totalSnapshots: 0,
      confusionCount: 0,
      emotionCounts: {},
    };
  }, []);

  const setQueue = useCallback((nextQueue: EmotionTransportSnapshot[]) => {
    queueRef.current = nextQueue;
    setPendingSnapshotCount(nextQueue.length);
  }, []);

  const flushPendingSnapshots = useCallback(async () => {
    const currentSessionId = activeSessionIdRef.current;

    if (!currentSessionId || queueRef.current.length === 0) {
      return;
    }

    if (backoffUntilRef.current > Date.now()) {
      return;
    }

    if (flushInFlightRef.current) {
      return flushInFlightRef.current;
    }

    const batch = queueRef.current.slice();
    const flushPromise = (async () => {
      const previousState = recordingStateRef.current;
      setRecordingStateSafe('flushing');

      try {
        await emotionClient.submitSnapshots(currentSessionId, {
          snapshots: batch,
        });

        setQueue(queueRef.current.slice(batch.length));
        backoffUntilRef.current = 0;
        setSyncError(null);

        if (activeSessionIdRef.current) {
          setRecordingStateSafe('recording');
        } else {
          setRecordingStateSafe(previousState);
        }
      } catch (flushError) {
        if (
          flushError instanceof EmotionApiError &&
          flushError.status === 429
        ) {
          backoffUntilRef.current =
            Date.now() +
            (flushError.retryAfterMs ?? RECORDING_CONFIG.defaultBackoffMs);
        }

        setSyncError(
          flushError instanceof Error
            ? flushError.message
            : 'Failed to sync emotion snapshots.'
        );
        setRecordingStateSafe('error');
      } finally {
        flushInFlightRef.current = null;
      }
    })();

    flushInFlightRef.current = flushPromise;
    return flushPromise;
  }, [setQueue, setRecordingStateSafe]);

  const beginRecordingSession = useCallback(async (): Promise<
    string | null
  > => {
    if (!requestedRecordingRef.current) {
      return null;
    }

    if (activeSessionIdRef.current) {
      return activeSessionIdRef.current;
    }

    if (startPromiseRef.current) {
      return startPromiseRef.current;
    }

    if (!isCapturing) {
      return null;
    }

    setRecordingStateSafe('starting');
    setSyncError(null);

    const startPromise = emotionClient
      .startSession({
        sessionType: 'pomodoro',
        metadata: {
          activityName: 'focus-session',
        },
      })
      .then((response) => {
        activeSessionIdRef.current = response.sessionId;
        setSessionId(response.sessionId);
        setQueue([]);
        resetSessionSummary();
        backoffUntilRef.current = 0;
        connectEmotionSocket();
        setRecordingStateSafe('recording');
        return response.sessionId;
      })
      .catch((startError) => {
        requestedRecordingRef.current = false;
        activeSessionIdRef.current = null;
        setSessionId(null);
        setSyncError(
          startError instanceof Error
            ? startError.message
            : 'Failed to start emotion recording.'
        );
        setRecordingStateSafe('error');
        return null;
      })
      .finally(() => {
        startPromiseRef.current = null;
      });

    startPromiseRef.current = startPromise;
    return startPromise;
  }, [isCapturing, resetSessionSummary, setQueue, setRecordingStateSafe]);

  const stopRecordingSession = useCallback(
    async (reason: StopRecordingReason = 'pause') => {
      requestedRecordingRef.current = false;

      if (stopPromiseRef.current) {
        return stopPromiseRef.current;
      }

      const stopPromise = (async () => {
        const startedSessionId =
          activeSessionIdRef.current ?? (await startPromiseRef.current);

        if (!startedSessionId) {
          disconnectEmotionSocket();
          setQueue([]);
          setSessionId(null);
          setSyncError((currentError) =>
            reason === 'camera-stop' && !currentError
              ? 'Emotion recording stopped because the camera became unavailable.'
              : currentError
          );
          setRecordingStateSafe('idle');
          return;
        }

        setRecordingStateSafe('ending');

        try {
          await flushPendingSnapshots();

          await emotionClient.endSession(startedSessionId, {
            endedAt: new Date().toISOString(),
            reason,
            sessionStats: getEndSessionStats(sessionSummaryRef.current),
          });

          setSyncError(null);
          setRecordingStateSafe('idle');
        } catch (endError) {
          setSyncError(
            endError instanceof Error
              ? endError.message
              : 'Failed to finish emotion recording.'
          );
          setRecordingStateSafe('error');
        } finally {
          disconnectEmotionSocket();
          activeSessionIdRef.current = null;
          setSessionId(null);
          setQueue([]);
          backoffUntilRef.current = 0;
          resetSessionSummary();
        }
      })().finally(() => {
        stopPromiseRef.current = null;
      });

      stopPromiseRef.current = stopPromise;
      return stopPromise;
    },
    [
      flushPendingSnapshots,
      resetSessionSummary,
      setQueue,
      setRecordingStateSafe,
    ]
  );

  const startRecordingSession = useCallback(async () => {
    requestedRecordingRef.current = true;
    setSyncError(null);
    return beginRecordingSession();
  }, [beginRecordingSession]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    const socket = getEmotionSocket();
    if (!socket) {
      return;
    }

    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);

    setIsSocketConnected(socket.connected);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  useEffect(() => {
    if (requestedRecordingRef.current && isCapturing) {
      void beginRecordingSession();
    }
  }, [beginRecordingSession, isCapturing]);

  useEffect(() => {
    if (!activeSessionIdRef.current) {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      return;
    }

    flushIntervalRef.current = setInterval(() => {
      void flushPendingSnapshots();
    }, RECORDING_CONFIG.flushIntervalMs);

    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
    };
  }, [flushPendingSnapshots, sessionId]);

  useEffect(() => {
    if (!latestCVData) {
      return;
    }

    const sampleTimestamp = latestCVData.timestamp;
    if (
      sampleTimestamp - lastSampleAtRef.current <
      RECORDING_CONFIG.sampleIntervalMs
    ) {
      return;
    }

    if (
      latestCVData.confidence !== undefined &&
      latestCVData.confidence < RECORDING_CONFIG.minPersistConfidence
    ) {
      return;
    }

    lastSampleAtRef.current = sampleTimestamp;

    const sampledSnapshot = toEmotionSnapshot(latestCVData);
    const nextHistory = [
      ...historyRef.current.slice(-(HISTORY_CONFIG.maxHistoryLength - 1)),
      sampledSnapshot,
    ];
    historyRef.current = nextHistory;
    setHistory(nextHistory);

    const transportSnapshot = toTransportSnapshot(latestCVData);

    if (!activeSessionIdRef.current || !requestedRecordingRef.current) {
      return;
    }

    sessionSummaryRef.current.totalSnapshots += 1;
    if (transportSnapshot.confusion) {
      sessionSummaryRef.current.confusionCount += 1;
    }
    sessionSummaryRef.current.emotionCounts[transportSnapshot.emotion] =
      (sessionSummaryRef.current.emotionCounts[transportSnapshot.emotion] ??
        0) + 1;

    setQueue([...queueRef.current, transportSnapshot]);
    emitEmotionFrame({
      sessionId: activeSessionIdRef.current,
      ...transportSnapshot,
    });
  }, [latestCVData, setQueue]);

  useEffect(() => {
    if (
      requestedRecordingRef.current &&
      activeSessionIdRef.current &&
      !isCameraActive
    ) {
      void stopRecordingSession('camera-stop');
    }
  }, [isCameraActive, stopRecordingSession]);

  useEffect(() => {
    return () => {
      requestedRecordingRef.current = false;
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
      void stopRecordingSession('camera-stop');
      disconnectEmotionSocket();
    };
  }, [stopRecordingSession]);

  const value = useMemo<CVContextType>(
    () => ({
      latestData: latestCVData,
      isConnected,
      localStatus,
      history,
      error,
      cameraError,
      syncError,
      isCapturing,
      isSocketConnected,
      recordingState,
      sessionId,
      pendingSnapshotCount,
      startRecordingSession,
      stopRecordingSession,
      flushPendingSnapshots,
    }),
    [
      cameraError,
      error,
      flushPendingSnapshots,
      history,
      isCapturing,
      isConnected,
      isSocketConnected,
      latestCVData,
      localStatus,
      pendingSnapshotCount,
      recordingState,
      sessionId,
      startRecordingSession,
      stopRecordingSession,
      syncError,
    ]
  );

  return <CVContext.Provider value={value}>{children}</CVContext.Provider>;
}

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

export function useCVContextSafe(): CVContextType | null {
  return useContext(CVContext);
}
