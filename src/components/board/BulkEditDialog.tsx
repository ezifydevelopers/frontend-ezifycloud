// Bulk Edit Dialog - Edit multiple items at once

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { itemAPI } from '@/lib/api';
import { Column, Item } from '@/types/workspace';
import { ItemFieldRenderer } from './item-form/ItemFieldRenderer';
import { useItemForm } from './item-form/useItemForm';
import { Edit2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  columns: Column[];
  selectedItems: Item[];
  onSuccess?: () => void;
}

export const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  open,
  onOpenChange,
  boardId,
  columns,
  selectedItems,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingColumns, setEditingColumns] = useState<Set<string>>(new Set());

  const {
    form,
    visibleColumns,
    workspaceMembers,
    convertFormDataToCells,
  } = useItemForm({
    boardId,
    columns,
    item: null, // No initial item for bulk edit
    open,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = form;

  // Reset form when dialog opens/closes or selection changes
  useEffect(() => {
    if (!open) {
      reset();
      setEditingColumns(new Set());
    }
  }, [open, reset, selectedItems.length]);

  // Determine which columns can be bulk edited
  const editableColumns = visibleColumns.filter(
    col =>
      !col.isHidden &&
      col.type !== 'AUTO_NUMBER' &&
      col.type !== 'FORMULA' &&
      col.type !== 'MIRROR'
  );

  const toggleColumnEdit = (columnId: string) => {
    setEditingColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
        // Clear the field value
        setValue(`cell_${columnId}` as any, undefined);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const onSubmit = async (data: any) => {
    if (editingColumns.size === 0) {
      toast({
        title: 'No Changes',
        description: 'Please select at least one field to update',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Only include columns that are being edited
      const cellsToUpdate: Record<string, unknown> = {};
      editingColumns.forEach(columnId => {
        const fieldKey = `cell_${columnId}` as any;
        const value = data[fieldKey];
        if (value !== undefined && value !== null && value !== '') {
          cellsToUpdate[columnId] = value;
        }
      });

      if (Object.keys(cellsToUpdate).length === 0) {
        toast({
          title: 'No Changes',
          description: 'Please provide values for at least one field',
          variant: 'destructive',
        });
        return;
      }

      const itemIds = selectedItems.map(item => item.id);
      
      const response = await itemAPI.bulkUpdateItems(itemIds, {
        cells: cellsToUpdate,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: `Updated ${selectedItems.length} item(s) successfully`,
        });
        onSuccess?.();
        onOpenChange(false);
        reset();
        setEditingColumns(new Set());
      } else {
        throw new Error(response.message || 'Failed to update items');
      }
    } catch (error) {
      console.error('Error bulk updating items:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Bulk Edit Items
          </DialogTitle>
          <DialogDescription>
            Update common fields for {selectedItems.length} selected item(s)
          </DialogDescription>
        </DialogHeader>

        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Changes will be applied to all {selectedItems.length} selected item(s). 
            Only fields with values will be updated.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-4">
              {/* Selected Items Preview */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <Label className="text-sm font-medium mb-2 block">Selected Items:</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedItems.slice(0, 5).map(item => (
                    <Badge key={item.id} variant="secondary" className="text-xs">
                      {item.name}
                    </Badge>
                  ))}
                  {selectedItems.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{selectedItems.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Editable Columns */}
              {editableColumns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No editable columns available for bulk edit</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {editableColumns.map(column => {
                    const columnId = column.id;
                    const isEditing = editingColumns.has(columnId);
                    const hasValue = watch(`cell_${columnId}` as any);

                    return (
                      <div key={column.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`edit_${columnId}`} className="font-medium">
                              {column.name}
                              {column.required && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {column.type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant={isEditing ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleColumnEdit(columnId)}
                          >
                            {isEditing ? 'Editing' : 'Edit'}
                          </Button>
                        </div>

                        {isEditing && (
                          <div className="mt-2">
                            <ItemFieldRenderer
                              column={column}
                              control={control}
                              register={register}
                              errors={errors}
                              workspaceMembers={workspaceMembers}
                            />
                            {hasValue && (
                              <p className="text-xs text-muted-foreground mt-1">
                                This value will be applied to all {selectedItems.length} item(s)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || editingColumns.size === 0}>
              {loading ? 'Updating...' : `Update ${selectedItems.length} Item(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

