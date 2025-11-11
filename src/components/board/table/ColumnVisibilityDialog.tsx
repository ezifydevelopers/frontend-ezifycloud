// Column visibility dialog - show/hide columns

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, EyeOff } from 'lucide-react';
import { Column } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface ColumnVisibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string, isHidden: boolean) => void;
  onSave?: () => void;
}

export const ColumnVisibilityDialog: React.FC<ColumnVisibilityDialogProps> = ({
  open,
  onOpenChange,
  columns,
  hiddenColumns,
  onToggleColumn,
  onSave,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredColumns = columns.filter(col =>
    col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleCount = columns.length - hiddenColumns.size;
  const hiddenCount = hiddenColumns.size;

  const handleToggleAll = (show: boolean) => {
    columns.forEach(col => {
      const isHidden = hiddenColumns.has(col.id);
      if (isHidden !== !show) {
        onToggleColumn(col.id, !show);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Column Visibility</DialogTitle>
          <DialogDescription>
            Show or hide columns in the table view. {visibleCount} of {columns.length} columns visible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAll(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Show All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAll(false)}
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Hide All
            </Button>
          </div>

          {/* Column List */}
          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
            <div className="divide-y">
              {filteredColumns.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No columns found matching "{searchTerm}"
                </div>
              ) : (
                filteredColumns.map((column) => {
                  const isHidden = hiddenColumns.has(column.id);
                  return (
                    <div
                      key={column.id}
                      className={cn(
                        'p-3 hover:bg-slate-50 flex items-center justify-between',
                        isHidden && 'opacity-60'
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={!isHidden}
                          onCheckedChange={(checked) => {
                            onToggleColumn(column.id, !checked);
                          }}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`col-${column.id}`}
                            className={cn(
                              'font-medium cursor-pointer',
                              isHidden && 'line-through text-muted-foreground'
                            )}
                          >
                            {column.name}
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {column.type}
                            </Badge>
                            {isHidden && (
                              <Badge variant="secondary" className="text-xs">
                                Hidden
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave?.();
              onOpenChange(false);
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

