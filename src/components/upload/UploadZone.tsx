'use client';

import type React from 'react';
import { Icon } from '@iconify/react';
import { CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';

import type { UploadedFile } from '@/components/upload/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
          <div className="mt-6 w-full max-w-md">
            <div className="rounded-lg border bg-card px-7 py-4">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
