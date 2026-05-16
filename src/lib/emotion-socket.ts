import { io, type Socket } from 'socket.io-client';
import { getBackendBaseUrl } from '@/lib/backend-auth';
import type { EmotionTransportSnapshot } from '@/features/camera/types';

export interface EmotionSocketFrame extends EmotionTransportSnapshot {
  sessionId: string;
}

export interface InterventionTrigger {
  interventionId: string;
  type: 'INTERVENTION';
  action: 'MEME_RESET' | 'SHORT_BREAK' | 'LONG_BREAK';
  duration: number;
  reason: string;
  dismissible: boolean;
  sessionId: string;
}

export interface InterventionFeedback {
  interventionId: string;
  sessionId: string;
  action: string;
  outcome: 'dismissed' | 'completed' | 'extended';
  timestamp: number;
}

let socket: Socket | null = null;

function ensureSocket() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!socket) {
    socket = io(getBackendBaseUrl(), {
      autoConnect: false,
      reconnection: true,
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
  }

  return socket;
}

export function connectEmotionSocket() {
  const nextSocket = ensureSocket();
  if (!nextSocket) {
    return null;
  }

  if (!nextSocket.connected) {
    nextSocket.connect();
  }

  return nextSocket;
}

export function disconnectEmotionSocket() {
  const currentSocket = ensureSocket();
  if (!currentSocket) {
    return;
  }

  if (currentSocket.connected) {
    currentSocket.disconnect();
  }
}

export function getEmotionSocket() {
  return ensureSocket();
}

export function emitEmotionFrame(frame: EmotionSocketFrame) {
  const currentSocket = ensureSocket();
  if (!currentSocket?.connected) {
    return false;
  }

  // Backend expects 'timestamp'; transport snapshot uses 'client_ts'
  currentSocket.emit('emotion:frame', {
    sessionId: frame.sessionId,
    timestamp: frame.client_ts,
    emotion: frame.emotion,
    gaze: frame.gaze,
    confidence: frame.confidence ?? 1.0,
  });
  return true;
}

export function onInterventionTrigger(cb: (t: InterventionTrigger) => void) {
  ensureSocket()?.on('intervention:trigger', cb);
}

export function offInterventionTrigger(cb: (t: InterventionTrigger) => void) {
  ensureSocket()?.off('intervention:trigger', cb);
}

export function emitInterventionFeedback(feedback: InterventionFeedback) {
  ensureSocket()?.emit('intervention:feedback', feedback);
}
