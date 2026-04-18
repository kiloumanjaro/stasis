'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface EmotionData {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export function CVContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<EmotionData | null>(null);
  const [dominantEmotion, setDominantEmotion] = useState<string | null>(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        const MODEL_URL = '/models';

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        setIsModelLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Error loading models:', err);
        setError(
          'Failed to load face detection models. Make sure the models are in the /public/models folder.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please allow camera permissions.');
    }
  }, []);

  const stopVideo = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreamActive(false);
      setEmotions(null);
      setDominantEmotion(null);

      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
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
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

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

        // Find dominant emotion
        const entries = Object.entries(emotionData);
        const dominant = entries.reduce((prev, current) =>
          prev[1] > current[1] ? prev : current
        );
        setDominantEmotion(dominant[0]);
      }

      animationId = requestAnimationFrame(detectEmotions);
    };

    detectEmotions();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isStreamActive, isModelLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideo();
    };
  }, [stopVideo]);

  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: Record<string, string> = {
      neutral: '😐',
      happy: '😊',
      sad: '😢',
      angry: '😠',
      fearful: '😨',
      disgusted: '🤢',
      surprised: '😲',
    };
    return emojiMap[emotion] || '🤔';
  };

  const getEmotionColor = (emotion: string) => {
    const colorMap: Record<string, string> = {
      neutral: 'bg-gray-500',
      happy: 'bg-yellow-500',
      sad: 'bg-blue-500',
      angry: 'bg-red-500',
      fearful: 'bg-purple-500',
      disgusted: 'bg-green-500',
      surprised: 'bg-orange-500',
    };
    return colorMap[emotion] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl">Emotion Recognition</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-normal">
              <span>Camera Feed</span>
              <Button
                onClick={isStreamActive ? stopVideo : startVideo}
                disabled={isLoading || !isModelLoaded}
                variant={isStreamActive ? 'destructive' : 'default'}
                className="items-center pb-1"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-1 mr-0.5 h-4 w-4 animate-spin" />
                    Loading Models...
                  </>
                ) : isStreamActive ? (
                  <>
                    <CameraOff className="ml-1 mr-0.5 h-4 w-4" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="ml-1 mr-0.5 h-4 w-4" />
                    Start Camera
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
                {error}
              </div>
            )}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
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
              {!isStreamActive && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground">
                    {isLoading
                      ? 'Loading face detection models...'
                      : 'Click "Start Camera" to begin'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emotion Display */}
        <Card className="border border-[#4a4a46] bg-[#30302e]">
          <CardHeader>
            <CardTitle className="font-normal">Detected Emotions</CardTitle>
          </CardHeader>
          <CardContent>
            {dominantEmotion && (
              <div className="mb-6 text-center">
                <div className="mb-2 text-6xl">
                  {getEmotionEmoji(dominantEmotion)}
                </div>
                <div className="text-xl font-semibold capitalize">
                  {dominantEmotion}
                </div>
              </div>
            )}

            {emotions ? (
              <div className="space-y-3">
                {Object.entries(emotions).map(([emotion, value]) => (
                  <div key={emotion} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{emotion}</span>
                      <span>{(value * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all duration-200 ${getEmotionColor(emotion)}`}
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                {isStreamActive
                  ? 'Looking for faces...'
                  : 'Start the camera to detect emotions'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-none bg-[#0f0f0f] px-4 py-2">
        <CardHeader>
          <div className="flex flex-row justify-between">
            <div className="flex w-1/2 items-center">
              <Image
                src="/images/green.png"
                alt="Stasis"
                className="h-12 w-12"
                width={48}
                height={48}
              />
              <CardTitle className="text-3xl font-normal">statis</CardTitle>
            </div>
            <div className="flex w-1/2 flex-col gap-2">
              <CardTitle className="font-normal">How it works</CardTitle>
              <CardDescription>
                The technology used for this product is indicated here
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row justify-between">
            {/* Left Column: Info */}
            <div className="flex w-1/2 flex-col justify-between space-y-2 pb-3 text-sm text-muted-foreground">
              <p className="ml-3 max-w-md">
                This application processes webcam images locally in your browser
                for real-time emotion analysis only. No images or video are
                stored, saved, or transmitted to any server at any time.
              </p>
            </div>

            {/* Right Column: Activity Area */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-[#4a4a46]/50 bg-[#191919]">
              <div className="flex h-full flex-col items-center justify-center px-10 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  This demo uses <strong>face-api.js</strong>, a JavaScript face
                  recognition library built on top of TensorFlow.js. It detects
                  faces in real-time from your webcam feed and analyzes facial
                  expressions to determine emotions.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
