import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, X } from 'lucide-react';
import { WidgetConfig } from '@/types/dashboard';
import { KPICard } from './widgets/KPICard';
import { ChartWidget } from './widgets/ChartWidget';
import { GaugeChart } from './widgets/GaugeChart';
import { AreaChart } from './widgets/AreaChart';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  widgets: WidgetConfig[];
  onWidgetMove?: (widgetIndex: number, newPosition: { x: number; y: number }) => void;
  onWidgetResize?: (widgetIndex: number, newSize: { w: number; h: number }) => void;
  onWidgetRemove?: (widgetIndex: number) => void;
  onWidgetEdit?: (widgetIndex: number) => void;
  editable?: boolean;
  widgetData?: Map<number, unknown>;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  widgets,
  onWidgetMove,
  onWidgetResize,
  onWidgetRemove,
  onWidgetEdit,
  editable = false,
  widgetData,
}) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedPosition, setDraggedPosition] = useState<{ x: number; y: number } | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!editable) return;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, [editable]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (!editable || draggingIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, [editable, draggingIndex]);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    if (!editable || draggingIndex === null || draggingIndex === targetIndex) return;
    e.preventDefault();
    
    if (onWidgetMove) {
      const targetWidget = widgets[targetIndex];
      onWidgetMove(draggingIndex, targetWidget.position);
    }
    
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [editable, draggingIndex, widgets, onWidgetMove]);

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    setDragOverIndex(null);
    setDraggedPosition(null);
  }, []);

  const renderWidget = (widget: WidgetConfig, index: number) => {
    const data = widgetData?.get(index);
    const isDragging = draggingIndex === index;
    const isDragOver = dragOverIndex === index;

    const widgetStyle: React.CSSProperties = {
      gridColumn: `span ${widget.position.w}`,
      gridRow: `span ${widget.position.h}`,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        key={index}
        draggable={editable}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        className={cn(
          'relative group',
          isDragOver && 'ring-2 ring-blue-500',
          isDragging && 'opacity-50'
        )}
        style={widgetStyle}
      >
        <Card className="h-full">
          <CardContent className="p-4 h-full flex flex-col">
            {editable && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    handleDragStart(e, index);
                  }}
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onWidgetRemove?.(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {widget.type === 'kpi_card' && data && (
              <KPICard
                title={widget.title}
                value={String((data as { value: number }).value || 0)}
                icon={(() => {
                  // Default icon, can be customized
                  const iconMap: Record<string, React.ComponentType> = {
                    BarChart3: require('lucide-react').BarChart3,
                    DollarSign: require('lucide-react').DollarSign,
                  };
                  return iconMap.BarChart3;
                })()}
              />
            )}

            {['bar_chart', 'line_chart', 'pie_chart'].includes(widget.type) && data && (
              <ChartWidget
                title={widget.title}
                type={widget.type as 'bar' | 'line' | 'pie'}
                data={(data as Array<{ label: string; value: number }>) || []}
              />
            )}

            {widget.type === 'gauge_chart' && data && (
              <GaugeChart
                title={widget.title}
                value={(data as { value: number; max: number }).value || 0}
                max={(data as { value: number; max: number }).max || 100}
              />
            )}

            {widget.type === 'area_chart' && data && (
              <AreaChart
                title={widget.title}
                data={(data as Array<{ label: string; value: number }>) || []}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Create grid layout based on widget positions
  const maxCols = Math.max(...widgets.map(w => w.position.x + w.position.w), 12);
  const maxRows = Math.max(...widgets.map(w => w.position.y + w.position.h), 10);

  return (
    <div
      className="grid gap-4 p-4"
      style={{
        gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${maxRows}, minmax(100px, auto))`,
      }}
    >
      {widgets.map((widget, index) => {
        const widgetStyle: React.CSSProperties = {
          gridColumnStart: widget.position.x + 1,
          gridColumnEnd: widget.position.x + widget.position.w + 1,
          gridRowStart: widget.position.y + 1,
          gridRowEnd: widget.position.y + widget.position.h + 1,
        };

        return (
          <div key={index} style={widgetStyle}>
            {renderWidget(widget, index)}
          </div>
        );
      })}
    </div>
  );
};

