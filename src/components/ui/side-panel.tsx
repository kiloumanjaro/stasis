'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Which side the panel slides in from */
  side?: 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}

/**
 * A lightweight fixed side panel that does NOT use Radix Dialog / Vaul.
 * Multiple SidePanels can coexist without conflicting overlays.
 */
export function SidePanel({
  open,
  onClose,
  title,
  side = 'right',
  className,
  children,
}: SidePanelProps) {
  return (
    <div
      className={cn(
        'fixed inset-y-0 z-50 flex w-[320px] flex-col border bg-background shadow-xl transition-transform duration-300 ease-in-out sm:w-[360px]',
        side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
        open
          ? 'translate-x-0'
          : side === 'right'
            ? 'translate-x-full'
            : '-translate-x-full',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}
