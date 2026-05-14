'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { fsrsClient } from '@/lib/fsrs-client';
import type { Deck, Card } from '@/types/fsrs';

interface RawDeckEntry {
  deck: Deck;
  cards: Card[];
}

export interface DeckWithStats extends Deck {
  totalCards: number;
  dueCards: number;
  nextDueAt: Date | null;
}

export function useDecks() {
  const [rawDecks, setRawDecks] = useState<RawDeckEntry[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive stats purely from stored card data + current time — no API call needed
  const decks: DeckWithStats[] = useMemo(
    () =>
      rawDecks.map(({ deck, cards }) => {
        const dueCards = cards.filter((c) => new Date(c.due) <= now).length;
        const upcoming = cards
          .map((c) => new Date(c.due))
          .filter((d) => d > now)
          .sort((a, b) => a.getTime() - b.getTime());
        return {
          ...deck,
          totalCards: cards.length,
          dueCards,
          nextDueAt: upcoming[0] ?? null,
        };
      }),
    [rawDecks, now]
  );

  // Advance the clock exactly when the next card across any deck becomes due
  useEffect(() => {
    const nearest =
      decks
        .map((d) => d.nextDueAt)
        .filter((d): d is Date => d !== null)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

    if (!nearest) return;

    const delay = nearest.getTime() - Date.now();
    if (delay <= 0) {
      setNow(new Date());
      return;
    }

    const timer = setTimeout(() => setNow(new Date()), delay);
    return () => clearTimeout(timer);
  }, [decks]);

  const fetchDecks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const deckList = await fsrsClient.decks.list();
      const entries = await Promise.all(
        deckList.map(async (deck) => ({
          deck,
          cards: await fsrsClient.cards.list(deck.id),
        }))
      );
      setRawDecks(entries);
      setNow(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDeck = useCallback(async (deckId: number) => {
    await fsrsClient.decks.delete(deckId);
    setRawDecks((prev) => prev.filter((e) => e.deck.id !== deckId));
  }, []);

  const createDeck = useCallback(
    async (formData: FormData) => fsrsClient.decks.create(formData),
    []
  );

  return { decks, isLoading, error, fetchDecks, deleteDeck, createDeck };
}
