'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAppShellViewportInsets } from '@/lib/app-shell';
import { fsrsClient } from '@/lib/fsrs-client';
import type { DeckWithStats } from '@/hooks/useDecks';
import {
  AddFlashcardsWidget,
  CameraWidget,
  CVMonitor,
  DraggableWidget,
  FlashcardPracticeArea,
  TimerWidget,
  WidgetToggleBar,
} from './widgets';
import { useCameraContextSafe } from '@/features/camera/context/CameraContext';
import { InterventionLayer } from '@/features/intervention/InterventionLayer';
type WidgetType = 'camera' | 'monitor' | 'timer' | 'addFlashcards';

interface PomodoroContentProps {
  initialTimerSettings?: {
    focusDuration?: number;
    shortBreakDuration?: number;
    longBreakDuration?: number;
  };
  initialCvMonitoringEnabled?: boolean;
  cardAnimationEnabled?: boolean;
  shortcutsEnabled?: boolean;
}

export function PomodoroContent({
  initialTimerSettings,
  initialCvMonitoringEnabled = false,
  cardAnimationEnabled = true,
  shortcutsEnabled = true,
}: PomodoroContentProps) {
  // Separate booleans for each widget window
  const [cameraOpen, setCameraOpen] = useState(initialCvMonitoringEnabled);
  const [timerOpen, setTimerOpen] = useState(false);
  const [monitorOpen, setMonitorOpen] = useState(initialCvMonitoringEnabled);
  const [addFlashcardsOpen, setAddFlashcardsOpen] = useState(false);
  const [activeWidget, setActiveWidget] = useState<WidgetType | null>(null);

  const [shellLeftInset, setShellLeftInset] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return getAppShellViewportInsets().left;
  });

  const [editPayload, setEditPayload] = useState<{
    apiDeckId: number;
    deckTitle: string;
    description?: string;
    flashcards?: {
      question: string;
      answer: string;
      id?: string;
      backendId?: number;
    }[];
  } | null>(null);

  const openEditDeck = async (deck: DeckWithStats) => {
    try {
      const cards = await fsrsClient.cards.list(deck.id);
      const flashcards = cards.map((c) => ({
        question: c.front,
        answer: c.back,
        id: `${c.id}`,
        backendId: c.id,
      }));

      setEditPayload({
        apiDeckId: deck.id,
        deckTitle: deck.name,
        description: deck.description ?? undefined,
        flashcards,
      });

      setAddFlashcardsOpen(true);
      setActiveWidget('addFlashcards');
    } catch (err) {
      console.error('Failed to open edit deck:', err);
      setEditPayload({
        apiDeckId: deck.id,
        deckTitle: deck.name,
        description: deck.description ?? undefined,
      });
      setAddFlashcardsOpen(true);
      setActiveWidget('addFlashcards');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncShellInset = () => {
      setShellLeftInset(getAppShellViewportInsets().left);
    };

    window.addEventListener('resize', syncShellInset);
    return () => window.removeEventListener('resize', syncShellInset);
  }, []);

  const camera = useCameraContextSafe();
  const isCameraActive = camera?.isCameraActive ?? false;
  useEffect(() => {
    if (!isCameraActive) return;
    setCameraOpen(true);
  }, [isCameraActive]);

  const minimizeAddFlashcards = useCallback(() => {
    setAddFlashcardsOpen(false);
    setActiveWidget(null);
  }, []);

  return (
    <div className="relative flex h-full min-h-[calc(100vh-8rem)] flex-col">
      <InterventionLayer />
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl">Pomodoro Timer</h1>
        <WidgetToggleBar
          cameraOpen={cameraOpen}
          timerOpen={timerOpen}
          monitorOpen={monitorOpen}
          onToggleCamera={() => setCameraOpen((prev) => !prev)}
          onToggleTimer={() => setTimerOpen((prev) => !prev)}
          onToggleMonitor={() => setMonitorOpen((prev) => !prev)}
        />
      </div>

      {/* Flashcard Practice Area */}
      <div className="flex flex-1 items-center justify-center">
        <FlashcardPracticeArea
          onRequestEditDeck={openEditDeck}
          cardAnimationEnabled={cardAnimationEnabled}
          shortcutsEnabled={shortcutsEnabled}
        />
      </div>

      {/* Add Flashcards FAB */}
      <button
        onClick={() => {
          setAddFlashcardsOpen(true);
          setActiveWidget('addFlashcards');
        }}
        className="fixed bottom-8 right-8 z-50 rounded-full border border-[#4a4a46] bg-[#30302e] p-3 text-primary-foreground shadow-lg transition-transform hover:scale-105"
        style={{ bottom: 'calc(var(--app-mobile-nav-height) + 2rem)' }}
        title="Add Flashcards"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Camera Window */}
      <DraggableWidget
        isOpen={cameraOpen}
        onMinimize={() => setCameraOpen(false)}
        onFocus={() => setActiveWidget('camera')}
        initialPosition={{ x: Math.max(shellLeftInset + 40, 80), y: 100 }}
        title="Camera"
        zIndex={activeWidget === 'camera' ? 70 : 60}
        width={320}
        minHeight={280}
      >
        <CameraWidget />
      </DraggableWidget>

      {/* Focus Monitor Window */}
      <DraggableWidget
        isOpen={monitorOpen}
        onMinimize={() => setMonitorOpen(false)}
        onFocus={() => setActiveWidget('monitor')}
        initialPosition={{ x: Math.max(shellLeftInset + 40, 80), y: 420 }}
        title="Focus Monitor"
        zIndex={activeWidget === 'monitor' ? 70 : 60}
        width={320}
        minHeight={300}
      >
        <CVMonitor />
      </DraggableWidget>

      {/* Pomodoro Timer Window */}
      <DraggableWidget
        isOpen={timerOpen}
        onMinimize={() => setTimerOpen(false)}
        onFocus={() => setActiveWidget('timer')}
        initialPosition={{ x: Math.max(shellLeftInset + 380, 420), y: 100 }}
        title="Pomodoro Timer"
        zIndex={activeWidget === 'timer' ? 70 : 60}
        width={320}
        minHeight={350}
      >
        <TimerWidget initialSettings={initialTimerSettings} />
      </DraggableWidget>

      {/* Add Flashcards — center (DraggableWidget) */}
      <DraggableWidget
        isOpen={addFlashcardsOpen}
        onMinimize={() => {
          minimizeAddFlashcards();
          setEditPayload(null);
        }}
        onFocus={() => setActiveWidget('addFlashcards')}
        initialPosition={{ x: Math.max(shellLeftInset + 40, 300), y: 100 }}
        title={editPayload ? 'Edit Flashcard Deck' : 'Add Flashcard Deck'}
        zIndex={activeWidget === 'addFlashcards' ? 70 : 60}
        width={500}
        minHeight={400}
      >
        <AddFlashcardsWidget
          onClose={() => {
            minimizeAddFlashcards();
            setEditPayload(null);
          }}
          edit={!!editPayload}
          initialDeck={
            editPayload
              ? {
                  apiDeckId: editPayload.apiDeckId,
                  deckTitle: editPayload.deckTitle,
                  description: editPayload.description,
                }
              : undefined
          }
          initialFlashcards={editPayload?.flashcards}
          onSaved={() => {
            minimizeAddFlashcards();
            setEditPayload(null);
            window.location.reload();
          }}
        />
      </DraggableWidget>
    </div>
  );
}
