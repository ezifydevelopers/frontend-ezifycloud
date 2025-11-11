// Table header component - column headers with sorting, resizing, and reordering

import React, { useState } from 'react';
import { TableHead } from '@/components/ui/table';
import { TableRow as UITableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUp, ArrowDown, ArrowUpDown, GripVertical, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Column } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { SortConfig, getSortIcon } from './utils/sortUtils';

interface TableHeaderProps {
  columns: Column[];
  columnWidths: Record<string, number>;
  pinnedColumns: Record<string, 'left' | 'right' | null>;
  onColumnResize: (columnId: string, width: number) => void;
  onColumnReorder?: (draggedId: string, targetId: string) => void;
  onColumnPin?: (columnId: string, side: 'left' | 'right' | null) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  sortConfigs?: SortConfig[];
  onSortClick?: (columnId: string) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  columns,
  columnWidths,
  pinnedColumns,
  onColumnResize,
  onColumnReorder,
  onColumnPin,
  selectedCount,
  totalCount,
  onSelectAll,
  sortConfigs = [],
  onSortClick,
}) => {
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnId);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedColumnId(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedColumnId && draggedColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (draggedColumnId && draggedColumnId !== targetColumnId && onColumnReorder) {
      onColumnReorder(draggedColumnId, targetColumnId);
    }
    setDraggedColumnId(null);
    setDragOverColumnId(null);
  };
      return (
        <UITableRow className="bg-gray-50 border-b-2 border-gray-300 hover:bg-gray-100 transition-colors duration-150 sticky top-0 z-20">
      <TableHead className="w-10 sm:w-12 bg-gray-50 px-2 sm:px-4">
        <Checkbox
          checked={selectedCount > 0 && selectedCount === totalCount}
          onCheckedChange={onSelectAll}
          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
      </TableHead>
      <TableHead 
                className={cn(
                  'min-w-[150px] sm:min-w-[200px] bg-gray-50 font-semibold text-gray-900 px-2 sm:px-4 py-3 sm:py-3.5',
                  onSortClick && 'cursor-pointer hover:bg-gray-100 transition-colors duration-150'
                )}
        onClick={() => onSortClick?.('name')}
      >
        <div className="flex items-center gap-1 sm:gap-2 relative group">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-800">Name</span>
          {onSortClick && (
            <div className="ml-auto">
              {getSortIcon('name', sortConfigs) === 'asc' ? (
                <ArrowUp className="h-3 w-3 text-blue-600" />
              ) : getSortIcon('name', sortConfigs) === 'desc' ? (
                <ArrowDown className="h-3 w-3 text-blue-600" />
              ) : (
                <ArrowUpDown className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          )}
        </div>
      </TableHead>
      {columns.map((column) => {
        const colWidth = columnWidths[column.id] || column.width || 150;
        const pinned = pinnedColumns[column.id];
        const sortState = getSortIcon(column.id, sortConfigs);
        const isSortable = !['FORMULA', 'FILE', 'LONG_TEXT'].includes(column.type);
        const isDragging = draggedColumnId === column.id;
        const isDragOver = dragOverColumnId === column.id;
        
            return (
              <TableHead
                key={column.id}
                className={cn(
                  'relative group bg-gray-50 font-semibold text-gray-900 px-2 sm:px-4 py-3 sm:py-3.5',
                  pinned === 'left' && 'sticky left-0 z-10 bg-gray-50',
                  pinned === 'right' && 'sticky right-0 z-10 bg-gray-50',
                  isSortable && onSortClick && 'cursor-pointer hover:bg-gray-100 transition-colors duration-150',
                  isDragging && 'opacity-50',
                  isDragOver && 'bg-blue-50 border-l-2 border-blue-500'
                )}
                style={{
                  minWidth: `${Math.max(100, colWidth)}px`,
                  width: `${Math.max(100, colWidth)}px`,
                }}
            draggable={!!onColumnReorder}
            onDragStart={(e) => onColumnReorder && handleDragStart(e, column.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => onColumnReorder && handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => onColumnReorder && handleDrop(e, column.id)}
            onClick={() => isSortable && onSortClick?.(column.id)}
          >
            <div className="flex items-center gap-1 sm:gap-2">
              {onColumnReorder && (
                <GripVertical 
                  className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
                  onMouseDown={(e) => e.stopPropagation()}
                />
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800 truncate">{column.name}</span>
              <Badge variant="outline" className="text-xs font-medium px-1.5 sm:px-2 py-0.5 border-gray-300 text-gray-600 bg-white hidden sm:inline-flex">
                {column.type}
              </Badge>
              <div className="ml-auto flex items-center gap-1">
                {onColumnPin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {pinned === 'left' || pinned === 'right' ? (
                          <Pin className="h-3 w-3 text-primary" />
                        ) : (
                          <PinOff className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      onClick={(e) => e.stopPropagation()}
                      className="z-50"
                      sideOffset={5}
                    >
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onColumnPin(column.id, 'left');
                        }}
                        className={pinned === 'left' ? 'bg-accent' : ''}
                      >
                        <Pin className="h-4 w-4 mr-2" />
                        Pin to Left
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onColumnPin(column.id, 'right');
                        }}
                        className={pinned === 'right' ? 'bg-accent' : ''}
                      >
                        <Pin className="h-4 w-4 mr-2" />
                        Pin to Right
                      </DropdownMenuItem>
                      {pinned && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onColumnPin(column.id, null);
                            }}
                          >
                            <PinOff className="h-4 w-4 mr-2" />
                            Unpin
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {isSortable && (
                  <div>
                    {sortState === 'asc' ? (
                      <ArrowUp className="h-3 w-3 text-primary" />
                    ) : sortState === 'desc' ? (
                      <ArrowDown className="h-3 w-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                )}
              </div>
            </div>
            <div 
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const startWidth = colWidth;
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const diff = moveEvent.clientX - startX;
                  const newWidth = Math.max(100, Math.min(500, startWidth + diff));
                  onColumnResize(column.id, newWidth);
                };
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
          </TableHead>
        );
      })}
      <TableHead>Status</TableHead>
      <TableHead className="w-20">Actions</TableHead>
    </UITableRow>
  );
};

