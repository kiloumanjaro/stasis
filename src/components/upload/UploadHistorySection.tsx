'use client';

import { Icon } from '@iconify/react';

import { Combobox } from '@/components/ui/combobox';
import type { DeckWithStats } from '@/hooks/useDecks';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

const sortOptions = [
  { value: 'Date Uploaded', label: 'Date Uploaded' },
  { value: 'Recent Activity', label: 'Recent Activity' },
  { value: 'File Type', label: 'File Type' },
];

interface UploadHistorySectionProps {
  decks?: DeckWithStats[];
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function UploadHistorySection({
  decks = [],
  sortBy,
  onSortChange,
}: UploadHistorySectionProps) {
  // We can eventually implement sorting logic here using `sortBy`

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg">Upload Files</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <span className="text-sm text-[#91918d]">Sort By</span>
          <Combobox
            value={sortBy}
            onChange={onSortChange}
            options={sortOptions}
          />
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-[#4a4a46] p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <Icon icon="bi:inbox" className="h-10 w-10 text-[#91918d]" />
            <div>
              <p className="text-base text-white">No files uploaded yet</p>
              <p className="text-sm text-[#91918d]">
                Upload a file above to get started
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card key={deck.id} className="border-[#4a4a46] bg-[#1f1e1d]">
              <CardHeader className="pb-2">
                <CardTitle className="truncate text-base" title={deck.name}>
                  {deck.name}
                </CardTitle>
                <CardDescription
                  className="line-clamp-2"
                  title={deck.description || ''}
                >
                  {deck.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {deck.totalCards} cards generated
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
