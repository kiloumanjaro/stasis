export interface Deck {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  due: string;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
}

export interface SessionCard {
  id: number;
  front: string;
  back: string;
  state: number;
  intervals: {
    again: string;
    hard: string;
    good: string;
    easy: string;
  };
}

export interface Review {
  cardId: number;
  rating: 1 | 2 | 3 | 4;
  reviewedAt: string;
}
