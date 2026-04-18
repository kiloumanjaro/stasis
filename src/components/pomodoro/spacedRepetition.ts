// Spaced Repetition System using SM-2 algorithm with 4 difficulty levels
// Optimized for: again, hard, medium, easy

export interface CardState {
  qID: number;
  intervalDays: number; // interval in days
  ease: number; // ease factor (2.5 default)
  step: number; // learning step (0-1 for learning, 2+ for review)
  nextReviewAt: number; // timestamp (ms)
  status: 'new' | 'learning' | 'review' | 'mastered';
}

export type Difficulty = 'again' | 'hard' | 'medium' | 'easy';

const LEARNING_STEPS = [5, 10]; // minutes for learning steps (5 min, 10 min)
const GRADUATING_INTERVAL = 1; // days - when graduating from learning to review

/**
 * Calculate next state based on SM-2 algorithm
 * Difficulty mapping (SM-2 quality 0-5):
 * - again (0): Complete failure, ease penalty ~-0.8
 * - hard (2): Struggled, ease penalty ~-0.32
 * - medium (4): Good recall, ease unchanged
 * - easy (5): Perfect recall, ease bonus +0.1
 */
export function getNextState(
  currentState: CardState,
  difficulty: Difficulty
): CardState {
  const now = Date.now();
  const newState = { ...currentState };

  // Quality score for SM-2 (0-5 scale)
  const qualityMap = {
    again: 0,
    hard: 2,
    medium: 4,
    easy: 5,
  };
  const quality = qualityMap[difficulty];

  // SM-2 ease factor update
  const newEase = Math.max(
    1.3,
    currentState.ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );
  newState.ease = Math.round(newEase * 100) / 100;

  if (difficulty === 'again') {
    // Reset to learning phase
    newState.step = 0;
    newState.status = 'learning';
    newState.intervalDays = 0;
    newState.nextReviewAt = now + LEARNING_STEPS[0] * 60 * 1000; // 5 minutes
  } else if (
    currentState.status === 'new' ||
    currentState.status === 'learning'
  ) {
    // Learning phase progression
    if (difficulty === 'easy') {
      // Graduate from learning to review
      newState.status = 'review';
      newState.step = 2;
      newState.intervalDays = GRADUATING_INTERVAL;
      newState.nextReviewAt = now + GRADUATING_INTERVAL * 24 * 60 * 60 * 1000;
    } else if (difficulty === 'hard') {
      // Stay in learning, repeat at first learning step
      newState.step = currentState.step;
      newState.nextReviewAt = now + LEARNING_STEPS[0] * 60 * 1000; // 5 minutes
    } else {
      // medium: next learning step (5 min)
      newState.step = currentState.step + 1;
      if (newState.step >= LEARNING_STEPS.length) {
        // Graduate from learning
        newState.status = 'review';
        newState.intervalDays = GRADUATING_INTERVAL;
        newState.nextReviewAt = now + GRADUATING_INTERVAL * 24 * 60 * 60 * 1000;
      } else {
        newState.nextReviewAt = now + LEARNING_STEPS[newState.step] * 60 * 1000;
      }
    }
  } else {
    // Review phase (SM-2 algorithm)
    let newInterval = currentState.intervalDays;

    if (difficulty === 'hard') {
      newInterval = Math.max(1, Math.ceil(currentState.intervalDays / 2));
    } else if (difficulty === 'medium') {
      // Slight increase to show progress (1.2x multiplier)
      newInterval = Math.max(
        currentState.intervalDays + 1,
        Math.ceil(currentState.intervalDays * 1.2)
      );
    } else if (difficulty === 'easy') {
      if (currentState.intervalDays === 0) {
        newInterval = 1;
      } else {
        newInterval = Math.ceil(currentState.intervalDays * newState.ease);
      }
    }

    newState.intervalDays = newInterval;
    newState.nextReviewAt = now + newInterval * 24 * 60 * 60 * 1000;
  }

  return newState;
}

/**
 * Check if all cards are mastered (no due cards)
 */
export function areAllCardsMastered(cards: CardState[], now: number): boolean {
  if (cards.length === 0) return false;
  return getDueCards(cards, now).length === 0;
}

/**
 * Get cards due for review (based on nextReviewAt timestamp)
 */
export function getDueCards(cards: CardState[], now: number): CardState[] {
  return cards.filter((card) => card.nextReviewAt <= now);
}
