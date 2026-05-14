import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';

// DEV: startup env-var validation — warns loudly if required keys are missing or still placeholders
const REQUIRED_ENV_VARS: Record<string, string> = {
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ?? '',
};

if (process.env.NODE_ENV === 'development') {
  const PLACEHOLDER_PATTERN = /^(YOUR_|your-|your_)/i;
  const missing = Object.entries(REQUIRED_ENV_VARS)
    .filter(([, v]) => !v || PLACEHOLDER_PATTERN.test(v))
    .map(([k]) => k);

  if (missing.length > 0) {
    console.warn(
      '\n⚠️  [STASIS DEV] Missing or placeholder environment variables:\n' +
        missing.map((k) => `   • ${k}`).join('\n') +
        '\n   Add them to .env.local before starting the frontend.\n' +
        '   For local backend auth, set NEXT_PUBLIC_BACKEND_URL=http://localhost:8000.\n'
    );
  }
}

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Stasis',
  description: 'AI-powered study companion',
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.className} bg-[#1f1e1d] antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
