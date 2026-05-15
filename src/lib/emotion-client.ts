import { getBackendBaseUrl } from '@/lib/backend-auth';
import type {
  EmotionTransportSnapshot,
  StopRecordingReason,
} from '@/features/camera/types';

export interface StartEmotionSessionPayload {
  sessionType: 'pomodoro' | 'study' | 'other';
  metadata?: {
    activityName?: string;
    deckId?: string;
  };
}

export interface StartEmotionSessionResponse {
  sessionId: string;
  startedAt: string;
  status: string;
}

export interface SubmitEmotionSnapshotsPayload {
  snapshots: EmotionTransportSnapshot[];
}

interface EmotionApiSnapshot {
  emotion: EmotionTransportSnapshot['emotion'];
  gaze: EmotionTransportSnapshot['gaze'];
  confusion: boolean;
  timestamp: number;
  confidence?: number;
}

export interface SubmitEmotionSnapshotsResponse {
  received: number;
  processed: number;
  status: string;
}

export interface EndEmotionSessionPayload {
  endedAt: string;
  reason?: StopRecordingReason;
  sessionStats?: {
    totalSnapshots: number;
    dominantEmotion: string;
    confusionCount: number;
  };
}

export interface EndEmotionSessionResponse {
  sessionId: string;
  duration?: string;
  snapshotCount?: number;
  status?: string;
  analysis?: {
    focusScore?: number;
    confusionRate?: number;
    emotionBreakdown?: Record<string, number>;
  };
}

export class EmotionApiError extends Error {
  status: number;
  retryAfterMs: number | null;

  constructor(message: string, status: number, retryAfterMs: number | null) {
    super(message);
    this.name = 'EmotionApiError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function toEmotionApiSnapshot(
  snapshot: EmotionTransportSnapshot
): EmotionApiSnapshot {
  return {
    emotion: snapshot.emotion,
    gaze: snapshot.gaze,
    confusion: snapshot.confusion,
    timestamp: snapshot.client_ts,
    confidence: snapshot.confidence,
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Record<
      string,
      string
    >;
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterSeconds = retryAfterHeader
      ? Number.parseFloat(retryAfterHeader)
      : Number.NaN;
    const retryAfterMs = Number.isFinite(retryAfterSeconds)
      ? retryAfterSeconds * 1000
      : null;

    throw new EmotionApiError(
      body.error ?? body.message ?? `HTTP ${response.status}`,
      response.status,
      retryAfterMs
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const emotionClient = {
  startSession: (payload: StartEmotionSessionPayload) =>
    request<StartEmotionSessionResponse>('/emotion/sessions/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitSnapshots: (
    sessionId: string,
    payload: SubmitEmotionSnapshotsPayload
  ) =>
    request<SubmitEmotionSnapshotsResponse>(
      `/emotion/sessions/${sessionId}/data`,
      {
        method: 'POST',
        body: JSON.stringify({
          snapshots: payload.snapshots.map(toEmotionApiSnapshot),
        }),
      }
    ),

  endSession: (sessionId: string, payload: EndEmotionSessionPayload) =>
    request<EndEmotionSessionResponse>(`/emotion/sessions/${sessionId}/end`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
