'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Layers } from 'lucide-react';

interface CardLayoutAreaProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function CardLayoutArea({
  title = 'Focus Cards',
  description = 'Your study cards will appear here. Use the timer widget to track your focus sessions while you work through your material.',
  icon,
}: CardLayoutAreaProps = {}) {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <Card className="w-full max-w-2xl border-2 border-dashed border-muted-foreground/25">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {icon || <Layers className="h-8 w-8 text-muted-foreground" />}
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-medium text-muted-foreground">
              {title}
            </h3>
            <p className="max-w-md text-sm text-muted-foreground/70">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
