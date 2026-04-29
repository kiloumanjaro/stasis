import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import '@/styles/globals.css';

// DEV: startup env-var validation — warns loudly if required keys are missing or still placeholders
const REQUIRED_ENV_VARS: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
};

if (process.env.NODE_ENV === 'development') {
  console.log(
    '\n🟡 [STASIS DEV MODE] Running in development — auth disabled, CORS open\n' +
      '   Mock user: dev@localhost.dev (id: eb00d0b0-848e-4ffe-97b6-6903c829cf22)\n' +
      '   Seed data:  pnpm db:seed\n' +
      '   Hot reload: enabled via next dev --turbo\n'
  );

  const PLACEHOLDER_PATTERN = /^(YOUR_|your-|your_)/i;
  const missing = Object.entries(REQUIRED_ENV_VARS)
    .filter(([, v]) => !v || PLACEHOLDER_PATTERN.test(v))
    .map(([k]) => k);

  if (missing.length > 0) {
    console.warn(
      '\n⚠️  [STASIS DEV] Missing or placeholder environment variables:\n' +
        missing.map((k) => `   • ${k}`).join('\n') +
        '\n   Copy .env.example → .env.local and fill in real values.\n'
    );
  }
}

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Stasis — v2.0 Dev',
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
      <body className={`${geistSans.className} bg-[#1f1e1d] antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
