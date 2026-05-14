'use client';

import { useState, useRef } from 'react';
import { Footer } from '@/components/dashboard/Footer';
import { createFlashcardDeck } from '@/lib/frontend-store';
import { fsrsClient } from '@/lib/fsrs-client';
import { toast } from 'sonner';
import { SupportedFileTypes } from '@/components/upload/SupportedFileTypes';
import { UploadHistorySection } from '@/components/upload/UploadHistorySection';
import { UploadZone } from '@/components/upload/UploadZone';
import type { UploadedFile } from '@/components/upload/types';

function buildFlashcardsFromText(text: string, count = 10) {
  const normalized = text.replace(/\r/g, '').trim();
  const blocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const units =
    blocks.length > 0
      ? blocks
      : normalized
          .split('\n')
          .map((line) => line.replace(/\s+/g, ' ').trim())
          .filter(Boolean);

  return units.slice(0, count).map((unit, index) => {
    const sentences = unit.split(/(?<=[.!?])\s+/).filter(Boolean);
    const answer = unit;
    const question =
      sentences.length > 1
        ? `What is the key idea in note ${index + 1}?`
        : `Review note ${index + 1}: ${unit.slice(0, 48)}${unit.length > 48 ? '...' : ''}`;

    return {
      question,
      answer,
    };
  });
}

export function UploadContent() {
  const [file, setFile] = useState<File | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sortBy, setSortBy] = useState('Date Uploaded');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setFile(null);
      setRawFile(null);
      setUploadedFile(null);
      toast.error(
        'File type not supported. Please upload a PDF, TXT, PNG, or JPG file.'
      );
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setFile(null);
      setRawFile(null);
      setUploadedFile(null);
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setFile(selectedFile);
    setRawFile(null);
    setUploadedFile(null);
    void handleUpload(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async (targetFile?: File) => {
    const fileToUpload = targetFile ?? file;
    if (!fileToUpload) return;

    setUploading(true);

    try {
      const publicUrl = URL.createObjectURL(fileToUpload);
      const extractedText =
        fileToUpload.type === 'text/plain' ? await fileToUpload.text() : '';

      setRawFile(fileToUpload);
      setUploadedFile({
        fileName: fileToUpload.name,
        fileSize: fileToUpload.size,
        fileType: fileToUpload.type,
        path: fileToUpload.name,
        publicUrl,
        extractedText,
      });
      setFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateCards = async () => {
    if (!uploadedFile || !rawFile) return;

    setUploading(true);

    try {
      if (rawFile.type === 'application/pdf') {
        const formData = new FormData();
        formData.append('pdf', rawFile);
        formData.append('cardCount', '10');
        const result = await fsrsClient.decks.create(formData);
        toast.success(
          `Created deck "${result.deck.name}" with ${result.cards.length} AI-generated cards.`
        );
      } else {
        if (!uploadedFile.extractedText) {
          toast.error(
            'This file does not contain readable text to turn into flashcards.'
          );
          return;
        }
        const flashcards = buildFlashcardsFromText(
          uploadedFile.extractedText,
          10
        );
        if (flashcards.length === 0) {
          throw new Error('Could not derive any flashcards from this file');
        }
        const deck = createFlashcardDeck({
          deckTitle: uploadedFile.fileName.replace(/\.[^/.]+$/, ''),
          description: `Generated from ${uploadedFile.fileName}`,
          flashcards,
        });
        toast.success(
          `Saved ${flashcards.length} flashcards in deck "${deck.fc_name}".`
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to generate flashcards'
      );
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const uploadState = uploading
    ? 'processing'
    : uploadedFile
      ? 'uploaded'
      : file
        ? 'selected'
        : 'idle';

  const handlePrimaryAction = () => {
    if (uploadState === 'idle') {
      fileInputRef.current?.click();
      return;
    }

    if (uploadState === 'processing') {
      return;
    }

    void handleGenerateCards();
  };

  const primaryButtonLabel = uploading
    ? uploadedFile
      ? 'Generating...'
      : 'Uploading...'
    : uploadState === 'idle'
      ? 'Browse Files'
      : uploadState === 'selected'
        ? 'Processing...'
        : 'Generate Cards';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl">Upload & Generate</h1>
      </div>

      {/* Upload Zone */}
      <UploadZone
        file={file}
        uploadedFile={uploadedFile}
        uploading={uploading}
        isDragging={isDragging}
        primaryButtonLabel={primaryButtonLabel}
        fileInputRef={fileInputRef}
        formatFileSize={formatFileSize}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFileChange={handleFileChange}
        onPrimaryAction={handlePrimaryAction}
      />

      <p className="text-sm text-muted-foreground">
        AI-generated content may contain errors. Review before use. Only upload
        content you own and generated content must be for personal use only.
      </p>

      <SupportedFileTypes />
      <UploadHistorySection sortBy={sortBy} onSortChange={setSortBy} />

      {/* TODO: integrate title/description into page content above */}
      {/*
      title="Preview"
      description="Your uploaded content will appear here"
      */}
      <Footer />
    </div>
  );
}
