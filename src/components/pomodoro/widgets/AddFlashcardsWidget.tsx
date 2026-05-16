'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Plus, Check } from 'lucide-react';
import { createFlashcardDeck, updateFlashcardDeck } from '@/lib/frontend-store';
import { fsrsClient } from '@/lib/fsrs-client';
import { toast } from 'sonner';

interface FlashcardEntry {
  question: string;
  answer: string;
  id?: string;
  backendId?: number;
}

interface AddFlashcardsWidgetProps {
  onClose: () => void;
  // If provided, widget becomes an editor for an existing deck
  edit?: boolean;
  initialDeck?: {
    fcID?: number;
    apiDeckId?: number;
    deckTitle: string;
    description?: string;
  };
  initialFlashcards?: FlashcardEntry[];
  onSaved?: () => void; // called after successful create/update
}

export function AddFlashcardsWidget(props: AddFlashcardsWidgetProps) {
  const [deckTitle, setDeckTitle] = useState('');
  const [description, setDescription] = useState('');
  const [flashcards, setFlashcards] = useState<FlashcardEntry[]>([
    {
      question: '',
      answer: '',
      id: `${Date.now()}-${Math.random()}`,
    },
  ]);
  // If in edit mode and initial data provided, populate fields
  const initializeFromProps = (props: AddFlashcardsWidgetProps) => {
    if (props.edit && props.initialDeck) {
      setDeckTitle(props.initialDeck.deckTitle || '');
      setDescription(props.initialDeck.description || '');
      if (props.initialFlashcards && props.initialFlashcards.length > 0) {
        setFlashcards(
          props.initialFlashcards.map((f) => ({
            ...f,
            id: f.id || `${Date.now()}-${Math.random()}`,
          }))
        );
      }
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const submittedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Helper to set submitted true briefly
  const scheduleClearSubmitted = (ms = 3000) => {
    if (submittedTimeoutRef.current) {
      clearTimeout(submittedTimeoutRef.current);
      submittedTimeoutRef.current = null;
    }

    submittedTimeoutRef.current = setTimeout(() => {
      setSubmitted(false);
      submittedTimeoutRef.current = null;
    }, ms);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (submittedTimeoutRef.current) {
        clearTimeout(submittedTimeoutRef.current);
        submittedTimeoutRef.current = null;
      }
    };
  }, []);

  const handleAddCard = () => {
    setFlashcards([
      ...flashcards,
      {
        question: '',
        answer: '',
        id: `${Date.now()}-${Math.random()}`,
      },
    ]);
  };

  const handleRemoveCard = (index: number) => {
    setFlashcards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCardChange = (
    index: number,
    field: 'question' | 'answer',
    value: string
  ) => {
    const updated = [...flashcards];
    updated[index][field] = value;
    setFlashcards(updated);
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!deckTitle.trim()) {
      setError('Please enter a deck title');
      scheduleClearSubmitted();
      return;
    }

    const validCards = flashcards.filter(
      (card) => card.question.trim() && card.answer.trim()
    );

    if (validCards.length === 0) {
      setError('Please add at least one flashcard with question and answer');
      scheduleClearSubmitted();
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const apiDeckId = props.initialDeck?.apiDeckId;

      if (props.edit && apiDeckId) {
        // API deck edit: update deck title/description + update/add/delete cards via backend
        const updateFields: { name?: string; description?: string } = {};
        if (deckTitle.trim() !== (props.initialDeck?.deckTitle ?? '')) {
          updateFields.name = deckTitle.trim();
        }
        if (description.trim() !== (props.initialDeck?.description ?? '')) {
          updateFields.description = description.trim();
        }
        if (
          updateFields.name !== undefined ||
          updateFields.description !== undefined
        ) {
          await fsrsClient.decks.update(apiDeckId, updateFields);
        }

        const originalBackendIds = new Set(
          (props.initialFlashcards ?? [])
            .map((f) => f.backendId)
            .filter((id): id is number => id !== undefined)
        );
        const currentBackendIds = new Set(
          validCards
            .map((c) => c.backendId)
            .filter((id): id is number => id !== undefined)
        );

        // Delete removed cards
        const deletedIds = [...originalBackendIds].filter(
          (id) => !currentBackendIds.has(id)
        );
        await Promise.all(
          deletedIds.map((cardId) => fsrsClient.cards.delete(apiDeckId, cardId))
        );

        // Update existing and add new cards sequentially
        for (const card of validCards) {
          if (card.backendId) {
            await fsrsClient.cards.update(
              apiDeckId,
              card.backendId,
              card.question.trim(),
              card.answer.trim()
            );
          } else {
            await fsrsClient.cards.add(
              apiDeckId,
              card.question.trim(),
              card.answer.trim()
            );
          }
        }

        props.onSaved?.();
        props.onClose();
        return;
      }

      if (props.edit && props.initialDeck?.fcID) {
        updateFlashcardDeck({
          fcID: props.initialDeck.fcID,
          deckTitle: deckTitle.trim(),
          description: description.trim(),
          flashcards: validCards,
        });
        props.onSaved?.();
        props.onClose();
        return;
      }

      createFlashcardDeck({
        deckTitle: deckTitle.trim(),
        description: description.trim(),
        flashcards: validCards,
      });

      if (submittedTimeoutRef.current) {
        clearTimeout(submittedTimeoutRef.current);
        submittedTimeoutRef.current = null;
      }
      props.onSaved?.();
      props.onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save flashcards';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // initialize from props when edit mode is active
  useEffect(() => {
    initializeFromProps(props as AddFlashcardsWidgetProps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.edit, props.initialDeck, props.initialFlashcards]);

  return (
    <div className="flex max-h-[600px] flex-col gap-4 overflow-y-auto p-4">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-background p-8 shadow-xl">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">
                Creating your flashcard deck...
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Please wait</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Add Flashcard Deck</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={props.onClose}
          className="bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700"
        >
          <X className="h-4 w-4 text-white" />
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="deckTitle">Deck Title *</Label>
          <Input
            id="deckTitle"
            value={deckTitle}
            onChange={(e) => setDeckTitle(e.target.value)}
            placeholder="e.g., Spanish Vocabulary"
            aria-invalid={submitted && !deckTitle.trim()}
            className={
              submitted && !deckTitle.trim()
                ? 'border-red-500 ring-1 ring-red-500'
                : ''
            }
          />
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Common phrases for travelers"
          />
        </div>

        <div className="space-y-3">
          <Label>Flashcard(s)</Label>
          {flashcards.map((card, index) => (
            <Card key={index} className="space-y-2 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Card {index + 1}</span>
                {flashcards.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCard(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <Input
                placeholder="Question"
                value={card.question}
                onChange={(e) =>
                  handleCardChange(index, 'question', e.target.value)
                }
                aria-invalid={submitted && !card.question.trim()}
                className={
                  submitted && !card.question.trim()
                    ? 'border-red-500 ring-1 ring-red-500'
                    : ''
                }
              />
              <Input
                placeholder="Answer"
                value={card.answer}
                onChange={(e) =>
                  handleCardChange(index, 'answer', e.target.value)
                }
                aria-invalid={submitted && !card.answer.trim()}
                className={
                  submitted && !card.answer.trim()
                    ? 'border-red-500 ring-1 ring-red-500'
                    : ''
                }
              />
            </Card>
          ))}
          <Button
            variant="ghost"
            onClick={handleAddCard}
            className="flex w-full items-center justify-center py-5"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add Another Card
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t pt-4">
        <Button
          variant="ghost"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 items-center"
        >
          <Check className="h-4 w-4" />
          {isSubmitting
            ? props.edit
              ? 'Saving...'
              : 'Creating...'
            : props.edit
              ? 'Save Changes'
              : 'Create Deck'}
        </Button>
      </div>
    </div>
  );
}
