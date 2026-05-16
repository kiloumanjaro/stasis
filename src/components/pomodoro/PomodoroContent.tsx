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

type WidgetType = 'camera' | 'timer' | 'monitor' | 'addFlashcards';

interface WidgetState {
  camera: { isOpen: boolean };
  timer: { isOpen: boolean };
  monitor: { isOpen: boolean };
  addFlashcards: { isOpen: boolean };
}

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
  const [widgets, setWidgets] = useState<WidgetState>({
    camera: { isOpen: initialCvMonitoringEnabled },
    timer: { isOpen: false },
    monitor: { isOpen: initialCvMonitoringEnabled },
    addFlashcards: { isOpen: false },
  });
  const [activeWidget, setActiveWidget] = useState<WidgetType | null>(
    initialCvMonitoringEnabled ? 'monitor' : null
  );
  const [shellLeftInset, setShellLeftInset] = useState(0);
  const [timerInitialX, setTimerInitialX] = useState(0);
  const [monitorInitialX, setMonitorInitialX] = useState(0);

  // Payload for editing an existing deck
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

  // Open the AddFlashcardsWidget in edit mode for a given deck
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

      setWidgets((prev) => ({ ...prev, addFlashcards: { isOpen: true } }));
      setActiveWidget('addFlashcards');
    } catch (err) {
      console.error('Failed to open edit deck:', err);
      setEditPayload({
        apiDeckId: deck.id,
        deckTitle: deck.name,
        description: deck.description ?? undefined,
      });
      setWidgets((prev) => ({ ...prev, addFlashcards: { isOpen: true } }));
      setActiveWidget('addFlashcards');
    }
  };

  // Calculate widget initial positions on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncWidgetPositions = () => {
      const { left } = getAppShellViewportInsets();
      setShellLeftInset(left);
      setTimerInitialX(Math.max(left + 20, window.innerWidth - 360));
      // Position monitor to the left of timer
      setMonitorInitialX(Math.max(left + 20, window.innerWidth - 720));
    };

    syncWidgetPositions();
    window.addEventListener('resize', syncWidgetPositions);

    return () => window.removeEventListener('resize', syncWidgetPositions);
  }, []);

  const camera = useCameraContextSafe();
  const isCameraActive = camera?.isCameraActive ?? false;
  useEffect(() => {
    if (!isCameraActive) return;
    setWidgets((prev) =>
      prev.camera.isOpen ? prev : { ...prev, camera: { isOpen: true } }
    );
    setActiveWidget('camera');
  }, [isCameraActive]);

  // Toggle widget visibility
  const toggleWidget = useCallback((widget: WidgetType) => {
    setWidgets((prev) => ({
      ...prev,
      [widget]: { isOpen: !prev[widget].isOpen },
    }));
    setActiveWidget(widget);
  }, []);

  // Minimize widget (close it)
  const minimizeWidget = useCallback((widget: WidgetType) => {
    setWidgets((prev) => ({
      ...prev,
      [widget]: { isOpen: false },
    }));
    setActiveWidget(null);
  }, []);

  // Focus widget (bring to front)
  const focusWidget = useCallback((widget: WidgetType) => {
    setActiveWidget(widget);
  }, []);

  // Z-index values based on active widget
  const getZIndex = (widget: WidgetType): number => {
    return activeWidget === widget ? 70 : 60;
  };

  return (
    <div className="relative flex h-full min-h-[calc(100vh-8rem)] flex-col">
      {/* Header with title and widget toggles */}
      <div className="relative mb-8">
        <h1 className="text-2xl">Pomodoro Timer</h1>

        {/* Widget Toggle Buttons - positioned top-right */}
        <WidgetToggleBar
          cameraOpen={widgets.camera.isOpen}
          timerOpen={widgets.timer.isOpen}
          monitorOpen={widgets.monitor.isOpen}
          onToggleCamera={() => toggleWidget('camera')}
          onToggleTimer={() => toggleWidget('timer')}
          onToggleMonitor={() => toggleWidget('monitor')}
        />
      </div>

      {/* Flashcard Practice Area - main focus */}
      <div className="flex flex-1 items-center justify-center">
        <FlashcardPracticeArea
          onRequestEditDeck={openEditDeck}
          cardAnimationEnabled={cardAnimationEnabled}
          shortcutsEnabled={shortcutsEnabled}
        />
      </div>

      {/* Add Flashcards Button - floating action button */}
      <button
        onClick={() => toggleWidget('addFlashcards')}
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
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Floating Camera Widget - anchors left */}
      <DraggableWidget
        isOpen={widgets.camera.isOpen}
        onMinimize={() => minimizeWidget('camera')}
        onFocus={() => focusWidget('camera')}
        initialPosition={{ x: shellLeftInset + 20, y: 100 }}
        title="Camera"
        zIndex={getZIndex('camera')}
        width={320}
        minHeight={280}
      >
        <CameraWidget />
      </DraggableWidget>

      {/* Floating Timer Widget - anchors right */}
      <DraggableWidget
        isOpen={widgets.timer.isOpen}
        onMinimize={() => minimizeWidget('timer')}
        onFocus={() => focusWidget('timer')}
        initialPosition={{ x: timerInitialX || 800, y: 100 }}
        title="Pomodoro Timer"
        zIndex={getZIndex('timer')}
        width={320}
        minHeight={520}
      >
        <TimerWidget initialSettings={initialTimerSettings} />
      </DraggableWidget>

      {/* Floating CV Monitor Widget - positioned left of timer */}
      <DraggableWidget
        isOpen={widgets.monitor.isOpen}
        onMinimize={() => minimizeWidget('monitor')}
        onFocus={() => focusWidget('monitor')}
        initialPosition={{ x: monitorInitialX || 440, y: 100 }}
        title="Focus Monitor"
        zIndex={getZIndex('monitor')}
        width={340}
        minHeight={400}
      >
        <CVMonitor />
      </DraggableWidget>

      {/* Floating Add Flashcards Widget - center */}
      <DraggableWidget
        isOpen={widgets.addFlashcards.isOpen}
        onMinimize={() => {
          minimizeWidget('addFlashcards');
          setEditPayload(null);
        }}
        onFocus={() => focusWidget('addFlashcards')}
        initialPosition={{ x: Math.max(shellLeftInset + 40, 300), y: 100 }}
        title={editPayload ? 'Edit Flashcard Deck' : 'Add Flashcard Deck'}
        zIndex={getZIndex('addFlashcards')}
        width={500}
        minHeight={400}
      >
        <AddFlashcardsWidget
          onClose={() => {
            minimizeWidget('addFlashcards');
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
            // Close widget and refresh decks
            minimizeWidget('addFlashcards');
            setEditPayload(null);
            window.location.reload();
          }}
        />
      </DraggableWidget>
    </div>
  );
}
