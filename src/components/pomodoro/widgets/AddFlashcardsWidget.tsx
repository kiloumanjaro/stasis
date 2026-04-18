'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Plus, Check } from 'lucide-react';

interface FlashcardEntry {
  question: string;
  answer: string;
  id?: string;
  source?: 'csv' | 'manual';
}

interface AddFlashcardsWidgetProps {
  onClose: () => void;
  // If provided, widget becomes an editor for an existing deck
  edit?: boolean;
  initialDeck?: {
    fcID: number;
    deckTitle: string;
    description?: string;
  };
  initialFlashcards?: FlashcardEntry[];
  onSaved?: () => void; // called after successful create/update
}

export function AddFlashcardsWidget(props: AddFlashcardsWidgetProps) {
  const [deckTitle, setDeckTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'manual' | 'csv'>('manual');
  const [flashcards, setFlashcards] = useState<FlashcardEntry[]>([
    {
      question: '',
      answer: '',
      id: `${Date.now()}-${Math.random()}`,
      source: 'manual',
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
            source: (f.source as 'csv' | 'manual') ?? 'manual',
          }))
        );
      }
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
        source: 'manual',
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

  const parseCSV = (content: string): FlashcardEntry[] => {
    const lines = content.trim().split('\n');
    const entries: FlashcardEntry[] = [];

    // Skip header row if it exists
    const startIndex = lines[0].toLowerCase().includes('question') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles basic cases)
      const parts = line.split(',').map((part) => part.trim());
      if (parts.length >= 2) {
        entries.push({
          question: parts[0].replace(/^["']|["']$/g, ''), // Remove quotes
          answer: parts[1].replace(/^["']|["']$/g, ''),
        });
      }
    }

    return entries;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setError('');

    // Parse CSV preview
    const content = await file.text();
    const parsed = parseCSV(content).map((p) => ({
      ...p,
      id: `${Date.now()}-${Math.random()}`,
      source: 'csv' as const,
    }));
    if (parsed.length > 0) {
      // Replace any previous CSV-sourced entries but keep manual entries
      setFlashcards((prev) => {
        const manual = prev.filter((f) => f.source !== 'csv');
        return [...manual, ...parsed];
      });
    } else {
      setError('No valid rows found in CSV.');
    }
  };

  const handleSubmit = async () => {
    // Mark form as submitted to show field-level validation
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
      if (props.edit && props.initialDeck?.fcID) {
        // Update existing deck
        const response = await fetch('/api/flashcards/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fcID: props.initialDeck.fcID,
            deckTitle: deckTitle.trim(),
            description: description.trim(),
            flashcards: validCards,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update flashcards');
        }

        // Notify parent and close
        props.onSaved?.();
        props.onClose();
        return;
      }

      // Create new deck (existing behavior)
      const response = await fetch('/api/flashcards/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckTitle: deckTitle.trim(),
          description: description.trim(),
          flashcards: validCards,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create flashcards');
      }

      // Success - clear any validation timer and refresh the page to show new deck
      if (submittedTimeoutRef.current) {
        clearTimeout(submittedTimeoutRef.current);
        submittedTimeoutRef.current = null;
      }
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create flashcards'
      );
    } finally {
      setIsSubmitting(false);
    }

    try {
      const response = await fetch('/api/flashcards/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckTitle: deckTitle.trim(),
          description: description.trim(),
          flashcards: validCards,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create flashcards');
      }

      // Success - clear any validation timer and refresh the page to show new deck
      if (submittedTimeoutRef.current) {
        clearTimeout(submittedTimeoutRef.current);
        submittedTimeoutRef.current = null;
      }
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create flashcards'
      );
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

        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setMode('manual')}
            size="sm"
            className={`flex items-center px-5 py-4 ${mode === 'manual' ? 'bg-accent' : ''}`}
          >
            Manual Entry
          </Button>
          <Button
            variant="ghost"
            onClick={() => setMode('csv')}
            size="sm"
            className={`flex items-center px-5 py-4 ${mode === 'csv' ? 'bg-accent' : ''}`}
          >
            CSV Upload
          </Button>
        </div>

        {mode === 'csv' ? (
          <div>
            <Label htmlFor="csvFile">Upload CSV File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csvFile"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {flashcards.some((f) => f.source === 'csv') && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    // clear CSV-sourced entries
                    setFlashcards((prev) =>
                      prev.filter((f) => f.source !== 'csv')
                    );
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  title="Remove uploaded CSV"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Format: question,answer (one pair per line)
            </p>

            {flashcards.length > 0 ? (
              <>
                {flashcards.filter((f) => f.source === 'csv').length > 0 && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✓ {flashcards.filter((f) => f.source === 'csv').length}{' '}
                    flashcard(s) loaded — edit below or remove entries
                  </p>
                )}

                <div className="mt-3 space-y-3">
                  <Label>Flashcard(s) + from CSV</Label>
                  {flashcards.map((card, index) => (
                    <Card key={index} className="space-y-2 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Card {index + 1}
                        </span>
                        <div className="flex gap-2">
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
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No flashcards loaded yet.
              </p>
            )}
          </div>
        ) : (
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
        )}
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
