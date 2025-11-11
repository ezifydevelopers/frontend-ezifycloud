import React, { useState, useCallback } from 'react';
import { DraggableWidget } from './DraggableWidget';
import { cn } from '@/lib/utils';

interface WidgetPosition {
  id: string;
  order: number;
  size?: { width: number; height: number };
}

interface DashboardWidgetContainerProps {
  widgetId: string;
  children: React.ReactNode;
  widgetPositions: WidgetPosition[];
  onWidgetReorder: (draggedId: string, targetId: string) => void;
  resizable?: boolean;
  onWidgetResize?: (widgetId: string, size: { width: number; height: number }) => void;
  className?: string;
}

export const DashboardWidgetContainer: React.FC<DashboardWidgetContainerProps> = ({
  widgetId,
  children,
  widgetPositions,
  onWidgetReorder,
  resizable = false,
  onWidgetResize,
  className,
}) => {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOverWidget, setDragOverWidget] = useState<string | null>(null);

  const handleDragOver = useCallback((targetId: string) => {
    setDragOverWidget(targetId);
  }, []);

  const currentPosition = widgetPositions.find(w => w.id === widgetId);

  const handleDragStart = useCallback((id: string) => {
    setDraggedWidget(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
    setDragOverWidget(null);
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!draggedWidget || draggedWidget === targetId) return;

      onWidgetReorder(draggedWidget, targetId);

      setDraggedWidget(null);
      setDragOverWidget(null);
    },
    [draggedWidget, onWidgetReorder]
  );

  return (
    <DraggableWidget
      id={widgetId}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      isDragging={draggedWidget === widgetId}
      isDragOver={dragOverWidget === widgetId}
      resizable={resizable}
      onResize={onWidgetResize}
      initialSize={currentPosition?.size}
      className={className}
    >
      {children}
    </DraggableWidget>
  );
};

