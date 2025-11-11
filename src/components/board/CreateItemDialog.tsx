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
import { ItemTemplateSelector } from './item-form/ItemTemplateSelector';

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
  const [createMode, setCreateMode] = useState<'blank' | 'template'>('blank');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
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

  // Load template data when template is selected
  React.useEffect(() => {
    if (createMode === 'template' && selectedTemplate && selectedTemplate.cells && !isEditMode) {
      Object.entries(selectedTemplate.cells).forEach(([columnId, value]) => {
        setValue(`cell_${columnId}` as any, value);
      });
      if (selectedTemplate.name) {
        setValue('name', selectedTemplate.name);
      }
      setCreateMode('blank'); // Switch to form view after template is loaded
    }
  }, [selectedTemplate, setValue, createMode, isEditMode]);

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

  // Filter out STATUS column from visibleColumns since we handle it separately
  // to avoid duplicate status fields
  const columnsWithoutStatus = visibleColumns.filter(col => col.type !== 'STATUS');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[98vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>{isEditMode ? 'Edit Item' : 'Create New Item'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the item details below.'
              : 'Fill in the details to create a new item. You can also create from a template.'}
          </DialogDescription>
        </DialogHeader>

        {/* Create mode selector - only in create mode */}
        {!isEditMode && (
          <div className="space-y-2 border-b px-6 pb-4 shrink-0">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={createMode === 'blank' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCreateMode('blank')}
              >
                Blank Item
              </Button>
              <Button
                type="button"
                variant={createMode === 'template' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCreateMode('template')}
              >
                From Template
              </Button>
            </div>
            
            {createMode === 'template' && (
              <ItemTemplateSelector
                boardId={boardId}
                columns={columns}
                onTemplateSelect={(template) => {
                  setSelectedTemplate(template);
                }}
                onCancel={() => setCreateMode('blank')}
              />
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 px-6 py-4">
                {/* Item Name - Full Width */}
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

                {/* Status - Full Width */}
                {statusColumn && statusOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={watch('status') || ''} onValueChange={(value) => setValue('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions
                          .filter(option => option && option.trim() !== '') // Filter out empty options
                          .map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Dynamic Fields - Grid Layout for better use of width */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {columnsWithoutStatus.map((column) => {
                    const fieldName = `cell_${column.id}` as const;
                    // For long text and multi-line fields, use full width
                    const isFullWidth = column.type === 'LONG_TEXT' || column.type === 'TIMELINE' || column.type === 'FILE';
                    return (
                      <div key={column.id} className={isFullWidth ? 'md:col-span-2 lg:col-span-3' : ''}>
                        <ItemFieldRenderer
                          column={column}
                          fieldName={fieldName}
                          register={register}
                          control={control}
                          setValue={setValue}
                          errors={errors}
                          workspaceMembers={workspaceMembers}
                          item={item}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
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

