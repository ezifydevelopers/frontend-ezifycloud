import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResizableColumnProps {
  children: React.ReactNode;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  onResize: (width: number) => void;
  className?: string;
  pinned?: 'left' | 'right' | null;
  onPin?: (side: 'left' | 'right' | null) => void;
}

export const ResizableColumn: React.FC<ResizableColumnProps> = ({
  children,
  width,
  minWidth = 100,
  maxWidth = 500,
  onResize,
  className,
  pinned,
  onPin,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(width);

  useEffect(() => {
    setCurrentWidth(width);
  }, [width]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
  }, [currentWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + diff));
      setCurrentWidth(newWidth);
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, onResize]);

  return (
    <div
      ref={resizeRef}
      className={cn(
        'relative flex items-center',
        pinned === 'left' && 'sticky left-0 z-10',
        pinned === 'right' && 'sticky right-0 z-10',
        className
      )}
      style={{ width: `${currentWidth}px` }}
    >
      <div className="flex-1">{children}</div>
      {onPin && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 mr-1"
          onClick={(e) => {
            e.stopPropagation();
            if (pinned === 'left') {
              onPin('right');
            } else if (pinned === 'right') {
              onPin(null);
            } else {
              onPin('left');
            }
          }}
          title={pinned ? `Unpin from ${pinned}` : 'Pin column'}
        >
          {pinned ? (
            <PinOff className="h-3 w-3" />
          ) : (
            <Pin className="h-3 w-3" />
          )}
        </Button>
      )}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors',
          isResizing && 'bg-primary'
        )}
      >
        <div className="absolute right-1/2 top-1/2 -translate-y-1/2 translate-x-1/2">
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
        </div>
      </div>
    </div>
  );
};

