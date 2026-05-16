'use client';

import type React from 'react';
import { Icon } from '@iconify/react';
import { CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react';

import type { UploadedFile } from '@/components/upload/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UploadZoneProps {
  file: File | null;
  uploadedFile: UploadedFile | null;
  uploading: boolean;
  isDragging: boolean;
  primaryButtonLabel: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  formatFileSize: (bytes: number) => string;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrimaryAction: () => void;
  onCancel: () => void;
  cardCount: number | string;
  onCardCountChange: (count: number | string) => void;
  deckTitle: string;
  onDeckTitleChange: (title: string) => void;
  deckDescription: string;
  onDeckDescriptionChange: (description: string) => void;
}

export function UploadZone({
  file,
  uploadedFile,
  uploading,
  isDragging,
  primaryButtonLabel,
  fileInputRef,
  formatFileSize,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onPrimaryAction,
  onCancel,
  cardCount,
  onCardCountChange,
  deckTitle,
  onDeckTitleChange,
  deckDescription,
  onDeckDescriptionChange,
}: UploadZoneProps) {
  const uploadState = uploading
    ? 'processing'
    : uploadedFile
      ? 'uploaded'
      : file
        ? 'selected'
        : 'idle';

  return (
    <Card
      className={`border border-[#4a4a46] bg-[#30302e] transition-colors ${
        isDragging ? 'border-primary' : ''
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <CardContent className="flex min-h-[280px] flex-col items-center justify-center py-12">
        <h3 className="mb-1 text-lg font-semibold">
          Drag and drop your files here
        </h3>
        <p className="mb-8 text-xs text-muted-foreground">
          or click to browse from your computer
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.png,.jpg,.jpeg"
          onChange={onFileChange}
        />
        <Button
          onClick={onPrimaryAction}
          variant="ghost"
          disabled={uploading}
          className="w-40 items-center rounded-2xl text-[#191919]"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : uploadState === 'uploaded' ? (
            <Icon icon="carbon:ai-generate" className="h-4 w-4" />
          ) : (
            <Upload
              className={`h-4 w-4 ${
                uploadState === 'idle' ? 'text-[#191919]' : ''
              }`}
            />
          )}
          {primaryButtonLabel}
        </Button>

        {(file || uploadedFile) && (
          <div className="relative mt-6 w-full max-w-md space-y-4">
            {!uploading && (
              <Button
                onClick={onCancel}
                variant="ghost"
                size="icon"
                className="absolute -right-3 -top-3 z-10 h-6 w-6 rounded-full bg-muted p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <div className="relative overflow-hidden rounded-lg border bg-card px-7 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-7 w-7 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {uploadedFile?.fileName ?? file?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(
                        uploadedFile?.fileSize ?? file?.size ?? 0
                      )}{' '}
                      • {uploadedFile?.fileType ?? file?.type}
                    </p>
                  </div>
                </div>
                {uploading && !uploadedFile ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
                ) : uploadedFile ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                ) : null}
              </div>
            </div>

            {!uploading && (
              <div className="space-y-4 rounded-lg border bg-[#1f1e1d] p-5 text-left text-sm">
                <div className="space-y-1.5">
                  <Label htmlFor="deckTitle">Deck Title (Optional)</Label>
                  <Input
                    id="deckTitle"
                    placeholder="Leave blank to generate automatically"
                    value={deckTitle}
                    onChange={(e) => onDeckTitleChange(e.target.value)}
                    disabled={uploading}
                    className="border-[#4a4a46] bg-[#30302e]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deckDescription">
                    Description (Optional)
                  </Label>
                  <Input
                    id="deckDescription"
                    placeholder="Leave blank to generate automatically"
                    value={deckDescription}
                    onChange={(e) => onDeckDescriptionChange(e.target.value)}
                    disabled={uploading}
                    className="border-[#4a4a46] bg-[#30302e]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cardCount">Flashcards to Generate</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="cardCount"
                      type="number"
                      min={10}
                      max={30}
                      value={cardCount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          onCardCountChange('');
                          return;
                        }
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed)) onCardCountChange(parsed);
                      }}
                      onBlur={() => {
                        let finalVal =
                          typeof cardCount === 'number'
                            ? cardCount
                            : parseInt(cardCount, 10);
                        if (isNaN(finalVal)) finalVal = 10;
                        onCardCountChange(Math.min(Math.max(finalVal, 10), 30));
                      }}
                      disabled={uploading}
                      className="w-24 border-[#4a4a46] bg-[#30302e]"
                    />
                    <span className="text-xs text-muted-foreground">
                      Min 10, Max 30
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
