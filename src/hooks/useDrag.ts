'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDragOptions {
  initialPosition: Position;
  /** Padding from viewport edges */
  boundaryPadding?: number;
  /** Element width for right boundary calculation */
  elementWidth?: number;
  /** Element height for bottom boundary calculation */
  elementHeight?: number;
}

interface UseDragReturn {
  position: Position;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  setPosition: (pos: Position) => void;
}

export function useDrag({
  initialPosition,
  boundaryPadding = 10,
  elementWidth = 320,
  elementHeight = 400,
}: UseDragOptions): UseDragReturn {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });

  const constrainToViewport = useCallback(
    (pos: Position): Position => {
      if (typeof window === 'undefined') return pos;

      const maxX = window.innerWidth - elementWidth - boundaryPadding;
      const maxY = window.innerHeight - elementHeight - boundaryPadding;

      return {
        x: Math.max(boundaryPadding, Math.min(pos.x, maxX)),
        y: Math.max(boundaryPadding, Math.min(pos.y, maxY)),
      };
    },
    [boundaryPadding, elementWidth, elementHeight]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };

      setIsDragging(true);
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newPosition = constrainToViewport({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });

      setPosition(newPosition);
    },
    [isDragging, constrainToViewport]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle window resize to keep widget in bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => constrainToViewport(prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [constrainToViewport]);

  return {
    position,
    isDragging,
    handleMouseDown,
    setPosition,
  };
}
