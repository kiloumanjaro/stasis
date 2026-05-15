'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripHorizontal } from 'lucide-react';
import { useDrag } from '@/hooks/useDrag';
import { cn } from '@/lib/utils';

interface Position {
  x: number;
  y: number;
}

interface DraggableWidgetProps {
  isOpen: boolean;
  onMinimize: () => void;
  onFocus: () => void;
  initialPosition: Position;
  title: string;
  zIndex: number;
  children: ReactNode;
  width?: number;
  minHeight?: number;
  className?: string;
}

export function DraggableWidget({
  isOpen,
  onMinimize,
  onFocus,
  initialPosition,
  title,
  zIndex,
  children,
  width = 320,
  minHeight = 400,
  className,
}: DraggableWidgetProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { position, isDragging, handleMouseDown } = useDrag({
    initialPosition,
    elementWidth: width,
    elementHeight: minHeight,
  });

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 rounded-t-xl border-t border-border/50 bg-card/95 shadow-2xl backdrop-blur-sm"
        style={{ zIndex }}
        onMouseDown={onFocus}
      >
        <div className="flex items-center justify-between border-b border-border/50 p-3">
          <div className="flex items-center gap-2">
            <GripHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none bg-none"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
          >
            <Icon icon="bi:x" className="h-10 text-white" />
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-3">{children}</div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'fixed rounded-xl border-border/50 bg-card/95 shadow-lg backdrop-blur-sm',
        isDragging && 'cursor-grabbing',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        width: width,
        minHeight: minHeight,
        zIndex: zIndex,
      }}
      onMouseDown={onFocus}
    >
      <CardHeader className="border-b border-border/50 p-3 pb-2">
        <div className="flex items-center justify-between">
          <div
            className="flex cursor-grab select-none items-center gap-2 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <GripHorizontal className="ml-2.5 mr-1 h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none bg-none"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
          >
            <Icon icon="bi:x" className="h-10 text-white" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">{children}</CardContent>
    </Card>
  );
}
