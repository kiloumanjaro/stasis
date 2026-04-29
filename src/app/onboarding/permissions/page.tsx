'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Camera, Cpu, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PermissionsPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [granted, setGranted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (granted && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [granted]);

  const handleEnable = async () => {
    setError(null);
    let mediaStream: MediaStream;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    } catch {
      setError(
        'Camera access was denied. You can enable it later in settings.'
      );
      return;
    }

    streamRef.current = mediaStream;
    setSaving(true);
    const res = await fetch('/api/onboarding/cv-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: true }),
    });
    setSaving(false);

    if (!res.ok) {
      setError('Failed to save. Please try again.');
      mediaStream.getTracks().forEach((track) => track.stop());
      return;
    }

    setGranted(true);
  };

  const handleSkip = async () => {
    setSaving(true);
    await fetch('/api/onboarding/cv-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    });
    router.push('/onboarding/complete');
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-[520px] space-y-8 px-6">
        <div className="flex items-center gap-4">
          <div className="h-0.5 flex-1 rounded-full bg-[#1E1E26]">
            <div className="h-full w-3/4 rounded-full bg-[#7C6FF7] transition-[width] duration-300" />
          </div>
          <span className="shrink-0 text-xs text-[#5A5A72]">3 of 4</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#EAEAF0]">CV Monitoring</h1>
          <p className="text-sm text-[#9090A8]">
            Let Stasis use your webcam to improve your study sessions.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-[#2A2A35] bg-[#131316] p-6">
          <div className="flex gap-3">
            <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-[#7C6FF7]" />
            <div>
              <p className="text-[13px] font-medium text-[#EAEAF0]">
                Burnout detection
              </p>
              <p className="text-[13px] text-[#9090A8]">
                Detects signs of fatigue and suggests breaks before you burn
                out.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Camera className="mt-0.5 h-4 w-4 shrink-0 text-[#7C6FF7]" />
            <div>
              <p className="text-[13px] font-medium text-[#EAEAF0]">
                Attention scoring
              </p>
              <p className="text-[13px] text-[#9090A8]">
                Tracks focus levels in real time to help you stay on task.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7C6FF7]" />
            <div>
              <p className="text-[13px] font-medium text-[#EAEAF0]">
                Fully on-device
              </p>
              <p className="text-[13px] text-[#9090A8]">
                No video ever leaves your device. All processing happens
                locally.
              </p>
            </div>
          </div>

          {granted && (
            <div className="mt-2 overflow-hidden rounded-lg border border-[#2A2A35]">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-48 w-full object-cover"
              />
              <p className="bg-[#1C1C22] py-2 text-center text-xs text-[#9090A8]">
                Camera active — monitoring enabled
              </p>
            </div>
          )}
        </div>

        {error && <p className="text-center text-sm text-[#F04F4F]">{error}</p>}

        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.push('/onboarding/preferences')}
            variant="ghost"
            size="icon"
            className="rounded-full border border-[#2A2A35]"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {!granted && (
              <button
                onClick={handleSkip}
                disabled={saving}
                className="text-sm text-[#5A5A72] transition-colors hover:text-[#9090A8] disabled:opacity-50"
              >
                Skip for now
              </button>
            )}
            <Button
              onClick={
                granted
                  ? () => router.push('/onboarding/complete')
                  : handleEnable
              }
              disabled={saving}
              className="px-8"
            >
              {saving
                ? 'Saving...'
                : granted
                  ? 'Continue'
                  : 'Enable Monitoring'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
