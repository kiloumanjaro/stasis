/**
 * CV (Computer Vision) Data Types
 * Type definitions for browser-based face detection using face-api.js
 */

/**
 * Response from face detection analysis
 */
export interface CVResponse {
  /** Detected emotion state */
  emotion: 'focused' | 'distracted' | 'tired' | 'confused' | 'neutral' | string;
  /** Gaze direction relative to screen */
  gaze: 'center' | 'left' | 'right' | 'up' | 'down' | 'away' | string;
  /** Whether confusion is detected */
  confusion: boolean;
  /** Timestamp of the analysis */
  timestamp: number;
  /** Optional confidence score (0-1) */
  confidence?: number;
}

/**
 * Connection status for face detection system
 * Note: 'connected' means models are loaded and ready
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Snapshot of emotion data for history tracking
 */
export interface EmotionSnapshot {
  /** The detected emotion at this point in time */
  emotion: CVResponse['emotion'];
  /** Gaze direction at this point */
  gaze: CVResponse['gaze'];
  /** Whether confusion was detected */
  confusion: boolean;
  /** Timestamp when this snapshot was recorded */
  timestamp: number;
  /** Optional confidence score */
  confidence?: number;
}
