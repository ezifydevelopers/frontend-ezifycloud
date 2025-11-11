import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResizableTableHeaderProps {
  children: React.ReactNode;
  columnId: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  onResize: (columnId: string, width: number) => void;
  pinned?: 'left' | 'right' | null;
  onPin?: (columnId: string, side: 'left' | 'right' | null) => void;
  className?: string;
}

export const ResizableTableHeader: React.FC<ResizableTableHeaderProps> = ({
  children,
  columnId,
  width,
  minWidth = 100,
  maxWidth = 500,
  onResize,
  pinned,
  onPin,
  className,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(width);

  useEffect(() => {
    setCurrentWidth(width);
  }, [width]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      onResize(columnId, newWidth);
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
  }, [isResizing, minWidth, maxWidth, onResize, columnId]);

  return (
    <th
      className={cn(
        'relative group',
        pinned === 'left' && 'sticky left-0 z-10 bg-background',
        pinned === 'right' && 'sticky right-0 z-10 bg-background',
        className
      )}
      style={{ width: `${currentWidth}px`, minWidth: `${currentWidth}px` }}
    >
      <div className="flex items-center justify-between pr-2">
        <div className="flex-1">{children}</div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onPin && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                if (pinned === 'left') {
                  onPin(columnId, 'right');
                } else if (pinned === 'right') {
                  onPin(columnId, null);
                } else {
                  onPin(columnId, 'left');
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
              'w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors',
              isResizing && 'bg-primary'
            )}
          />
        </div>
      </div>
    </th>
  );
};

