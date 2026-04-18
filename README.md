# Stasis

An AI-powered study companion combining Pomodoro focus timers, emotion monitoring, and spaced repetition flashcards.

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Fill in real values in .env.local

# 3. Run database migrations
pnpm dm

# 4. (Optional) Seed sample data
pnpm db:seed

# 5. Start dev server
pnpm dev
```

App runs at http://localhost:3000
