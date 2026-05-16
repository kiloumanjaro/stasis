'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as faceapi from 'face-api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Footer } from '@/components/dashboard/Footer';
import {
  Camera,
  CameraOff,
  Loader2,
  Video,
  VideoOff,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Activity,
  Meh,
  Frown,
  Shuffle,
} from 'lucide-react';
import {
  readSettingsProfile,
  saveSettingsProfile,
  readEmotionHistory,
  saveEmotionSession,
  type EmotionSessionRecord,
  type EmotionSessionEntry,
  type PrivacyComfort,
  type ExpressionTolerance,
} from '@/lib/frontend-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmotionData {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

type CameraState =
  | 'idle'
  | 'requesting-permission'
  | 'loading-models'
  | 'active'
  | 'denied'
  | 'error';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMOTION_COLORS: Record<string, string> = {
  neutral: '#6b7280',
  happy: '#eab308',
  sad: '#3b82f6',
  angry: '#ef4444',
  fearful: '#a855f7',
  disgusted: '#22c55e',
  surprised: '#f97316',
};

const EMOTION_EMOJIS: Record<string, string> = {
  neutral: '😐',
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fearful: '😨',
  disgusted: '🤢',
  surprised: '😲',
};

const EMOTION_BG_CLASSES: Record<string, string> = {
  neutral: 'bg-gray-500',
  happy: 'bg-yellow-500',
  sad: 'bg-blue-500',
  angry: 'bg-red-500',
  fearful: 'bg-purple-500',
  disgusted: 'bg-green-500',
  surprised: 'bg-orange-500',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CVContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionEntriesRef = useRef<EmotionSessionEntry[]>([]);
  const sessionStartRef = useRef<number>(0);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<EmotionData | null>(null);
  const [dominantEmotion, setDominantEmotion] = useState<string | null>(null);

  const [privacyComfort, setPrivacyComfort] =
    useState<PrivacyComfort>('visible');
  const [expressionTolerance, setExpressionTolerance] =
    useState<ExpressionTolerance>('neutral');
  const [pastSessions, setPastSessions] = useState<EmotionSessionRecord[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null
  );

  // Recalibration state
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [recalibrationProgress, setRecalibrationProgress] = useState(0);
  const recalibrationDataRef = useRef<number[]>([]);

  // Load settings and history on mount
  useEffect(() => {
    const settings = readSettingsProfile();
    setPrivacyComfort(settings.privacy_comfort ?? 'visible');
    setExpressionTolerance(settings.expression_tolerance ?? 'neutral');
    setPastSessions(readEmotionHistory());
  }, []);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      setCameraState('loading-models');
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoaded(true);
        setCameraState('idle');
        setError(null);
      } catch {
        setError(
          'Failed to load face detection models. Make sure the models are in the /public/models folder.'
        );
        setCameraState('error');
      }
    };
    loadModels();
  }, []);

  const startVideo = useCallback(async () => {
    setCameraState('requesting-permission');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
        setCameraState('active');
        sessionStartRef.current = Date.now();
        sessionEntriesRef.current = [];
      }
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'SecurityError')
      ) {
        setCameraState('denied');
        setError('Camera access was denied.');
      } else {
        setCameraState('error');
        setError(
          'Failed to access camera. It may be in use by another application.'
        );
      }
    }
  }, []);

  const stopVideo = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    // Save session if we have data
    if (sessionEntriesRef.current.length > 0) {
      const session: EmotionSessionRecord = {
        sessionId: `session-${sessionStartRef.current}`,
        startedAt: sessionStartRef.current,
        endedAt: Date.now(),
        entries: sessionEntriesRef.current,
      };
      saveEmotionSession(session);
      setPastSessions((prev) => [...prev, session]);
      sessionEntriesRef.current = [];
    }

    setIsStreamActive(false);
    setEmotions(null);
    setDominantEmotion(null);
    setCameraState('idle');

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  // Detect faces and emotions
  useEffect(() => {
    if (!isStreamActive || !isModelLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animationId: number;

    const detectEmotions = async () => {
      if (video.readyState !== 4) {
        animationId = requestAnimationFrame(detectEmotions);
        return;
      }

      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

      if (detections.length > 0 && detections[0].expressions) {
        const expressions = detections[0].expressions;
        const emotionData: EmotionData = {
          neutral: expressions.neutral,
          happy: expressions.happy,
          sad: expressions.sad,
          angry: expressions.angry,
          fearful: expressions.fearful,
          disgusted: expressions.disgusted,
          surprised: expressions.surprised,
        };
        setEmotions(emotionData);

        const entries = Object.entries(emotionData);
        const dominant = entries.reduce((prev, current) =>
          prev[1] > current[1] ? prev : current
        );
        setDominantEmotion(dominant[0]);

        // Record for session history
        sessionEntriesRef.current.push({
          emotion: dominant[0],
          confidence: dominant[1],
          timestamp: Date.now(),
        });

        // Collect recalibration data
        if (isRecalibrating) {
          recalibrationDataRef.current.push(expressions.neutral);
        }
      }

      animationId = requestAnimationFrame(detectEmotions);
    };

    detectEmotions();
    return () => cancelAnimationFrame(animationId);
  }, [isStreamActive, isModelLoaded, isRecalibrating]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Recalibration handler
  const startRecalibration = useCallback(() => {
    if (!isStreamActive) return;
    setIsRecalibrating(true);
    setRecalibrationProgress(0);
    recalibrationDataRef.current = [];

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1;
      setRecalibrationProgress(Math.min((elapsed / 30) * 100, 100));
      if (elapsed >= 30) {
        clearInterval(interval);
        const samples = recalibrationDataRef.current;
        if (samples.length > 0) {
          const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
          // Variance — high variance = variable expression
          const variance =
            samples.reduce((acc, s) => acc + (s - avg) ** 2, 0) /
            samples.length;
          let newTolerance: ExpressionTolerance;
          if (variance > 0.05) {
            newTolerance = 'variable';
          } else if (avg > 0.55) {
            // Model reads neutral easily — calm focus face
            newTolerance = 'neutral';
          } else {
            // Avg neutral is low — user looks intense even at rest
            newTolerance = 'intense';
          }
          setExpressionTolerance(newTolerance);
          saveSettingsProfile({ expression_tolerance: newTolerance });
        }
        setIsRecalibrating(false);
        recalibrationDataRef.current = [];
      }
    }, 1000);
  }, [isStreamActive]);

  // Aggregate all-time emotion distribution from past sessions
  const allTimeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const session of pastSessions) {
      for (const entry of session.entries) {
        counts[entry.emotion] = (counts[entry.emotion] || 0) + 1;
        total++;
      }
    }
    if (total === 0) return [];
    return Object.entries(counts)
      .map(([emotion, count]) => ({
        emotion,
        count,
        percentage: Math.round((count / total) * 100),
        color: EMOTION_COLORS[emotion] ?? '#6b7280',
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [pastSessions]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderCameraEmptyState = () => {
    if (cameraState === 'loading-models') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-[#2a2a28] p-5">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-sm font-medium text-foreground">
              Loading face detection models
            </p>
            <p className="text-xs text-muted-foreground">
              This usually takes a few seconds...
            </p>
          </div>
        </div>
      );
    }

    if (cameraState === 'requesting-permission') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-yellow-500/20" />
            <div className="relative rounded-full bg-[#2a2a28] p-5">
              <ShieldCheck className="h-10 w-10 text-yellow-500" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-sm font-medium text-foreground">
              Waiting for camera permission
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Check your browser&apos;s permission prompt. Camera access is
              needed to analyze facial expressions. All processing happens
              locally — nothing leaves your device.
            </p>
          </div>
        </div>
      );
    }

    if (cameraState === 'denied') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="rounded-full bg-destructive/10 p-5">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-sm font-medium text-foreground">
              Camera access denied
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Click the camera or lock icon in your browser&apos;s address bar,
              allow access for this site, then try again.
            </p>
          </div>
          <Button
            onClick={startVideo}
            variant="outline"
            size="sm"
            className="mt-1 gap-2"
          >
            <Camera className="h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      );
    }

    if (cameraState === 'error') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="rounded-full bg-destructive/10 p-5">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-sm font-medium text-foreground">
              Something went wrong
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">{error}</p>
          </div>
          <Button
            onClick={startVideo}
            variant="outline"
            size="sm"
            className="mt-1 gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      );
    }

    // Default idle state
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-[#2a2a28] p-5">
          <Video className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-sm font-medium text-foreground">
            Ready for emotion detection
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Your browser will request camera access. All processing stays on
            your device.
          </p>
        </div>
        <Button
          onClick={startVideo}
          disabled={!isModelLoaded}
          size="lg"
          className="mt-1 gap-2 px-6"
        >
          <Camera className="h-4 w-4" />
          Start Camera
        </Button>
      </div>
    );
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Compute per-session summary
  const getSessionSummary = (session: EmotionSessionRecord) => {
    const counts: Record<string, number> = {};
    for (const entry of session.entries) {
      counts[entry.emotion] = (counts[entry.emotion] || 0) + 1;
    }
    const total = session.entries.length;
    return Object.entries(counts)
      .map(([emotion, count]) => ({
        emotion,
        percentage: Math.round((count / total) * 100),
        color: EMOTION_COLORS[emotion] ?? '#6b7280',
      }))
      .sort((a, b) => b.percentage - a.percentage);
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header with description */}
      <div className="space-y-4">
        <h1 className="text-3xl">Emotion Recognition</h1>
        <Card className="border border-[#4a4a46] bg-[#191919]">
          <CardHeader className="space-y-4">
            <CardTitle className="font-normal">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                <span className="text-lg leading-relaxed">
                  Real-Time Emotion Detection
                </span>
              </div>
            </CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Test how the emotion model reads your face before your first
              session. Review live confidence breakdowns, session-based emotion
              timelines, and long-term emotion insights to understand your focus
              patterns. All processing happens locally in your browser. Nothing
              is sent to any server.
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Privacy indicator for hidden mode */}
      {privacyComfort === 'hidden' && (
        <Alert className="border-yellow-600/30 bg-yellow-950/20">
          <EyeOff className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-500">
            Background detection active
          </AlertTitle>
          <AlertDescription className="text-yellow-200/70">
            Your privacy preference is set to{' '}
            <span className="font-medium">hidden</span>. Emotion detection runs
            in the background during study sessions without showing the camera
            feed. You can change this in Settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Privacy indicator for off mode */}
      {privacyComfort === 'off' && (
        <Alert className="border-red-700/30 bg-red-950/20">
          <VideoOff className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-400">Camera disabled</AlertTitle>
          <AlertDescription className="text-red-200/70">
            Your privacy preference is set to{' '}
            <span className="font-medium">off</span>. All computer vision
            features are disabled in study mode. You can still test the model on
            this page, but no detection runs during sessions. Change this in
            Settings to re-enable.
          </AlertDescription>
        </Alert>
      )}

      {/* Privacy disclaimer — prominent placement */}
      <Alert className="border-emerald-700/30 bg-emerald-950/20">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <AlertTitle className="text-emerald-400">
          Your privacy is protected
        </AlertTitle>
        <AlertDescription className="text-emerald-200/60">
          All emotion analysis runs locally in your browser using on-device
          models. No images, video, or biometric data are stored, saved, or
          transmitted to any server at any time. The camera feed never leaves
          your device.
        </AlertDescription>
      </Alert>

      {/* Camera + Emotions panels */}
      <div
        className={`grid gap-6 ${isStreamActive ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}
      >
        {/* Camera Feed */}
        <Card
          className={`border border-[#4a4a46] bg-[#191919] ${isStreamActive ? 'lg:col-span-2' : ''}`}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-normal">
              <span className="text-base font-medium">Camera Feed</span>
              {cameraState === 'loading-models' && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading models...
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`relative w-full overflow-hidden rounded-lg bg-[#0f0f0f] ${isStreamActive ? 'aspect-video' : 'aspect-[16/7]'}`}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!isStreamActive && renderCameraEmptyState()}
              {isStreamActive && (
                <div className="absolute inset-x-0 bottom-3 flex justify-center">
                  <Button
                    onClick={stopVideo}
                    variant="destructive"
                    size="sm"
                    className="gap-1.5 shadow-lg backdrop-blur-sm"
                  >
                    <CameraOff className="h-4 w-4" />
                    Stop Camera
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detected Emotions — only show when camera active or has data */}
        {isStreamActive ? (
          <Card className="border border-[#4a4a46] bg-[#191919]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                Confidence Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dominantEmotion && (
                <div className="mb-5 text-center">
                  <div className="mb-1 text-5xl">
                    {EMOTION_EMOJIS[dominantEmotion] ?? '🤔'}
                  </div>
                  <div className="text-lg font-semibold capitalize">
                    {dominantEmotion}
                  </div>
                  {emotions && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {(
                        emotions[dominantEmotion as keyof EmotionData] * 100
                      ).toFixed(1)}
                      % confidence
                    </div>
                  )}
                </div>
              )}

              {emotions ? (
                <div className="space-y-2.5">
                  {Object.entries(emotions)
                    .sort(([, a], [, b]) => b - a)
                    .map(([emotion, value]) => (
                      <div key={emotion} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{emotion}</span>
                          <span className="tabular-nums">
                            {(value * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full transition-all duration-200 ${EMOTION_BG_CLASSES[emotion] ?? 'bg-gray-500'}`}
                            style={{ width: `${value * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  Looking for faces...
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Recalibration */}
      <Card className="border border-[#4a4a46] bg-[#191919]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <RefreshCw className="h-4 w-4" />
            Expression Calibration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Expression tolerance shapes how the model interprets your face. Pick
            the option that best matches your usual focused expression, or run
            the 30-second recalibration to set it automatically.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                {
                  value: 'neutral' as const,
                  icon: Meh,
                  title: 'Neutral',
                  description: 'Calm focus face',
                },
                {
                  value: 'intense' as const,
                  icon: Frown,
                  title: 'Intense',
                  description: 'Frequent frown / serious look',
                },
                {
                  value: 'variable' as const,
                  icon: Shuffle,
                  title: 'Variable',
                  description: 'No strong pattern',
                },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const selected = expressionTolerance === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setExpressionTolerance(opt.value);
                    saveSettingsProfile({ expression_tolerance: opt.value });
                  }}
                  className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? 'border-emerald-600/60 bg-emerald-950/30'
                      : 'border-[#4a4a46] bg-[#0f0f0f] hover:border-[#6a6a66]'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${selected ? 'text-emerald-400' : 'text-muted-foreground'}`}
                  />
                  <span className="text-sm font-medium">{opt.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>

          {isRecalibrating ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-yellow-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Observing your neutral face... hold still
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-yellow-500 transition-all duration-1000"
                  style={{ width: `${recalibrationProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.ceil(30 - (recalibrationProgress / 100) * 30)}s remaining
              </p>
            </div>
          ) : (
            <Button
              onClick={startRecalibration}
              disabled={!isStreamActive}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RefreshCw className="mr-1.5 h-4 w-4" />
              {isStreamActive
                ? 'Recalibrate my focus face (30s observation)'
                : 'Start camera first to recalibrate'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Emotion History — all-time distribution */}
      <Card className="border border-[#4a4a46] bg-[#191919]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <BarChart3 className="h-4 w-4" />
            Emotion History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allTimeDistribution.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Aggregated emotion distribution across {pastSessions.length}{' '}
                recorded session
                {pastSessions.length !== 1 ? 's' : ''}.
              </p>
              <div className="space-y-2.5">
                {allTimeDistribution.map((stat) => (
                  <div key={stat.emotion} className="flex items-center gap-3">
                    <span className="w-20 text-sm capitalize">
                      {stat.emotion}
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${stat.percentage}%`,
                          backgroundColor: stat.color,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">
                      {stat.percentage}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Mini timeline — most recent 60 entries across all sessions */}
              <div className="pt-2">
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                  Recent trend
                </h4>
                <div className="flex h-8 items-end gap-px overflow-hidden rounded">
                  {pastSessions
                    .flatMap((s) => s.entries)
                    .slice(-60)
                    .map((entry, i) => (
                      <div
                        key={`${entry.timestamp}-${i}`}
                        className="min-w-[2px] flex-1 rounded-t"
                        style={{
                          backgroundColor:
                            EMOTION_COLORS[entry.emotion] ?? '#6b7280',
                          height: `${Math.max(20, entry.confidence * 100)}%`,
                        }}
                      />
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 rounded-full bg-[#2a2a28] p-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No session history yet
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Start and stop the camera to record your first emotion session.
                Your emotion distribution will build up here over time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-session emotion timelines */}
      {pastSessions.length > 0 && (
        <Card className="border border-[#4a4a46] bg-[#191919]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Clock className="h-4 w-4" />
              Session Timelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Review how your emotional state tracked across individual
              sessions. Click a session to expand its timeline.
            </p>
            <div className="space-y-2">
              {[...pastSessions].reverse().map((session) => {
                const isExpanded = expandedSessionId === session.sessionId;
                const summary = getSessionSummary(session);
                const duration = session.endedAt - session.startedAt;

                return (
                  <div
                    key={session.sessionId}
                    className="rounded-lg border border-[#4a4a46] bg-[#0f0f0f]"
                  >
                    <button
                      onClick={() =>
                        setExpandedSessionId(
                          isExpanded ? null : session.sessionId
                        )
                      }
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {summary.slice(0, 3).map((s) => (
                            <div
                              key={s.emotion}
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                          ))}
                        </div>
                        <span className="text-sm">
                          {formatTimestamp(session.startedAt)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(duration)}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-3 border-t border-[#4a4a46] px-4 py-3">
                        {/* Session distribution */}
                        <div className="space-y-2">
                          {summary.map((s) => (
                            <div
                              key={s.emotion}
                              className="flex items-center gap-3"
                            >
                              <span className="w-20 text-xs capitalize">
                                {s.emotion}
                              </span>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${s.percentage}%`,
                                    backgroundColor: s.color,
                                  }}
                                />
                              </div>
                              <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                                {s.percentage}%
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Mini timeline for session */}
                        <div>
                          <h5 className="mb-1.5 text-xs text-muted-foreground">
                            Timeline
                          </h5>
                          <div className="flex h-6 items-end gap-px overflow-hidden rounded">
                            {session.entries.slice(-80).map((entry, i) => (
                              <div
                                key={`${entry.timestamp}-${i}`}
                                className="min-w-[2px] flex-1 rounded-t"
                                style={{
                                  backgroundColor:
                                    EMOTION_COLORS[entry.emotion] ?? '#6b7280',
                                  height: `${Math.max(25, entry.confidence * 100)}%`,
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{session.entries.length} samples</span>
                          <span>{formatDuration(duration)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it works footer section */}
      <section>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-[#4a4a46]/50 bg-[#191919] px-6 py-5">
            {privacyComfort === 'visible' && (
              <Eye className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            {privacyComfort === 'hidden' && (
              <EyeOff className="h-5 w-5 shrink-0 text-yellow-500" />
            )}
            {privacyComfort === 'off' && (
              <VideoOff className="h-5 w-5 shrink-0 text-red-400" />
            )}
            <div>
              <p className="text-sm font-medium">
                Camera mode: {privacyComfort === 'visible' && 'Visible'}
                {privacyComfort === 'hidden' && 'Hidden'}
                {privacyComfort === 'off' && 'Off'}
              </p>
              <p className="text-xs text-muted-foreground">
                {privacyComfort === 'visible' &&
                  'You see the camera feed during sessions.'}
                {privacyComfort === 'hidden' &&
                  'Detection runs silently in the background during sessions.'}
                {privacyComfort === 'off' &&
                  'Camera is disabled during sessions. No detection runs.'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-[#4a4a46]/50 bg-[#191919] px-6 py-5 text-center">
            <p className="text-sm text-muted-foreground">
              This feature uses <strong>face-api.js</strong>, a JavaScript face
              recognition library built on TensorFlow.js. It detects faces in
              real-time from your webcam feed and analyzes facial expressions to
              determine emotions — all on-device.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
