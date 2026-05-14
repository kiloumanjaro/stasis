'use client';

import { useState, useCallback } from 'react';
import { fsrsClient } from '@/lib/fsrs-client';
import type { Card, Review, SessionCard } from '@/types/fsrs';
import type { Difficulty } from '@/components/pomodoro/spacedRepetition';

const DIFFICULTY_TO_GRADE: Record<Difficulty, 1 | 2 | 3 | 4> = {
  again: 1,
  hard: 2,
  medium: 3,
  easy: 4,
};

export function useSession(deckId: number | null) {
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [noCardsDue, setNoCardsDue] = useState(false);

  const loadSession = useCallback(async () => {
    if (deckId === null) return;
    setIsLoading(true);
    setError(null);
    setSessionComplete(false);
    setNoCardsDue(false);
    setCurrentIndex(0);
    try {
      const [sessionData, cards] = await Promise.all([
        fsrsClient.sessions.load(deckId),
        fsrsClient.cards.list(deckId),
      ]);
      setSessionCards(sessionData.cards);
      setAllCards(cards);
      if (sessionData.cards.length === 0) {
        setNoCardsDue(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  const submitReview = useCallback(
    async (difficulty: Difficulty) => {
      if (deckId === null) return;
      const card = sessionCards[currentIndex];
      if (!card) return;

      const review: Review = {
        cardId: card.id,
        rating: DIFFICULTY_TO_GRADE[difficulty],
        reviewedAt: new Date().toISOString(),
      };

      setIsSubmitting(true);
      try {
        await fsrsClient.sessions.submit(deckId, [review]);
        const remaining = sessionCards.filter((_, i) => i !== currentIndex);
        setSessionCards(remaining);
        setCurrentIndex(
          Math.max(0, Math.min(currentIndex, remaining.length - 1))
        );

        if (remaining.length === 0) {
          const cards = await fsrsClient.cards.list(deckId);
          setAllCards(cards);
          setSessionComplete(true);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to submit review'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [deckId, sessionCards, currentIndex]
  );

  const nextDueAt = useCallback((): Date | null => {
    if (allCards.length === 0) return null;
    const now = new Date();
    const futureDates = allCards
      .map((c) => new Date(c.due))
      .filter((d) => d > now)
      .sort((a, b) => a.getTime() - b.getTime());
    return futureDates[0] ?? null;
  }, [allCards]);

  const resetSession = useCallback(() => {
    setSessionCards([]);
    setAllCards([]);
    setCurrentIndex(0);
    setError(null);
    setSessionComplete(false);
    setNoCardsDue(false);
  }, []);

  return {
    sessionCards,
    currentCard: sessionCards[currentIndex] ?? null,
    totalCards: allCards.length,
    dueCount: sessionCards.length,
    isLoading,
    isSubmitting,
    error,
    sessionComplete,
    noCardsDue,
    loadSession,
    submitReview,
    nextDueAt,
    resetSession,
  };
}
