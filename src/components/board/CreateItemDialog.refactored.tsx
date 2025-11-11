// Refactored CreateItemDialog - Orchestrates extracted field components

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { boardAPI } from '@/lib/api';
import { Column, Item } from '@/types/workspace';
import { useItemForm } from './item-form/useItemForm';
import { ItemFieldRenderer } from './item-form/ItemFieldRenderer';

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  columns: Column[];
  item?: Item | null;
  onSuccess?: () => void;
}

export const CreateItemDialog: React.FC<CreateItemDialogProps> = ({
  open,
  onOpenChange,
  boardId,
  columns,
  item,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!item;

  const {
    form,
    visibleColumns,
    workspaceMembers,
    convertFormDataToCells,
  } = useItemForm({
    boardId,
    columns,
    item,
    open,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      const cells = convertFormDataToCells(data);
      const itemData = {
        name: data.name,
        status: data.status || undefined,
        cells,
      };

      let response;
      if (isEditMode && item) {
        response = await boardAPI.updateItem(item.id, itemData);
      } else {
        response = await boardAPI.createItem(boardId, itemData);
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: `Item ${isEditMode ? 'updated' : 'created'} successfully`,
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(response.message || `Failed to ${isEditMode ? 'update' : 'create'} item`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} item:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} item`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get status options from STATUS column
  const statusColumn = columns.find(col => col.type === 'STATUS' && !col.isHidden);
  const statusOptions = statusColumn?.settings && 'options' in statusColumn.settings
    ? (statusColumn.settings.options as string[]) || []
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Item' : 'Create New Item'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the item details below.'
              : 'Fill in the details to create a new item.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {/* Item Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Item Name
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter item name"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message as string}</p>
                )}
              </div>

              {/* Status */}
              {statusOptions.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={watch('status') || ''} onValueChange={(value) => setValue('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Dynamic Fields */}
              {visibleColumns.map((column) => {
                const fieldName = `cell_${column.id}` as const;
                return (
                  <ItemFieldRenderer
                    key={column.id}
                    column={column}
                    fieldName={fieldName}
                    register={register}
                    control={control}
                    setValue={setValue}
                    errors={errors}
                    workspaceMembers={workspaceMembers}
                    item={item}
                  />
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditMode ? 'Update Item' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

