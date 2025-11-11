// Quick create row - inline item creation in table

import React, { useState, useCallback } from 'react';
import { TableRow as UITableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Check } from 'lucide-react';
import { Column } from '@/types/workspace';
import { boardAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CellEditor } from './CellEditor';
import { cn } from '@/lib/utils';

interface QuickCreateRowProps {
  columns: Column[];
  workspaceMembers?: Array<{ id: string; name: string; email: string; profilePicture?: string }>;
  onSuccess?: () => void;
  onCancel?: () => void;
  boardId: string;
}

export const QuickCreateRow: React.FC<QuickCreateRowProps> = ({
  columns,
  workspaceMembers = [],
  onSuccess,
  onCancel,
  boardId,
}) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [itemName, setItemName] = useState('');
  const [cells, setCells] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  const visibleColumns = columns.filter(col => !col.isHidden);

  const handleStartCreate = useCallback(() => {
    setIsCreating(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsCreating(false);
    setItemName('');
    setCells({});
    setEditingColumnId(null);
    onCancel?.();
  }, [onCancel]);

  const handleCellChange = useCallback((columnId: string, value: unknown) => {
    setCells(prev => ({ ...prev, [columnId]: value }));
    // Don't close editor on change - keep it open for continuous typing
  }, []);

  const handleSave = useCallback(async () => {
    if (!itemName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Item name is required',
        variant: 'destructive',
      });
      return;
    }

    // Validate required fields
    const missingFields: string[] = [];
    visibleColumns.forEach((column) => {
      if (column.required && !cells[column.id] && cells[column.id] !== 0 && cells[column.id] !== false) {
        missingFields.push(column.name);
      }
    });

    if (missingFields.length > 0) {
      toast({
        title: 'Validation Error',
        description: `Please fill in required fields: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Apply default values for empty cells
      const finalCells: Record<string, unknown> = { ...cells };
      visibleColumns.forEach((column) => {
        if (!finalCells[column.id] && column.defaultValue !== undefined && column.defaultValue !== null) {
          finalCells[column.id] = column.defaultValue;
        }
      });

      const response = await boardAPI.createItem(boardId, {
        name: itemName.trim(),
        cells: Object.keys(finalCells).length > 0 ? finalCells : undefined,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Item created successfully',
        });
        handleCancel();
        onSuccess?.();
      } else {
        throw new Error(response.message || 'Failed to create item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create item',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [itemName, cells, visibleColumns, boardId, toast, onSuccess, handleCancel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, columnId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Close editor on Enter, but keep the value
      setEditingColumnId(null);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Close editor on Escape, optionally revert value
      setEditingColumnId(null);
    }
  }, []);

  if (!isCreating) {
    return (
      <UITableRow className="hover:bg-slate-50/50 border-dashed border-2 border-slate-300">
        <TableCell colSpan={visibleColumns.length + 3}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartCreate}
            className="w-full justify-center text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add new item
          </Button>
        </TableCell>
      </UITableRow>
    );
  }

  return (
    <UITableRow className="bg-blue-50/50 border-2 border-blue-300">
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={saving}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </TableCell>
      <TableCell>
        <Input
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Item name..."
          className="h-8"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              handleCancel();
            }
          }}
        />
      </TableCell>
      {visibleColumns.map((column) => {
        const value = cells[column.id];
        const isEditing = editingColumnId === column.id;
        const isRequired = column.required;

        // Skip AUTO_NUMBER and FORMULA columns
        if (column.type === 'AUTO_NUMBER' || column.type === 'FORMULA') {
          return (
            <TableCell key={column.id}>
              <span className="text-xs text-muted-foreground">Auto</span>
            </TableCell>
          );
        }

        return (
          <TableCell key={column.id}>
            {isEditing ? (
              <CellEditor
                column={column}
                value={value}
                onChange={(newValue) => {
                  handleCellChange(column.id, newValue);
                  // Don't auto-close on change - keep editor open
                }}
                onSave={() => {
                  // Only close when explicitly saved (Enter key or checkmark button)
                  setEditingColumnId(null);
                }}
                onCancel={() => {
                  // Revert to previous value or empty on cancel
                  setEditingColumnId(null);
                }}
                onKeyDown={(e) => handleKeyDown(e, column.id)}
                disabled={saving}
                workspaceMembers={workspaceMembers}
                itemId="" // Not needed for creation
                disableBlurSave={true} // Disable auto-close on blur for quick create
              />
            ) : (
              <div
                className={cn(
                  "min-h-[32px] px-2 py-1 rounded border border-dashed border-slate-300 cursor-pointer hover:border-blue-400 hover:bg-white",
                  isRequired && !value && "border-red-300 bg-red-50"
                )}
                onClick={() => setEditingColumnId(column.id)}
                title={isRequired && !value ? `${column.name} is required` : 'Click to edit'}
              >
                {value !== null && value !== undefined && value !== '' ? (
                  <span className="text-sm">{String(value)}</span>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    {isRequired ? `${column.name}*` : column.name}
                  </span>
                )}
              </div>
            )}
          </TableCell>
        );
      })}
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={saving || !itemName.trim()}
          className="h-8"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
      <TableCell></TableCell>
    </UITableRow>
  );
};

