'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Layers, Clock, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Difficulty } from '@/components/pomodoro/spacedRepetition';
import { useDecks, type DeckWithStats } from '@/hooks/useDecks';
import { useSession } from '@/hooks/useSession';

export function FlashcardPracticeArea({
  onRequestEditDeck,
  cardAnimationEnabled = true,
  shortcutsEnabled = true,
}: {
  onRequestEditDeck?: (deck: DeckWithStats) => void;
  cardAnimationEnabled?: boolean;
  shortcutsEnabled?: boolean;
}) {
  const enableCardAnimation = cardAnimationEnabled !== false;

  const {
    decks,
    isLoading: isLoadingDecks,
    error: decksError,
    fetchDecks,
    deleteDeck: apiDeleteDeck,
  } = useDecks();

  const [selectedDeck, setSelectedDeck] = useState<DeckWithStats | null>(null);
  const [showDeckPreview, setShowDeckPreview] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [confirmDeleteDeck, setConfirmDeleteDeck] =
    useState<DeckWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'due' | 'progress'>('due');
  const [dueCountAnimation, setDueCountAnimation] = useState<'subtract' | null>(
    null
  );

  const {
    currentCard,
    totalCards,
    dueCount,
    isLoading: isLoadingSession,
    isSubmitting,
    error: sessionError,
    sessionComplete,
    noCardsDue,
    loadSession,
    submitReview,
    nextDueAt,
    resetSession,
  } = useSession(selectedDeck?.id ?? null);

  const error = decksError ?? sessionError;
  const isLoadingDeck = isLoadingDecks || isLoadingSession;

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-white" />
      <span className="text-lg text-white">Loading...</span>
    </div>
  );

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Refresh deck stats when the user returns to the tab after being away
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !selectedDeck) {
        fetchDecks();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchDecks, selectedDeck]);

  // When no cards are due, auto-reload the session the moment the next card becomes due
  useEffect(() => {
    if (!noCardsDue) return;
    const next = nextDueAt();
    if (!next) return;
    const delay = next.getTime() - Date.now();
    if (delay <= 0) {
      loadSession();
      return;
    }
    const timer = setTimeout(loadSession, delay);
    return () => clearTimeout(timer);
  }, [noCardsDue, nextDueAt, loadSession]);

  const selectDeck = (deck: DeckWithStats) => {
    resetSession();
    setSelectedDeck(deck);
    setShowDeckPreview(true);
    setIsFlipped(false);
  };

  const startDeckPractice = () => {
    setShowDeckPreview(false);
    setIsFlipped(false);
    loadSession();
  };

  const handleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const handleDifficulty = useCallback(
    async (difficulty: Difficulty) => {
      if (!currentCard || isSubmitting) return;

      setDueCountAnimation('subtract');
      await new Promise((resolve) => setTimeout(resolve, 300));
      setDueCountAnimation(null);

      setIsFlipped(false);
      await submitReview(difficulty);
    },
    [currentCard, isSubmitting, submitReview]
  );

  const handleOptionalStop = () => {
    setSelectedDeck(null);
    setShowDeckPreview(false);
    setIsFlipped(false);
    resetSession();
    fetchDecks();
  };

  const deleteDeck = (deck: DeckWithStats) => {
    setConfirmDeleteDeck(deck);
  };

  const performDeleteDeck = async (deck: DeckWithStats) => {
    try {
      setIsDeleting(true);
      await apiDeleteDeck(deck.id);
      if (selectedDeck?.id === deck.id) {
        setSelectedDeck(null);
        setShowDeckPreview(false);
        resetSession();
      }
      setConfirmDeleteDeck(null);
    } catch (err) {
      console.error('Failed to delete deck', err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          tag === 'BUTTON' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      if (!currentCard || showDeckPreview || sessionComplete) return;

      if ((event.key === ' ' || event.key === 'Enter') && !isFlipped) {
        event.preventDefault();
        handleFlip();
        return;
      }

      if (!isFlipped) return;

      switch (event.key) {
        case '1':
          event.preventDefault();
          void handleDifficulty('again');
          break;
        case '2':
          event.preventDefault();
          void handleDifficulty('hard');
          break;
        case '3':
          event.preventDefault();
          void handleDifficulty('medium');
          break;
        case '4':
          event.preventDefault();
          void handleDifficulty('easy');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    shortcutsEnabled,
    currentCard,
    showDeckPreview,
    sessionComplete,
    isFlipped,
    handleDifficulty,
    handleFlip,
  ]);

  // Deck preview screen
  if (selectedDeck && showDeckPreview) {
    const stats = decks.find((d) => d.id === selectedDeck.id) ?? selectedDeck;

    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-[#4a4a46] bg-[#30302e] p-6">
          <div className="mb-8">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-2xl font-bold text-white">
                {selectedDeck.name}
              </h2>
              <button
                onClick={handleOptionalStop}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e5e5df] bg-[#1a1a18] text-[#e5e5df] transition-colors hover:bg-[#2a2a28]"
                aria-label="Back to decks"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            {selectedDeck.description && (
              <p className="mb-6 text-base text-gray-300">
                {selectedDeck.description}
              </p>
            )}
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#4a4a46] bg-[#191919] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4a4a46]">
                  <Layers className="h-5 w-5 text-gray-300" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total Cards</p>
                  <p className="text-xl font-semibold text-white">
                    {stats.totalCards}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#4a4a46] bg-[#191919] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4a4a46]">
                  <Clock className="h-5 w-5 text-gray-300" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Due Now</p>
                  <p className="text-xl font-semibold text-white">
                    {stats.dueCards}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={startDeckPractice}
              disabled={stats.dueCards === 0}
              variant="default"
              className={`px-8 py-2 text-sm ${stats.dueCards === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {stats.dueCards === 0 ? 'No Cards Due' : 'Start'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Deck list
  if (!selectedDeck) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="min-h-[320px] w-full max-w-3xl">
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/50 bg-red-900/20 p-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}
          {isLoadingDeck && decks.length === 0 ? (
            <div className="flex w-full items-center justify-center rounded-lg border border-[#4a4a46] bg-[#30302e] px-12 py-12">
              <LoadingSpinner />
            </div>
          ) : decks.length === 0 ? (
            <div className="flex items-center justify-center">
              <div className="w-full rounded-lg border border-[#4a4a46] bg-[#30302e] px-12 py-12 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4a4a46]">
                    <svg
                      className="h-8 w-8 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="mb-4 text-xl font-semibold text-white">
                  Focus Cards
                </h2>
                <p className="text-gray-400">
                  Your flash cards will appear here. Upload or create your first
                  deck to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-5">
              {confirmDeleteDeck && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="w-full max-w-md rounded-lg bg-[#30302e] p-6 shadow-lg">
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      Delete Deck
                    </h3>
                    <p className="mb-4 text-sm text-gray-300">
                      Are you sure you want to delete &quot;
                      {confirmDeleteDeck.name}&quot; and all its cards? This
                      action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setConfirmDeleteDeck(null)}
                        disabled={isDeleting}
                        className="border border-[#4a4a46] px-4 py-2 text-sm text-gray-300 hover:bg-[#4a4a46] hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => performDeleteDeck(confirmDeleteDeck)}
                        variant="destructive"
                        className="px-4 py-2 text-sm"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Deck'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl text-white">Select a Deck</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="border border-[#4a4a46] bg-[#191919] text-sm text-gray-300 hover:bg-[#4a4a46] hover:text-white"
                    >
                      Sort by:{' '}
                      {sortBy === 'name'
                        ? 'Name'
                        : sortBy === 'due'
                          ? 'Due Cards'
                          : 'Progress'}
                      <svg
                        className="ml-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-40 border-[#4a4a46] bg-[#30302e]"
                  >
                    <DropdownMenuItem
                      onClick={() => setSortBy('name')}
                      className="cursor-pointer text-gray-300 focus:bg-[#4a4a46] focus:text-white"
                    >
                      Name
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy('due')}
                      className="cursor-pointer text-gray-300 focus:bg-[#4a4a46] focus:text-white"
                    >
                      Due Cards
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy('progress')}
                      className="cursor-pointer text-gray-300 focus:bg-[#4a4a46] focus:text-white"
                    >
                      Progress
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid max-w-3xl grid-cols-1 gap-3 md:grid-cols-2">
                {decks
                  .slice()
                  .sort((a, b) => {
                    if (sortBy === 'name') return a.name.localeCompare(b.name);
                    if (sortBy === 'due') return b.dueCards - a.dueCards;
                    const progressA =
                      a.totalCards > 0
                        ? ((a.totalCards - a.dueCards) / a.totalCards) * 100
                        : 0;
                    const progressB =
                      b.totalCards > 0
                        ? ((b.totalCards - b.dueCards) / b.totalCards) * 100
                        : 0;
                    return progressB - progressA;
                  })
                  .map((deck, index) => {
                    const progress =
                      deck.totalCards > 0
                        ? ((deck.totalCards - deck.dueCards) /
                            deck.totalCards) *
                          100
                        : 0;

                    return (
                      <Card
                        key={deck.id}
                        onClick={() => selectDeck(deck)}
                        className="group cursor-pointer border border-[#4a4a46] bg-[#3a3a38] p-4 transition-all duration-200 hover:border-[#5a5a56] hover:bg-[#4a4a46] hover:shadow-lg"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4a4a46] text-xs font-bold text-gray-300">
                                {index + 1}
                              </span>
                              <h3 className="font-semibold text-white group-hover:underline">
                                {deck.name}
                              </h3>
                            </div>
                            {deck.description && (
                              <p className="mt-2 line-clamp-2 text-sm text-gray-400">
                                {deck.description}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-[#4a4a46] hover:text-white"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Deck actions"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <circle cx="5" cy="12" r="2" />
                                  <circle cx="12" cy="12" r="2" />
                                  <circle cx="19" cy="12" r="2" />
                                </svg>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-44 border-[#4a4a46] bg-[#30302e]"
                            >
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRequestEditDeck?.(deck);
                                }}
                                className="cursor-pointer text-gray-300 focus:bg-[#4a4a46] focus:text-white"
                              >
                                Edit Deck
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDeck(deck);
                                }}
                                className="cursor-pointer text-red-400 focus:bg-red-900 focus:text-white"
                              >
                                Delete Deck
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Due</span>
                            <span className="font-semibold text-white">
                              {deck.dueCards}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pb-4 text-sm">
                            <span className="text-gray-400">Total</span>
                            <span className="font-semibold text-white">
                              {deck.totalCards}
                            </span>
                          </div>
                          <div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-[#4a4a46]">
                              <div
                                className="h-full bg-white transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="mt-1 text-right text-xs text-gray-400">
                              {Math.round(progress)}% complete
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading session
  if (isLoadingSession) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="rounded-lg border border-[#4a4a46] bg-[#30302e] p-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // No cards currently due (session loaded with 0 cards)
  if (noCardsDue) {
    const nextDate = nextDueAt();

    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-[#4a4a46] bg-[#30302e] p-6">
          <div className="mb-8">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-2xl font-bold text-white">No Cards Due</h2>
              <button
                onClick={handleOptionalStop}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e5e5df] bg-[#1a1a18] text-[#e5e5df] transition-colors hover:bg-[#2a2a28]"
                aria-label="Back to decks"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-6 text-base text-gray-300">
              All cards in this deck have been scheduled for a future review.
            </p>
            {nextDate ? (
              <p className="mb-8 text-gray-400">
                Next card available at:
                <br />
                <span className="text-lg font-semibold text-white">
                  {nextDate.toLocaleString()}
                </span>
              </p>
            ) : (
              <p className="mb-8 text-gray-400">
                Check back later for your next review.
              </p>
            )}
            <p className="text-sm text-gray-400">
              Deck: <span className="text-gray-300">{selectedDeck?.name}</span>
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleOptionalStop}
              variant="default"
              className="px-8 py-2 text-sm"
            >
              Back to Decks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Session complete (user reviewed all cards in this session)
  if (sessionComplete) {
    const nextDate = nextDueAt();

    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-[#4a4a46] bg-[#30302e] p-6">
          <div className="mb-8">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-2xl font-bold text-green-400">
                ✓ Session Complete!
              </h2>
              <button
                onClick={handleOptionalStop}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e5e5df] bg-[#1a1a18] text-[#e5e5df] transition-colors hover:bg-[#2a2a28]"
                aria-label="Back to decks"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-6 text-base text-gray-300">
              No more cards due for review.
            </p>
            {nextDate && (
              <p className="mb-8 text-gray-400">
                Next card available at:
                <br />
                <span className="text-lg font-semibold text-white">
                  {nextDate.toLocaleString()}
                </span>
              </p>
            )}
            <p className="text-sm text-gray-400">
              Deck: <span className="text-gray-300">{selectedDeck?.name}</span>
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleOptionalStop}
              variant="default"
              className="px-8 py-2 text-sm"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active card review
  if (!currentCard) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="rounded-lg border border-[#4a4a46] bg-[#30302e] p-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-[#4a4a46] bg-[#30302e] p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">Flashcards</h2>
              <span className="flex items-center gap-1 text-sm text-white">
                <Clock className="h-3.5 w-3.5" />
                <span
                  className={`transition-all duration-300 ${
                    dueCountAnimation === 'subtract' ? 'text-red-400' : ''
                  }`}
                >
                  {dueCount}
                </span>
              </span>
              <span className="flex items-center gap-1 text-sm text-white">
                <Layers className="h-3.5 w-3.5" />
                {totalCards}
              </span>
            </div>
            <button
              onClick={handleOptionalStop}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e5e5df] bg-[#1a1a18] text-[#e5e5df] transition-colors hover:bg-[#2a2a28]"
              aria-label="Exit deck"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="mb-6 text-sm text-gray-400">{selectedDeck?.name}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-900/20 p-4 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Flashcard */}
        <div className="flex flex-col items-center">
          <div onClick={handleFlip} className="mb-8 w-full cursor-pointer">
            <Card
              className={cn(
                'flex min-h-80 flex-col items-center justify-center border border-[#4a4a46] bg-[#191919] p-8',
                enableCardAnimation &&
                  'transition-all duration-300 hover:border-[#5a5a56] hover:shadow-2xl'
              )}
            >
              <div className="flex w-full flex-1 flex-col justify-center text-center">
                {!isFlipped ? (
                  <>
                    <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                      Question
                    </p>
                    <p className="text-xl font-medium text-white">
                      {currentCard.front}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                      Answer
                    </p>
                    <p className="text-xl font-medium text-white">
                      {currentCard.back}
                    </p>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Difficulty Buttons */}
          {isFlipped && (
            <div className="w-full space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleDifficulty('again')}
                  disabled={isSubmitting}
                  variant="ghost"
                  className="flex items-center justify-center border border-red-500/50 bg-red-900/20 py-3 text-sm font-semibold text-red-400 hover:bg-red-900/40 hover:text-red-300 disabled:opacity-50"
                >
                  Again
                </Button>
                <Button
                  onClick={() => handleDifficulty('hard')}
                  disabled={isSubmitting}
                  variant="ghost"
                  className="flex items-center justify-center border border-orange-500/50 bg-orange-900/20 py-3 text-sm font-semibold text-orange-400 hover:bg-orange-900/40 hover:text-orange-300 disabled:opacity-50"
                >
                  Hard
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleDifficulty('medium')}
                  disabled={isSubmitting}
                  variant="ghost"
                  className="flex items-center justify-center border border-blue-500/50 bg-blue-900/20 py-3 text-sm font-semibold text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 disabled:opacity-50"
                >
                  Medium
                </Button>
                <Button
                  onClick={() => handleDifficulty('easy')}
                  disabled={isSubmitting}
                  variant="ghost"
                  className="flex items-center justify-center border border-green-500/50 bg-green-900/20 py-3 text-sm font-semibold text-green-400 hover:bg-green-900/40 hover:text-green-300 disabled:opacity-50"
                >
                  Easy
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
