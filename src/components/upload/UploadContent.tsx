'use client';

import { useState, useRef, useEffect } from 'react';
import { Footer } from '@/components/dashboard/Footer';
import { fsrsClient } from '@/lib/fsrs-client';
import { useDecks } from '@/hooks/useDecks';
import { toast } from 'sonner';
import { SupportedFileTypes } from '@/components/upload/SupportedFileTypes';
import { UploadHistorySection } from '@/components/upload/UploadHistorySection';
import { UploadZone } from '@/components/upload/UploadZone';
import type { UploadedFile } from '@/components/upload/types';

export function UploadContent() {
  const [file, setFile] = useState<File | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sortBy, setSortBy] = useState('Date Uploaded');
  const [cardCount, setCardCount] = useState<number | string>(10);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { decks, fetchDecks } = useDecks();

  useEffect(() => {
    void fetchDecks();
  }, [fetchDecks]);

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

    const parsedCount =
      typeof cardCount === 'number' ? cardCount : parseInt(cardCount, 10);
    const finalCount = isNaN(parsedCount) ? 10 : parsedCount;

    try {
      const formData = new FormData();
      formData.append('file', rawFile);
      formData.append('cardCount', finalCount.toString());
      if (deckTitle.trim()) formData.append('name', deckTitle.trim());
      if (deckDescription.trim())
        formData.append('description', deckDescription.trim());

      const result = await fsrsClient.decks.create(formData);

      toast.success(
        `Created deck "${result.deck.name}" with ${result.cards.length} AI-generated cards.`
      );
      // Reset upload state after successful generation
      setFile(null);
      setRawFile(null);
      setUploadedFile(null);
      setDeckTitle('');
      setDeckDescription('');
      setCardCount(10);
      if (fileInputRef.current) fileInputRef.current.value = '';
      void fetchDecks();
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
        onCancel={() => {
          setFile(null);
          setRawFile(null);
          setUploadedFile(null);
          setDeckTitle('');
          setDeckDescription('');
          setCardCount(10);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        cardCount={cardCount}
        onCardCountChange={setCardCount}
        deckTitle={deckTitle}
        onDeckTitleChange={setDeckTitle}
        deckDescription={deckDescription}
        onDeckDescriptionChange={setDeckDescription}
      />

      <p className="text-sm text-muted-foreground">
        AI-generated content may contain errors. Review before use. Only upload
        content you own and generated content must be for personal use only.
      </p>

      <SupportedFileTypes />
      <UploadHistorySection
        decks={decks}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* TODO: integrate title/description into page content above */}
      {/*
      title="Preview"
      description="Your uploaded content will appear here"
      */}
      <Footer />
    </div>
  );
}
