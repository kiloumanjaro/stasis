'use client';

import { ReactNode } from 'react';
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
  /** Width of the widget in pixels */
  width?: number;
  /** Minimum height of the widget in pixels */
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
  const { position, isDragging, handleMouseDown } = useDrag({
    initialPosition,
    elementWidth: width,
    elementHeight: minHeight,
  });

  if (!isOpen) return null;

  return (
    <Card
      className={cn(
        'fixed border-border/50 bg-card/95 shadow-xl backdrop-blur-sm',
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
          {/* Drag Handle */}
          <div
            className="flex cursor-grab select-none items-center gap-2 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <GripHorizontal className="ml-2.5 mr-1 h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
          </div>

          {/* Minimize Button */}
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
