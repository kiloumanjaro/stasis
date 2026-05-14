export interface UploadedFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  path: string;
  publicUrl: string;
  extractedText?: string;
}
