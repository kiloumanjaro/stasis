import {
  getNextState,
  type CardState,
  type Difficulty,
} from '@/components/pomodoro/spacedRepetition';
import type { AdaptiveStudyParameters } from '@/types/preferences';

export type DefaultCardSort = 'due_date' | 'difficulty' | 'random';
export type GazeSensitivity = 'low' | 'medium' | 'high';
export type CompletionSound = 'none' | 'soft_chime' | 'bell';
export type PrivacyComfort = 'visible' | 'hidden';

export interface SettingsProfile {
  id?: string;
  email?: string | null;
  display_name?: string | null;
  focus_goal_minutes?: number | null;
  break_duration_minutes?: number | null;
  long_break_duration_minutes?: number | null;
  daily_goal_cards?: number | null;
  default_card_sort?: DefaultCardSort | null;
  shortcuts_enabled?: boolean | null;
  cv_monitoring_enabled?: boolean | null;
  burnout_threshold_minutes?: number | null;
  gaze_sensitivity?: GazeSensitivity | null;
  heatmap_range_days?: 30 | 60 | 90 | null;
  card_animation_enabled?: boolean | null;
  completion_sound?: CompletionSound | null;
  reminder_enabled?: boolean | null;
  reminder_time?: string | null;
  privacy_comfort?: PrivacyComfort | null;
  expression_tolerance?: number | null;
}

export interface OnboardingState {
  focusGoalMinutes: number;
  breakDurationMinutes: number;
  dailyGoalCards: number;
  cvMonitoringEnabled: boolean;
  completed: boolean;
  skipped: boolean;
}

export interface PreferenceSummaryState {
  scores: Record<string, number>;
  adaptiveParams: AdaptiveStudyParameters;
  savedAt: string;
}

export interface StoredFlashcard {
  qID: number;
  question: string;
  answer: string;
}

export interface StoredFlashcardDeck {
  fc_id: number;
  fc_name: string;
  description?: string;
  questions: StoredFlashcard[];
}

interface FlashcardStore {
  nextDeckId: number;
  nextQuestionId: number;
  decks: StoredFlashcardDeck[];
  cardStates: Record<number, CardState>;
}

const SETTINGS_STORAGE_KEY = 'stasis-settings-profile';
const ONBOARDING_STORAGE_KEY = 'stasis-onboarding';
const PREFERENCE_SUMMARY_STORAGE_KEY = 'stasis-preference-summary';
const FLASHCARD_STORAGE_KEY = 'stasis-flashcards';

export const DEFAULT_SETTINGS_PROFILE: SettingsProfile = {
  focus_goal_minutes: 25,
  break_duration_minutes: 5,
  long_break_duration_minutes: 20,
  daily_goal_cards: 20,
  default_card_sort: 'due_date',
  shortcuts_enabled: true,
  cv_monitoring_enabled: false,
  burnout_threshold_minutes: 10,
  gaze_sensitivity: 'medium',
  heatmap_range_days: 30,
  card_animation_enabled: true,
  completion_sound: 'soft_chime',
  reminder_enabled: false,
  reminder_time: '08:00',
  display_name: null,
  email: null,
  privacy_comfort: 'visible',
  expression_tolerance: 0.5,
};

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  focusGoalMinutes: 25,
  breakDurationMinutes: 5,
  dailyGoalCards: 20,
  cvMonitoringEnabled: false,
  completed: false,
  skipped: false,
};

function canUseBrowserStorage() {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

function readJson<T>(storageKey: string, fallback: T): T {
  if (!canUseBrowserStorage()) {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(storageKey: string, value: T) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

function normalizeQuestionId(
  value: string | number | undefined
): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function createInitialCardState(qID: number): CardState {
  return {
    qID,
    intervalDays: 0,
    ease: 2.5,
    step: 0,
    nextReviewAt: Date.now(),
    status: 'new',
  };
}

function getDefaultFlashcardStore(): FlashcardStore {
  return {
    nextDeckId: 1,
    nextQuestionId: 1,
    decks: [],
    cardStates: {},
  };
}

export function readOnboardingState(): OnboardingState {
  return {
    ...DEFAULT_ONBOARDING_STATE,
    ...readJson<Partial<OnboardingState>>(ONBOARDING_STORAGE_KEY, {}),
  };
}

export function saveOnboardingState(patch: Partial<OnboardingState>) {
  const nextState = {
    ...readOnboardingState(),
    ...patch,
  };

  writeJson(ONBOARDING_STORAGE_KEY, nextState);
  return nextState;
}

export function markOnboardingComplete() {
  const onboarding = saveOnboardingState({
    completed: true,
  });

  saveSettingsProfile({
    focus_goal_minutes: onboarding.focusGoalMinutes,
    break_duration_minutes: onboarding.breakDurationMinutes,
    daily_goal_cards: onboarding.dailyGoalCards,
    cv_monitoring_enabled: onboarding.cvMonitoringEnabled,
  });

  return onboarding;
}

export function readSettingsProfile(): SettingsProfile {
  return {
    ...DEFAULT_SETTINGS_PROFILE,
    ...readJson<Partial<SettingsProfile>>(SETTINGS_STORAGE_KEY, {}),
  };
}

export function saveSettingsProfile(patch: Partial<SettingsProfile>) {
  const nextProfile = {
    ...readSettingsProfile(),
    ...patch,
  };

  writeJson(SETTINGS_STORAGE_KEY, nextProfile);
  return nextProfile;
}

export function clearSettingsProfile() {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
}

export function readPreferenceSummary(): PreferenceSummaryState | null {
  const value = readJson<PreferenceSummaryState | null>(
    PREFERENCE_SUMMARY_STORAGE_KEY,
    null
  );

  return value ?? null;
}

export function readFlashcardStore(): FlashcardStore {
  const rawStore = readJson<FlashcardStore>(
    FLASHCARD_STORAGE_KEY,
    getDefaultFlashcardStore()
  );

  return {
    nextDeckId: Math.max(1, rawStore.nextDeckId ?? 1),
    nextQuestionId: Math.max(1, rawStore.nextQuestionId ?? 1),
    decks: rawStore.decks ?? [],
    cardStates: rawStore.cardStates ?? {},
  };
}

function saveFlashcardStore(store: FlashcardStore) {
  writeJson(FLASHCARD_STORAGE_KEY, store);
}

export function listFlashcardDecks(): StoredFlashcardDeck[] {
  return readFlashcardStore().decks;
}

export function getFlashcardDeck(deckId: number) {
  return (
    readFlashcardStore().decks.find((deck) => deck.fc_id === deckId) ?? null
  );
}

export function createFlashcardDeck(input: {
  deckTitle: string;
  description?: string;
  flashcards: Array<{ question: string; answer: string }>;
}) {
  const store = readFlashcardStore();
  const questions = input.flashcards.map((flashcard) => {
    const qID = store.nextQuestionId++;
    store.cardStates[qID] = createInitialCardState(qID);

    return {
      qID,
      question: flashcard.question.trim(),
      answer: flashcard.answer.trim(),
    };
  });

  const deck: StoredFlashcardDeck = {
    fc_id: store.nextDeckId++,
    fc_name: input.deckTitle.trim(),
    description: input.description?.trim() || undefined,
    questions,
  };

  store.decks = [...store.decks, deck];
  saveFlashcardStore(store);
  return deck;
}

export function updateFlashcardDeck(input: {
  fcID: number;
  deckTitle: string;
  description?: string;
  flashcards: Array<{ question: string; answer: string; id?: string }>;
}) {
  const store = readFlashcardStore();
  const deckIndex = store.decks.findIndex((deck) => deck.fc_id === input.fcID);
  if (deckIndex < 0) {
    throw new Error('Deck not found');
  }

  const nextQuestionIds = new Set<number>();
  const questions = input.flashcards.map((flashcard) => {
    const existingId = normalizeQuestionId(flashcard.id);
    const qID = existingId ?? store.nextQuestionId++;

    if (!store.cardStates[qID]) {
      store.cardStates[qID] = createInitialCardState(qID);
    }

    nextQuestionIds.add(qID);

    return {
      qID,
      question: flashcard.question.trim(),
      answer: flashcard.answer.trim(),
    };
  });

  const existingDeck = store.decks[deckIndex];
  existingDeck.questions
    .map((question) => question.qID)
    .filter((qID) => !nextQuestionIds.has(qID))
    .forEach((qID) => {
      delete store.cardStates[qID];
    });

  store.decks[deckIndex] = {
    ...existingDeck,
    fc_name: input.deckTitle.trim(),
    description: input.description?.trim() || undefined,
    questions,
  };

  saveFlashcardStore(store);
  return store.decks[deckIndex];
}

export function deleteFlashcardDeck(deckId: number) {
  const store = readFlashcardStore();
  const deck = store.decks.find((item) => item.fc_id === deckId);
  if (!deck) {
    return;
  }

  deck.questions.forEach((question) => {
    delete store.cardStates[question.qID];
  });

  store.decks = store.decks.filter((item) => item.fc_id !== deckId);
  saveFlashcardStore(store);
}

export function resetFlashcardDeckProgress(deckId: number) {
  const store = readFlashcardStore();
  const deck = store.decks.find((item) => item.fc_id === deckId);
  if (!deck) {
    return;
  }

  deck.questions.forEach((question) => {
    store.cardStates[question.qID] = createInitialCardState(question.qID);
  });

  saveFlashcardStore(store);
}

export function getFlashcardDeckCardStates(deckId: number): CardState[] {
  const store = readFlashcardStore();
  const deck = store.decks.find((item) => item.fc_id === deckId);
  if (!deck) {
    return [];
  }

  return deck.questions
    .map(
      (question) =>
        store.cardStates[question.qID] ?? createInitialCardState(question.qID)
    )
    .map((state) => ({ ...state }));
}

export function updateFlashcardState(
  qID: number,
  difficulty: Difficulty
): CardState {
  const store = readFlashcardStore();
  const currentState = store.cardStates[qID] ?? createInitialCardState(qID);
  const nextState = getNextState(currentState, difficulty);

  store.cardStates[qID] = nextState;
  saveFlashcardStore(store);

  return nextState;
}

export function clearFrontendAppState() {
  if (!canUseBrowserStorage()) {
    return;
  }

  [
    SETTINGS_STORAGE_KEY,
    ONBOARDING_STORAGE_KEY,
    PREFERENCE_SUMMARY_STORAGE_KEY,
    FLASHCARD_STORAGE_KEY,
    EMOTION_HISTORY_STORAGE_KEY,
  ].forEach((storageKey) => {
    window.localStorage.removeItem(storageKey);
  });
}

// ---------------------------------------------------------------------------
// Emotion session history persistence
// ---------------------------------------------------------------------------

const EMOTION_HISTORY_STORAGE_KEY = 'stasis-emotion-history';

export interface EmotionSessionEntry {
  emotion: string;
  confidence: number;
  timestamp: number;
}

export interface EmotionSessionRecord {
  sessionId: string;
  startedAt: number;
  endedAt: number;
  entries: EmotionSessionEntry[];
}

interface EmotionHistoryStore {
  sessions: EmotionSessionRecord[];
}

function getDefaultEmotionHistoryStore(): EmotionHistoryStore {
  return { sessions: [] };
}

export function readEmotionHistory(): EmotionSessionRecord[] {
  return readJson<EmotionHistoryStore>(
    EMOTION_HISTORY_STORAGE_KEY,
    getDefaultEmotionHistoryStore()
  ).sessions;
}

export function saveEmotionSession(session: EmotionSessionRecord) {
  const store = readJson<EmotionHistoryStore>(
    EMOTION_HISTORY_STORAGE_KEY,
    getDefaultEmotionHistoryStore()
  );
  store.sessions = [...store.sessions, session];
  writeJson(EMOTION_HISTORY_STORAGE_KEY, store);
}
