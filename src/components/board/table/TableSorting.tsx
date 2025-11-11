// Table sorting component - Manage multi-column sorting with priority

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown, X, GripVertical } from 'lucide-react';
import { Column } from '@/types/workspace';
import { SortConfig } from './utils/sortUtils';
import { cn } from '@/lib/utils';

interface TableSortingProps {
  columns: Column[];
  sortConfigs: SortConfig[];
  onSortChange: (sorts: SortConfig[]) => void;
  className?: string;
}

export const TableSorting: React.FC<TableSortingProps> = ({
  columns,
  sortConfigs,
  onSortChange,
  className,
}) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const getColumnName = (columnId: string) => {
    return columns.find(c => c.id === columnId)?.name || columnId;
  };

  const removeSort = (columnId: string) => {
    onSortChange(sortConfigs.filter(s => s.columnId !== columnId));
  };

  const clearAllSorts = () => {
    onSortChange([]);
    setDialogOpen(false);
  };

  const toggleDirection = (columnId: string) => {
    const newSorts = sortConfigs.map(sort =>
      sort.columnId === columnId
        ? { ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' }
        : sort
    );
    onSortChange(newSorts);
  };

  if (sortConfigs.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className={className}
      >
        <ArrowUpDown className="h-4 w-4 mr-2" />
        Sort
      </Button>
    );
  }

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        {sortConfigs.slice(0, 2).map((sort, index) => {
          const column = columns.find(c => c.id === sort.columnId);
          if (!column) return null;

          return (
            <Badge
              key={sort.columnId}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="text-xs font-medium mr-1">{index + 1}</span>
              {sort.direction === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              <span>{column.name}</span>
              <button
                onClick={() => removeSort(sort.columnId)}
                className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
        {sortConfigs.length > 2 && (
          <Badge variant="secondary" className="text-xs">
            +{sortConfigs.length - 2} more
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Manage
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sort Columns</DialogTitle>
            <DialogDescription>
              Configure how items are sorted. Drag to reorder priority.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {sortConfigs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No sort columns selected. Click column headers to sort.
              </p>
            ) : (
              sortConfigs
                .sort((a, b) => a.priority - b.priority)
                .map((sort, index) => {
                  const column = columns.find(c => c.id === sort.columnId);
                  if (!column) return null;

                  return (
                    <div
                      key={sort.columnId}
                      className="flex items-center gap-2 p-2 border rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="w-8 text-center">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{column.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {column.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant={sort.direction === 'asc' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleDirection(sort.columnId)}
                          className="h-7"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant={sort.direction === 'desc' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleDirection(sort.columnId)}
                          className="h-7"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSort(sort.columnId)}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={clearAllSorts}>
              Clear All
            </Button>
            <Button onClick={() => setDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

