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

const WIDGET_WIDTH = Math.round(320 * 0.85); // 272 — 85% of original timer width
const CAMERA_WIDGET_HEIGHT = 280; // estimated rendered height incl. header
const WIDGET_VERTICAL_GAP = 12;
const CAMERA_INITIAL_Y = 80;
const MONITOR_INITIAL_Y =
  CAMERA_INITIAL_Y + CAMERA_WIDGET_HEIGHT + WIDGET_VERTICAL_GAP;
const TIMER_INITIAL_Y = 80;

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
  // Lazy initializers ensure correct positions on first client render,
  // covering the edge case where a widget opens before the resize effect fires.
  const [shellLeftInset, setShellLeftInset] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return getAppShellViewportInsets().left;
  });
  const [timerInitialX, setTimerInitialX] = useState(() => {
    if (typeof window === 'undefined') return 820;
    return window.innerWidth - WIDGET_WIDTH - 20;
  });
  const [monitorInitialX, setMonitorInitialX] = useState(() => {
    if (typeof window === 'undefined') return 84;
    return getAppShellViewportInsets().left + 20;
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncWidgetPositions = () => {
      const { left } = getAppShellViewportInsets();
      setShellLeftInset(left);
      setMonitorInitialX(left + 20);
      setTimerInitialX(window.innerWidth - WIDGET_WIDTH - 20);
    };

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

  const toggleWidget = useCallback((widget: WidgetType) => {
    setWidgets((prev) => ({
      ...prev,
      [widget]: { isOpen: !prev[widget].isOpen },
    }));
    setActiveWidget(widget);
  }, []);

  const minimizeWidget = useCallback((widget: WidgetType) => {
    setWidgets((prev) => ({
      ...prev,
      [widget]: { isOpen: false },
    }));
    setActiveWidget(null);
  }, []);

  const focusWidget = useCallback((widget: WidgetType) => {
    setActiveWidget(widget);
  }, []);

  const getZIndex = (widget: WidgetType): number => {
    return activeWidget === widget ? 70 : 60;
  };

  return (
    <div className="relative flex h-full min-h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="relative mb-8">
        <h1 className="text-2xl">Pomodoro Timer</h1>
        <WidgetToggleBar
          cameraOpen={widgets.camera.isOpen}
          timerOpen={widgets.timer.isOpen}
          monitorOpen={widgets.monitor.isOpen}
          onToggleCamera={() => toggleWidget('camera')}
          onToggleTimer={() => toggleWidget('timer')}
          onToggleMonitor={() => toggleWidget('monitor')}
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
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Camera — left side, top */}
      <DraggableWidget
        isOpen={widgets.camera.isOpen}
        onMinimize={() => minimizeWidget('camera')}
        onFocus={() => focusWidget('camera')}
        initialPosition={{ x: shellLeftInset + 20, y: CAMERA_INITIAL_Y }}
        title="Camera"
        zIndex={getZIndex('camera')}
        width={WIDGET_WIDTH}
        minHeight={200}
      >
        <CameraWidget />
      </DraggableWidget>

      {/* Focus Monitor — left side, below Camera */}
      <DraggableWidget
        isOpen={widgets.monitor.isOpen}
        onMinimize={() => minimizeWidget('monitor')}
        onFocus={() => focusWidget('monitor')}
        initialPosition={{
          x: monitorInitialX || shellLeftInset + 20,
          y: MONITOR_INITIAL_Y,
        }}
        title="Focus Monitor"
        zIndex={getZIndex('monitor')}
        width={WIDGET_WIDTH}
        minHeight={380}
      >
        <CVMonitor />
      </DraggableWidget>

      {/* Pomodoro Timer — right side */}
      <DraggableWidget
        isOpen={widgets.timer.isOpen}
        onMinimize={() => minimizeWidget('timer')}
        onFocus={() => focusWidget('timer')}
        initialPosition={{ x: timerInitialX || 820, y: TIMER_INITIAL_Y }}
        title="Pomodoro Timer"
        zIndex={getZIndex('timer')}
        width={WIDGET_WIDTH}
        minHeight={460}
      >
        <TimerWidget initialSettings={initialTimerSettings} />
      </DraggableWidget>

      {/* Add Flashcards — center */}
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
            minimizeWidget('addFlashcards');
            setEditPayload(null);
            window.location.reload();
          }}
        />
      </DraggableWidget>
    </div>
  );
}
