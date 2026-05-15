import { io, type Socket } from 'socket.io-client';
import { getBackendBaseUrl } from '@/lib/backend-auth';
import type { EmotionTransportSnapshot } from '@/features/camera/types';

export interface EmotionSocketFrame extends EmotionTransportSnapshot {
  sessionId: string;
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

  currentSocket.emit('emotion:frame', frame);
  return true;
}
