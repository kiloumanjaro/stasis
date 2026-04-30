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
import {
  CardState,
  Difficulty,
  getDueCards,
  areAllCardsMastered,
} from '@/components/pomodoro/spacedRepetition';
import {
  deleteFlashcardDeck as removeFlashcardDeck,
  getFlashcardDeck,
  getFlashcardDeckCardStates,
  listFlashcardDecks,
  resetFlashcardDeckProgress as resetStoredFlashcardDeckProgress,
  updateFlashcardState,
} from '@/lib/frontend-store';

interface Question {
  qID: number;
  question: string;
  answer: string;
}

interface FlashcardDeck {
  fc_id: number;
  fc_name: string;
  description?: string;
}

interface DeckStats {
  fc_id: number;
  totalCards: number;
  dueCards: number;
  nextCardAt: number | null;
}

export function FlashcardPracticeArea({
  onRequestEditDeck,
  cardAnimationEnabled = true,
  shortcutsEnabled = true,
}: {
  onRequestEditDeck?: (deck: FlashcardDeck) => void;
  cardAnimationEnabled?: boolean;
  shortcutsEnabled?: boolean;
}) {
  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-white" />
      <span className="text-lg text-white">Loading...</span>
    </div>
  );
  const enableCardAnimation = cardAnimationEnabled !== false;
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [deckStats, setDeckStats] = useState<Record<number, DeckStats>>({});
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [showDeckPreview, setShowDeckPreview] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [currentQID, setCurrentQID] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [allMastered, setAllMastered] = useState(false);
  const [showMasteredMessage, setShowMasteredMessage] = useState(false);
  const [isLoadingDeck, setIsLoadingDeck] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [now, setNow] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dueCountAnimation, setDueCountAnimation] = useState<
    'subtract' | 'add' | null
  >(null);
  const [sortBy, setSortBy] = useState<'name' | 'due' | 'progress'>('due');

  // Update current time
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch decks on mount
  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      setIsLoadingDeck(true);
      setError(null);
      const fetchedDecks = listFlashcardDecks();
      setDecks(fetchedDecks);

      // Fetch stats for each deck
      const stats: Record<number, DeckStats> = {};
      fetchedDecks.forEach((deck: FlashcardDeck) => {
        const currentStates = getFlashcardDeckCardStates(deck.fc_id);
        const dueCards = getDueCards(currentStates, Date.now());
        const nextCard =
          currentStates.length > 0
            ? currentStates.reduce((min, card) =>
                card.nextReviewAt < min.nextReviewAt ? card : min
              )
            : null;

        stats[deck.fc_id] = {
          fc_id: deck.fc_id,
          totalCards: currentStates.length,
          dueCards: dueCards.length,
          nextCardAt: nextCard ? nextCard.nextReviewAt : null,
        };
      });
      setDeckStats(stats);
      setIsLoadingDeck(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoadingDeck(false);
    }
  };

  const selectDeck = async (deck: FlashcardDeck) => {
    try {
      setIsLoadingDeck(true);
      setError(null);
      setSelectedDeck(deck);

      const storedDeck = getFlashcardDeck(deck.fc_id);
      if (!storedDeck) {
        throw new Error('Failed to fetch questions');
      }

      const fetchedQuestions = storedDeck.questions.map((q) => ({
        qID: q.qID,
        question: q.question,
        answer: q.answer,
      }));
      setQuestions(fetchedQuestions);

      setCardStates(getFlashcardDeckCardStates(deck.fc_id));

      setShowDeckPreview(true);
      setIsLoadingDeck(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoadingDeck(false);
    }
  };

  const startDeckPractice = () => {
    setShowDeckPreview(false);

    // Set first card
    const dueCards = getDueCards(cardStates, Date.now());
    if (dueCards.length > 0) {
      setCurrentQID(dueCards[0].qID);
    } else if (cardStates.length > 0) {
      const soonest = cardStates.reduce((min: CardState, card: CardState) =>
        card.nextReviewAt < min.nextReviewAt ? card : min
      );
      setCurrentQID(soonest.qID);
    }
  };

  const resetDeckProgress = async () => {
    if (!selectedDeck) return;
    try {
      setIsResetting(true);
      setError(null);
      resetStoredFlashcardDeckProgress(selectedDeck.fc_id);
      setCardStates(getFlashcardDeckCardStates(selectedDeck.fc_id));
      setIsResetting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset deck');
      setIsResetting(false);
    }
  };

  const [confirmDeleteDeck, setConfirmDeleteDeck] =
    useState<FlashcardDeck | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteDeck = async (deck: FlashcardDeck) => {
    // Open confirmation UI instead of window.confirm
    setConfirmDeleteDeck(deck);
  };

  const performDeleteDeck = async (deck: FlashcardDeck) => {
    try {
      setIsDeleting(true);
      setError(null);
      removeFlashcardDeck(deck.fc_id);

      // If the deleted deck is currently selected, clear selection
      if (selectedDeck?.fc_id === deck.fc_id) {
        setSelectedDeck(null);
        setShowDeckPreview(false);
        setQuestions([]);
        setCardStates([]);
      }

      // Refresh deck list/stats
      await fetchDecks();
      setConfirmDeleteDeck(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deck');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get current card state
  const currentCardState = cardStates.find((cs) => cs.qID === currentQID);
  const currentQuestion = questions.find((q) => q.qID === currentQID);
  const dueCards = getDueCards(cardStates, now);

  // Check if all mastered
  useEffect(() => {
    if (cardStates.length === 0) return;
    const mastered = areAllCardsMastered(cardStates, now);
    setAllMastered(mastered);
  }, [cardStates, now]);

  const handleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const handleDifficulty = useCallback(
    async (difficulty: Difficulty) => {
      if (!currentCardState) return;

      // Show subtract animation
      setDueCountAnimation('subtract');
      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        const nextState = updateFlashcardState(
          currentCardState.qID,
          difficulty
        );

        // Update local state
        const newCardStates = cardStates.map((cs) =>
          cs.qID === currentCardState.qID ? nextState : cs
        );
        setCardStates(newCardStates);
        setIsFlipped(false);

        // Show add animation if card becomes due again
        const wasDue = currentCardState.nextReviewAt <= now;
        const isDueNow = nextState.nextReviewAt <= Date.now();
        if (isDueNow && wasDue) {
          setDueCountAnimation('add');
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
        setDueCountAnimation(null);

        // Move to next due card
        const updatedDueCards = getDueCards(newCardStates, now);
        if (updatedDueCards.length > 0) {
          const nextCard =
            updatedDueCards.find((card) => card.qID !== currentCardState.qID) ||
            updatedDueCards[0];
          setCurrentQID(nextCard.qID);
          setShowMasteredMessage(false);
        } else {
          // All current due cards answered
          setShowMasteredMessage(true);
          const soonest = newCardStates.reduce(
            (min: CardState, card: CardState) =>
              card.nextReviewAt < min.nextReviewAt ? card : min
          );
          setCurrentQID(soonest.qID);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update card');
      }
    },
    [cardStates, currentCardState, now]
  );

  useEffect(() => {
    if (!shortcutsEnabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          tagName === 'BUTTON' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      if (
        !currentCardState ||
        !currentQuestion ||
        showDeckPreview ||
        allMastered
      ) {
        return;
      }

      if ((event.key === ' ' || event.key === 'Enter') && !isFlipped) {
        event.preventDefault();
        handleFlip();
        return;
      }

      if (!isFlipped) {
        return;
      }

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
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    shortcutsEnabled,
    currentCardState,
    currentQuestion,
    showDeckPreview,
    allMastered,
    isFlipped,
    handleDifficulty,
    handleFlip,
  ]);

  const handleOptionalStop = () => {
    setSelectedDeck(null);
    setQuestions([]);
    setCardStates([]);
    setCurrentQID(null);
    setIsFlipped(false);
    setAllMastered(false);
    setShowMasteredMessage(false);
    fetchDecks();
  };

  // Show deck preview screen after selection
  if (selectedDeck && showDeckPreview) {
    const dueCardsCount = cardStates.filter(
      (card) => new Date(card.nextReviewAt).getTime() <= now
    ).length;
    const isComplete = areAllCardsMastered(cardStates, now);
    const canStart = cardStates.length === 0 || !isComplete;

    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-[#4a4a46] bg-[#30302e] p-6">
          <div className="mb-8">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-2xl font-bold text-white">
                {selectedDeck.fc_name}
              </h2>
              <button
                onClick={handleOptionalStop}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#4a4a46] text-gray-400 transition-colors hover:border-[#5a5a56] hover:bg-[#4a4a46] hover:text-white"
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
            {cardStates.length > 0 && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#4a4a46] bg-[#191919] p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4a4a46]">
                      <Layers className="h-5 w-5 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Cards</p>
                      <p className="text-xl font-semibold text-white">
                        {cardStates.length}
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
                        {dueCardsCount}
                      </p>
                    </div>
                  </div>
                </div>
                {isComplete && (
                  <p className="text-green-400">✓ All cards reviewed!</p>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-between">
            <Button
              onClick={resetDeckProgress}
              variant="ghost"
              className="border border-[#4a4a46] bg-none px-4 py-2 text-sm font-normal text-white transition-colors hover:border-[#5a5a56] hover:bg-[#4a4a46] hover:text-white"
              disabled={isResetting}
            >
              {isResetting ? 'Resetting...' : 'Reset Progress'}
            </Button>

            <Button
              onClick={startDeckPractice}
              disabled={!canStart}
              variant="default"
              className={`px-8 py-2 text-sm ${!canStart ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              Start
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show deck selection if not selected
  if (!selectedDeck) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-3xl rounded-lg border border-[#4a4a46]/50 bg-[#0f0f0f] p-6">
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/50 bg-red-900/20 p-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}
          {isLoadingDeck ? (
            <LoadingSpinner />
          ) : decks.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-full max-w-2xl rounded-lg border-2 border-dashed border-[#4a4a46] px-12 py-12 text-center">
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
              {/* Confirmation modal for delete */}
              {confirmDeleteDeck && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="w-full max-w-md rounded-lg bg-[#30302e] p-6 shadow-lg">
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      Delete Deck
                    </h3>
                    <p className="mb-4 text-sm text-gray-300">
                      Are you sure you want to delete &quot;
                      {confirmDeleteDeck.fc_name}&quot; and all its cards? This
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
                <div className="flex justify-end">
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
              </div>
              <div className="grid max-w-3xl grid-cols-1 gap-3 md:grid-cols-2">
                {decks
                  .slice()
                  .sort((a, b) => {
                    const statsA = deckStats[a.fc_id];
                    const statsB = deckStats[b.fc_id];

                    if (sortBy === 'name') {
                      return a.fc_name.localeCompare(b.fc_name);
                    } else if (sortBy === 'due') {
                      const dueA = statsA?.dueCards || 0;
                      const dueB = statsB?.dueCards || 0;
                      return dueB - dueA;
                    } else if (sortBy === 'progress') {
                      const progressA = statsA
                        ? statsA.totalCards > 0
                          ? ((statsA.totalCards - statsA.dueCards) /
                              statsA.totalCards) *
                            100
                          : 0
                        : 0;
                      const progressB = statsB
                        ? statsB.totalCards > 0
                          ? ((statsB.totalCards - statsB.dueCards) /
                              statsB.totalCards) *
                            100
                          : 0
                        : 0;
                      return progressB - progressA;
                    }
                    return 0;
                  })
                  .map((deck, index) => {
                    const stats = deckStats[deck.fc_id];
                    const progress = stats
                      ? stats.totalCards > 0
                        ? ((stats.totalCards - stats.dueCards) /
                            stats.totalCards) *
                          100
                        : 0
                      : 0;

                    return (
                      <Card
                        key={deck.fc_id}
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
                                {deck.fc_name}
                              </h3>
                            </div>
                            {deck.description && (
                              <p className="mt-2 line-clamp-2 text-sm text-gray-400">
                                {deck.description}
                              </p>
                            )}
                          </div>
                          {/* Triple dot menu for deck actions */}
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
                                  if (onRequestEditDeck) {
                                    onRequestEditDeck(deck);
                                  } else {
                                    alert('Edit deck not available');
                                  }
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
                              {stats?.dueCards || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pb-4 text-sm">
                            <span className="text-gray-400">Total</span>
                            <span className="font-semibold text-white">
                              {stats?.totalCards || 0}
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

  if (!currentCardState || !currentQuestion) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="rounded-lg border border-[#4a4a46] bg-[#30302e] p-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (allMastered) {
    const nextCard = cardStates.reduce((min: CardState, card: CardState) =>
      card.nextReviewAt < min.nextReviewAt ? card : min
    );
    const nextDueTime = new Date(nextCard.nextReviewAt).toLocaleString();

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
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#4a4a46] text-gray-400 transition-colors hover:border-[#5a5a56] hover:bg-[#4a4a46] hover:text-white"
                aria-label="Back to decks"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-6 text-base text-gray-300">
              No more cards due for review.
            </p>
            <p className="mb-8 text-gray-400">
              Next card available at:
              <br />
              <span className="text-lg font-semibold text-white">
                {nextDueTime}
              </span>
            </p>
            <p className="text-sm text-gray-400">
              Deck:{' '}
              <span className="text-gray-300">{selectedDeck?.fc_name}</span>
            </p>
          </div>
          <div className="flex flex-row justify-between">
            <Button
              onClick={resetDeckProgress}
              variant="ghost"
              className="border border-[#4a4a46] px-4 py-2 text-sm text-gray-400 transition-colors hover:border-[#5a5a56] hover:bg-[#4a4a46] hover:text-white"
              disabled={isResetting}
            >
              {isResetting ? 'Resetting...' : 'Reset Progress'}
            </Button>

            <Button
              disabled
              variant="default"
              className="cursor-not-allowed border border-[#4a4a46] bg-[#191919] px-4 py-2 text-sm text-gray-500 opacity-50"
            >
              Start
            </Button>
          </div>
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
            <div>
              <h2 className="mb-1 text-2xl font-bold text-white">Flashcards</h2>
              <p className="text-gray-400">{selectedDeck?.fc_name}</p>
            </div>
            <button
              onClick={handleOptionalStop}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#4a4a46] text-gray-400 transition-colors hover:border-[#5a5a56] hover:bg-[#4a4a46] hover:text-white"
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
          <div className="mb-6 flex gap-6 text-sm">
            <div className="relative">
              <span className="text-gray-400">Due:</span>
              <span
                className={`ml-2 font-semibold text-white transition-all duration-300 ${
                  dueCountAnimation === 'subtract'
                    ? 'scale-90 text-red-400'
                    : dueCountAnimation === 'add'
                      ? 'scale-110 text-green-400'
                      : ''
                }`}
              >
                {dueCards.length}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Total:</span>
              <span className="ml-2 font-semibold text-white">
                {cardStates.length}
              </span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-900/20 p-4 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Show message when session due cards are done */}
        {showMasteredMessage && (
          <div className="mb-6 rounded-lg border border-[#4a4a46] bg-[#191919] p-4 text-center">
            <p className="text-gray-300">
              All current due cards reviewed! You can continue or stop here.
            </p>
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
                      {currentQuestion.question}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                      Answer
                    </p>
                    <p className="text-xl font-medium text-white">
                      {currentQuestion.answer}
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
                  variant="ghost"
                  className="flex items-center justify-center border border-red-500/50 bg-red-900/20 py-3 text-sm font-semibold text-red-400 hover:bg-red-900/40 hover:text-red-300"
                >
                  Again
                </Button>
                <Button
                  onClick={() => handleDifficulty('hard')}
                  variant="ghost"
                  className="flex items-center justify-center border border-orange-500/50 bg-orange-900/20 py-3 text-sm font-semibold text-orange-400 hover:bg-orange-900/40 hover:text-orange-300"
                >
                  Hard
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleDifficulty('medium')}
                  variant="ghost"
                  className="flex items-center justify-center border border-blue-500/50 bg-blue-900/20 py-3 text-sm font-semibold text-blue-400 hover:bg-blue-900/40 hover:text-blue-300"
                >
                  Medium
                </Button>
                <Button
                  onClick={() => handleDifficulty('easy')}
                  variant="ghost"
                  className="flex items-center justify-center border border-green-500/50 bg-green-900/20 py-3 text-sm font-semibold text-green-400 hover:bg-green-900/40 hover:text-green-300"
                >
                  Easy
                </Button>
              </div>
            </div>
          )}

          {/* Optional Stop Button */}
          {!isFlipped && dueCards.length === 0 && !allMastered && (
            <Button
              onClick={handleOptionalStop}
              variant="ghost"
              className="mt-6 w-full border border-[#4a4a46] bg-[#191919] py-2 text-sm text-gray-400 hover:bg-[#4a4a46] hover:text-white"
            >
              Optional Stop
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
