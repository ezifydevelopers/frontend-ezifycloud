import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (targetId: string) => void;
  onDrop?: (targetId: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  resizable?: boolean;
  onResize?: (id: string, size: { width: number; height: number }) => void;
  initialSize?: { width?: number; height?: number };
  className?: string;
}

export const DraggableWidget: React.FC<DraggableWidgetProps> = ({
  id,
  children,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging = false,
  isDragOver = false,
  resizable = false,
  onResize,
  initialSize,
  className,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: initialSize?.width || 0,
    height: initialSize?.height || 0,
  });
  const widgetRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startSizeRef = useRef<{ width: number; height: number; x: number; y: number } | null>(null);

  // Load saved size from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`widget_size_${id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSize({ width: parsed.width || 0, height: parsed.height || 0 });
      } catch (e) {
        // Ignore parse errors
      }
    } else if (initialSize) {
      setSize({ width: initialSize.width || 0, height: initialSize.height || 0 });
    }
  }, [id, initialSize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!resizable || !widgetRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    const rect = widgetRef.current.getBoundingClientRect();
    startSizeRef.current = {
      width: rect.width,
      height: rect.height,
      x: e.clientX,
      y: e.clientY,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!startSizeRef.current || !widgetRef.current) return;

      const deltaX = e.clientX - startSizeRef.current.x;
      const deltaY = e.clientY - startSizeRef.current.y;

      const newWidth = Math.max(200, startSizeRef.current.width + deltaX);
      const newHeight = Math.max(150, startSizeRef.current.height + deltaY);

      setSize({ width: newWidth, height: newHeight });
      
      if (onResize) {
        onResize(id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (widgetRef.current && size.width > 0 && size.height > 0) {
        localStorage.setItem(`widget_size_${id}`, JSON.stringify(size));
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, id, size, onResize]);

  const handleDragStart = (e: React.DragEvent) => {
    if (isResizing) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('widget-id', id);
    onDragStart?.(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('widget-id');
    if (draggedId && draggedId !== id) {
      onDrop?.(id);
    }
  };

  const isDraggable = onDragStart || onDrop;

  return (
    <div
      ref={widgetRef}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'relative group',
        isDragging && 'opacity-50 cursor-grabbing',
        isDragOver && 'ring-2 ring-blue-500 ring-offset-2',
        isDraggable && 'cursor-grab',
        className
      )}
      style={
        size.width > 0 && size.height > 0
          ? { 
              width: `${size.width}px`, 
              height: `${size.height}px`, 
              minWidth: '200px', 
              minHeight: '150px',
              resize: resizable ? 'both' : 'none',
              overflow: 'auto',
            }
          : undefined
      }
    >
      {/* Drag Handle - Only show when draggable */}
      {(onDragStart || onDrop) && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 cursor-move"
            onMouseDown={(e) => e.stopPropagation()}
            draggable={false}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      )}

      {/* Resize Handle */}
      {resizable && (
        <div
          ref={resizeRef}
          onMouseDown={handleMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 rounded-tl"
          style={{
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
          }}
        >
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-white" />
        </div>
      )}

      {children}
    </div>
  );
};

