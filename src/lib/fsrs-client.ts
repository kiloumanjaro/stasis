import type { Card, Deck, Review, SessionCard } from '@/types/fsrs';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<string, string>;
    throw new Error(body.error ?? body.message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const fsrsClient = {
  decks: {
    list: (): Promise<Deck[]> => request('/decks'),
    create: (formData: FormData): Promise<{ deck: Deck; cards: Card[] }> =>
      request('/decks', { method: 'POST', body: formData }),
    get: (id: number): Promise<Deck> => request(`/decks/${id}`),
    delete: (id: number): Promise<void> =>
      request(`/decks/${id}`, { method: 'DELETE' }),
  },

  cards: {
    list: (deckId: number): Promise<Card[]> =>
      request(`/decks/${deckId}/cards`),
    add: (deckId: number, front: string, back: string): Promise<Card> =>
      request(`/decks/${deckId}/cards`, {
        method: 'POST',
        body: JSON.stringify({ front, back }),
      }),
    update: (
      deckId: number,
      cardId: number,
      front: string,
      back: string
    ): Promise<Card> =>
      request(`/decks/${deckId}/cards/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify({ front, back }),
      }),
    delete: (deckId: number, cardId: number): Promise<void> =>
      request(`/decks/${deckId}/cards/${cardId}`, { method: 'DELETE' }),
  },

  sessions: {
    load: (deckId: number): Promise<{ cards: SessionCard[] }> =>
      request(`/decks/${deckId}/session`),
    submit: (deckId: number, reviews: Review[]): Promise<{ saved: number }> =>
      request(`/decks/${deckId}/session`, {
        method: 'POST',
        body: JSON.stringify({ reviews }),
      }),
  },
};
