'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import type { CVResponse, ConnectionStatus } from '../types';

/**
 * Return type for useFaceApiCV hook (compatible with useWebSocketCV)
 */
export interface UseFaceApiCVReturn {
  /** Current connection status (models loaded = connected) */
  connectionStatus: ConnectionStatus;
  /** Latest CV analysis data */
  latestCVData: CVResponse | null;
  /** Error message if any */
  error: string | null;
  /** Whether face-api.js models are loaded */
  isModelLoaded: boolean;
}

/**
 * Configuration for face detection
 */
const DETECTION_CONFIG = {
  /** Model URL path (relative to public directory) */
  modelPath: '/models',
  /** Target FPS for detection loop (will use requestAnimationFrame) */
  targetFPS: 30,
  /** Minimum confidence threshold for emotion detection */
  minConfidence: 0.3,
  /** Confidence threshold for "competing emotions" detection */
  competingEmotionThreshold: 0.1,
} as const;

/**
 * Map face-api.js 7 basic emotions to study-specific states
 *
 * Mapping Strategy:
 * - focused: high happiness or high neutral (engaged state)
 * - neutral: medium neutral, all others low (balanced state)
 * - distracted: high surprise or multiple competing emotions
 * - tired: high sadness
 * - confused: high negative emotions (fearful, disgusted, angry)
 */
function mapEmotionsToCVResponse(
  expressions: faceapi.FaceExpressions
): CVResponse {
  const emotionScores = {
    neutral: expressions.neutral,
    happy: expressions.happy,
    sad: expressions.sad,
    angry: expressions.angry,
    fearful: expressions.fearful,
    disgusted: expressions.disgusted,
    surprised: expressions.surprised,
  };

  // Find dominant emotion and second-highest for competition detection
  const sortedEmotions = Object.entries(emotionScores).sort(
    ([, a], [, b]) => b - a
  );
  const [dominantEmotion, dominantScore] = sortedEmotions[0];
  const [, secondScore] = sortedEmotions[1];

  // Calculate overall confidence (highest emotion score)
  const confidence = dominantScore;

  // Detect competing emotions (top 2 emotions within threshold)
  const hasCompetingEmotions =
    Math.abs(dominantScore - secondScore) <
    DETECTION_CONFIG.competingEmotionThreshold;

  // Map to study state
  let studyEmotion: CVResponse['emotion'];
  let confusion = false;

  // Check for confusion indicators first
  if (
    emotionScores.fearful > 0.2 ||
    emotionScores.disgusted > 0.2 ||
    hasCompetingEmotions
  ) {
    confusion = true;
  }

  // Map dominant emotion to study state
  if (emotionScores.happy > 0.4 || emotionScores.neutral > 0.6) {
    // High happiness or high neutral = focused
    studyEmotion = 'focused';
  } else if (emotionScores.surprised > 0.3 || hasCompetingEmotions) {
    // High surprise or competing emotions = distracted
    studyEmotion = 'distracted';
  } else if (emotionScores.sad > 0.3) {
    // High sadness = tired
    studyEmotion = 'tired';
  } else if (
    emotionScores.fearful > 0.25 ||
    emotionScores.disgusted > 0.25 ||
    emotionScores.angry > 0.25
  ) {
    // Any negative emotion = confused
    studyEmotion = 'confused';
  } else if (
    emotionScores.neutral >= 0.4 &&
    emotionScores.neutral <= 0.6 &&
    dominantEmotion === 'neutral'
  ) {
    // Medium neutral with low other emotions = neutral
    studyEmotion = 'neutral';
  } else {
    // Fallback based on dominant emotion
    const emotionMap: Record<string, CVResponse['emotion']> = {
      neutral: 'neutral',
      happy: 'focused',
      sad: 'tired',
      angry: 'confused',
      fearful: 'confused',
      disgusted: 'confused',
      surprised: 'distracted',
    };
    studyEmotion = emotionMap[dominantEmotion] || 'neutral';
  }

  return {
    emotion: studyEmotion,
    gaze: 'center', // face-api.js doesn't support gaze detection
    confusion,
    timestamp: Date.now(),
    confidence,
  };
}

/**
 * Hook for managing browser-based face detection using face-api.js
 *
 * Features:
 * - Loads face detection models on mount
 * - Runs detection loop using requestAnimationFrame
 * - Maps 7 basic emotions to 5 study-specific states
 * - Compatible with useWebSocketCV interface for drop-in replacement
 *
 * @param videoRef - Reference to the video element to analyze
 * @returns Face API CV hook interface
 */
export function useFaceApiCV(
  // Change: Add | null to the RefObject inner type
  videoRef: React.RefObject<HTMLVideoElement | null> | undefined
): UseFaceApiCVReturn {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [latestCVData, setLatestCVData] = useState<CVResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);

  const detectionLoopRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const isUnmountingRef = useRef<boolean>(false);

  /**
   * Load face-api.js models
   */
  const loadModels = useCallback(async () => {
    if (isUnmountingRef.current) return;

    setConnectionStatus('connecting');
    setError(null);

    try {
      const modelPath = DETECTION_CONFIG.modelPath;

      // Load required models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
        faceapi.nets.faceExpressionNet.loadFromUri(modelPath),
      ]);

      if (isUnmountingRef.current) return;

      setIsModelLoaded(true);
      setConnectionStatus('connected');
      setError(null);
    } catch (err) {
      if (isUnmountingRef.current) return;

      console.error('Failed to load face-api.js models:', err);
      setConnectionStatus('error');
      setError(
        'Failed to load face detection models. Please refresh the page.'
      );
      setIsModelLoaded(false);
    }
  }, []);

  /**
   * Run single detection cycle
   */
  const runDetection = useCallback(async () => {
    const video = videoRef?.current;

    if (
      !video ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      !isModelLoaded
    ) {
      return;
    }

    try {
      // Run detection with tiny face detector + expressions
      const detections = await faceapi
        .detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5,
          })
        )
        .withFaceExpressions();

      if (isUnmountingRef.current) return;

      // Process only the first face (single user assumption)
      if (detections.length > 0) {
        const firstDetection = detections[0];
        const cvResponse = mapEmotionsToCVResponse(firstDetection.expressions);
        setLatestCVData(cvResponse);
        setError(null);
      } else {
        // No face detected - don't update data, keep showing last result
        // This prevents flickering when face temporarily leaves frame
      }
    } catch (err) {
      if (isUnmountingRef.current) return;

      console.error('Face detection error:', err);
      setError('Face detection error. Please check your camera.');
    }
  }, [videoRef, isModelLoaded]);

  /**
   * Detection loop using requestAnimationFrame
   * Throttled to target FPS to prevent excessive CPU usage
   */
  const startDetectionLoop = useCallback(() => {
    const minFrameInterval = 1000 / DETECTION_CONFIG.targetFPS;

    const loop = async (timestamp: number) => {
      if (isUnmountingRef.current) return;

      // Throttle to target FPS
      if (timestamp - lastDetectionTimeRef.current >= minFrameInterval) {
        await runDetection();
        lastDetectionTimeRef.current = timestamp;
      }

      // Schedule next frame
      if (!isUnmountingRef.current) {
        detectionLoopRef.current = requestAnimationFrame(loop);
      }
    };

    detectionLoopRef.current = requestAnimationFrame(loop);
  }, [runDetection]);

  /**
   * Stop detection loop
   */
  const stopDetectionLoop = useCallback(() => {
    if (detectionLoopRef.current !== null) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
  }, []);

  /**
   * Load models on mount
   */
  useEffect(() => {
    isUnmountingRef.current = false;
    loadModels();

    return () => {
      isUnmountingRef.current = true;
      stopDetectionLoop();
    };
  }, [loadModels, stopDetectionLoop]);

  /**
   * Start/stop detection loop based on model and video readiness
   */
  useEffect(() => {
    const video = videoRef?.current;
    if (!video) {
      stopDetectionLoop();
      return;
    }

    const syncLoopState = () => {
      const shouldRun =
        isModelLoaded && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;

      if (shouldRun && detectionLoopRef.current === null) {
        startDetectionLoop();
      } else if (!shouldRun && detectionLoopRef.current !== null) {
        stopDetectionLoop();
      }
    };

    syncLoopState();

    const handleLoaded = () => syncLoopState();
    const handleStopped = () => stopDetectionLoop();

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('playing', handleLoaded);
    video.addEventListener('canplay', handleLoaded);
    video.addEventListener('pause', handleStopped);
    video.addEventListener('emptied', handleStopped);
    video.addEventListener('ended', handleStopped);

    const tracks =
      video.srcObject instanceof MediaStream ? video.srcObject.getTracks() : [];
    tracks.forEach((track) => {
      track.addEventListener('ended', handleStopped);
    });

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('playing', handleLoaded);
      video.removeEventListener('canplay', handleLoaded);
      video.removeEventListener('pause', handleStopped);
      video.removeEventListener('emptied', handleStopped);
      video.removeEventListener('ended', handleStopped);
      tracks.forEach((track) => {
        track.removeEventListener('ended', handleStopped);
      });
      stopDetectionLoop();
    };
  }, [isModelLoaded, videoRef, startDetectionLoop, stopDetectionLoop]);

  return {
    connectionStatus,
    latestCVData,
    error,
    isModelLoaded,
  };
}
