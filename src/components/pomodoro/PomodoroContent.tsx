'use client';

import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

type AddFlashcardsWidgetType = 'addFlashcards';

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
  // Separate booleans for each drawer
  const [cameraOpen, setCameraOpen] = useState(initialCvMonitoringEnabled);
  const [timerOpen, setTimerOpen] = useState(false);
  const [monitorOpen, setMonitorOpen] = useState(initialCvMonitoringEnabled);

  // AddFlashcards remains a DraggableWidget
  const [addFlashcardsOpen, setAddFlashcardsOpen] = useState(false);
  const [activeWidget, setActiveWidget] =
    useState<AddFlashcardsWidgetType | null>(null);

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

      {/* Camera Drawer */}
      <Drawer open={cameraOpen} onOpenChange={setCameraOpen} direction="right">
        <DrawerContent>
          <DrawerHeader className="flex flex-row items-center justify-between">
            <DrawerTitle>Camera</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="overflow-y-auto p-4">
            <CameraWidget />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Focus Monitor Drawer */}
      <Drawer
        open={monitorOpen}
        onOpenChange={setMonitorOpen}
        direction="right"
      >
        <DrawerContent>
          <DrawerHeader className="flex flex-row items-center justify-between">
            <DrawerTitle>Focus Monitor</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="overflow-y-auto p-4">
            <CVMonitor />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Pomodoro Timer Drawer */}
      <Drawer open={timerOpen} onOpenChange={setTimerOpen} direction="right">
        <DrawerContent>
          <DrawerHeader className="flex flex-row items-center justify-between">
            <DrawerTitle>Pomodoro Timer</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="overflow-y-auto p-4">
            <TimerWidget initialSettings={initialTimerSettings} />
          </div>
        </DrawerContent>
      </Drawer>

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
