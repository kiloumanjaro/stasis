'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MEMES = [
  {
    emoji: '🦆',
    text: 'Fun fact: rubber ducks debug code better when well-rested. So do you.',
  },
  {
    emoji: '🧠',
    text: "Your brain called. It wants a 10-second breather. It's earned it.",
  },
  {
    emoji: '🚀',
    text: "Even rockets need a launch window. Take a breath — you're almost there.",
  },
  {
    emoji: '🐢',
    text: 'Slow is smooth, smooth is fast. Breathe once. Then carry on.',
  },
  {
    emoji: '☕',
    text: 'Pro tip: blinking exists for a reason. Give your eyes the memo.',
  },
  { emoji: '🌊', text: 'Distraction detected. Deploying emergency calm... ✅' },
  {
    emoji: '🎯',
    text: 'Low energy ≠ low potential. Shake it off and come back sharper.',
  },
  {
    emoji: '🍕',
    text: "Your future self is rooting for present you. Don't let them down.",
  },
  {
    emoji: '🦁',
    text: "Even lions nap 20 hours a day. You've been going for 25 minutes. Respect.",
  },
  {
    emoji: '🌱',
    text: 'Growth happens in the pauses too. This is one of them.',
  },
];

interface MemeResetOverlayProps {
  reason: string;
  onDismiss: () => void;
}

export function MemeResetOverlay({ reason, onDismiss }: MemeResetOverlayProps) {
  const [meme] = useState(
    () => MEMES[Math.floor(Math.random() * MEMES.length)]!
  );

  return (
    <div
      className={cn(
        'fixed left-1/2 top-6 z-[200] -translate-x-1/2',
        'w-full max-w-sm',
        'duration-300 animate-in fade-in slide-in-from-top-4'
      )}
    >
      <div className="relative rounded-xl border border-[#4a4a46] bg-[#2a2a28] p-5 shadow-2xl">
        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-md p-1 text-[#8a8a86] transition-colors hover:bg-[#3a3a38] hover:text-white"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>

        {/* Badge */}
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400">
            Focus nudge
          </span>
          <span className="text-xs text-[#6a6a66]">{reason}</span>
        </div>

        {/* Content */}
        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none">{meme.emoji}</span>
          <p className="text-sm leading-relaxed text-[#d0d0cc]">{meme.text}</p>
        </div>

        {/* Dismiss CTA */}
        <button
          onClick={onDismiss}
          className="mt-4 w-full rounded-md bg-[#3a3a38] py-2 text-sm text-[#c0c0bc] transition-colors hover:bg-[#4a4a46] hover:text-white"
        >
          Got it, back to studying
        </button>
      </div>
    </div>
  );
}
