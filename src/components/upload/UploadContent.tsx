'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const supportedTypes = [
  {
    icon: 'bi:filetype-pdf',
    label: 'PDF',
    description:
      'A file format that preserves document layout and formatting across all devices.',
  },
  {
    icon: 'bi:filetype-txt',
    label: 'TXT',
    description:
      'A plain text file format that stores unformatted text and is widely supported across all devices.',
  },
  {
    icon: 'bi:image',
    label: 'Images',
    description:
      'An image capture of your screen used to quickly share visual information or issues',
  },
];

interface UploadedFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  path: string;
  publicUrl: string;
  extractedText?: string;
}

export function UploadContent() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(
        'File type not supported. Please upload a PDF, TXT, PNG, or JPG file.'
      );
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setFile(selectedFile);
    setUploadedFile(null);
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

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadedFile(data);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateCards = async () => {
    if (!uploadedFile) return;

    // Check if we have extracted text
    if (!uploadedFile.extractedText) {
      setError('No text content available to generate flashcards');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: uploadedFile.extractedText,
          deckName: uploadedFile.fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
          description: `Generated from ${uploadedFile.fileName}`,
          count: 10,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate flashcards');
      }

      setSuccess(
        `Successfully generated ${data.cardsGenerated} flashcards in deck "${data.deckName}"!`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate flashcards'
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl">Upload & Generate</h1>
      </div>

      {/* Upload Zone */}
      <Card
        className={`border border-[#4a4a46] bg-[#30302e] transition-colors ${
          isDragging ? 'border-primary' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
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
            onChange={handleFileChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="ghost"
            className="w-40 items-center rounded-2xl text-[#191919]"
          >
            <Icon icon="bi:upload" className="h-4 w-4 text-[#191919]" />
            Browse Files
          </Button>

          {/* Selected File Display */}
          {file && (
            <div className="mt-6 w-full max-w-md">
              <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  className="items-center"
                  onClick={handleUpload}
                  disabled={uploading}
                  size="sm"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Success Message */}
          {uploadedFile && !error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              File uploaded successfully!
            </div>
          )}

          {/* Generation Success Message */}
          {success && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported File Types */}
      <div>
        <h2 className="mb-4 text-lg">Supported File Types</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {supportedTypes.map((type) => (
            <Card
              key={type.label}
              className="max-w-74 border border-[#4a4a46]/90 bg-[#1f1e1d]"
            >
              <CardHeader className="flex flex-col gap-1">
                <Icon icon={type.icon} className="h-6 w-6 text-[#e5e5df]" />
                <div>
                  <CardTitle className="mb-1 text-base text-[#a2a19f]">
                    {type.label}
                  </CardTitle>
                  <CardDescription className="font-light text-[#91918d]">
                    {type.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-none bg-[#0f0f0f] px-4 py-2">
        <CardHeader>
          <div className="flex flex-row justify-between">
            <div className="flex w-1/2 items-center">
              <Image
                src="/images/green.png"
                alt="Stasis"
                className="h-12 w-12"
                width={48}
                height={48}
              />
              <CardTitle className="text-3xl font-normal">statis</CardTitle>
            </div>
            <div className="flex w-1/2 flex-col gap-2">
              <CardTitle className="font-normal">Preview</CardTitle>
              <CardDescription>
                Your uploaded content will appear here
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row justify-between">
            {/* Left Column: Info & Action */}
            <div className="flex w-1/2 flex-col justify-between space-y-2 pb-3 text-sm text-muted-foreground">
              <p className="ml-3 max-w-md">
                AI-generated content may contain errors. Review before use. Only
                upload content you own and generated content must be for
                personal use only.
              </p>
              <Button
                onClick={handleGenerateCards}
                disabled={!uploadedFile}
                variant="ghost"
                className={`w-40 items-center rounded-xl ${!uploadedFile ? 'text-[#191919]' : 'bg-[#191919] text-white hover:bg-[#252525]'}`}
              >
                <Icon icon="carbon:ai-generate" className="mr-0.5 h-4 w-4" />
                Generate Cards
              </Button>
            </div>

            {/* Right Column: Dynamic Preview Area */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-[#4a4a46]/50 bg-[#0f0f0f] bg-[#191919]">
              {uploadedFile ? (
                <div className="flex h-full flex-col space-y-4 p-4">
                  {/* File Info Header */}
                  <div className="flex items-start gap-4 rounded-lg border border-[#4a4a46]/30 bg-[#161616] p-4">
                    <Icon
                      icon="bi:file-earmark-text"
                      className="h-10 w-10 text-primary"
                    />
                    <div className="flex-1 overflow-hidden">
                      <h4 className="truncate font-semibold text-white">
                        {uploadedFile.fileName}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadedFile.fileSize)} •{' '}
                        {uploadedFile.fileType}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground/50">
                        Path: {uploadedFile.path}
                      </p>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="min-h-[300px] flex-1 overflow-auto">
                    {uploadedFile.fileType === 'application/pdf' && (
                      <iframe
                        src={uploadedFile.publicUrl}
                        className="h-full w-full rounded-lg border border-[#4a4a46]/30"
                        title="PDF Preview"
                      />
                    )}
                    {uploadedFile.fileType.startsWith('image/') && (
                      <div className="flex justify-center rounded-lg border border-[#4a4a46]/30 bg-[#161616] p-2">
                        <Image
                          src={uploadedFile.publicUrl}
                          alt="Uploaded preview"
                          className="max-h-80 w-auto rounded-lg object-contain"
                          width={320}
                          height={320}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Original Empty State */
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <Icon
                    icon="bi:file-earmark"
                    className="mb-4 h-12 w-12 text-muted-foreground/50"
                  />
                  <p className="text-sm text-muted-foreground">
                    No file uploaded yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
