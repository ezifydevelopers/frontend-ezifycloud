// Refactored CreateColumnDialog - Orchestrates extracted components

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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { boardAPI } from '@/lib/api';
import { Column } from '@/types/workspace';
import { ColumnTypeSelector } from './column-form/ColumnTypeSelector';
import { ColumnBasicInfo } from './column-form/ColumnBasicInfo';
import { ColumnTypeChangeWarning } from './column-form/ColumnTypeChangeWarning';
import {
  OptionsSettings,
  CurrencySettings,
  NumberSettings,
  PeopleSettings,
  FileSettings,
  FormulaSettings,
  MirrorSettings,
  ColumnPinSettings,
  ColumnPermissionsSettings,
  ValidationRulesSettings,
  AutoNumberSettings,
} from './column-form/settings';
import { useColumnForm } from './column-form/useColumnForm';

interface CreateColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  column?: Column | null;
  existingColumns?: Column[];
  onSuccess?: () => void;
}

export const CreateColumnDialog: React.FC<CreateColumnDialogProps> = ({
  open,
  onOpenChange,
  boardId,
  column,
  existingColumns = [],
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!column;

  const {
    form,
    selectedType,
    originalType,
    selectedLinkedBoardId,
    availableBoards,
    linkedBoardColumns,
    convertFormDataToColumn,
    getNextPosition,
  } = useColumnForm({
    boardId,
    column,
    existingColumns,
    open,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      const columnData = convertFormDataToColumn(data, selectedType);

      if (isEditMode && column) {
        const response = await boardAPI.updateColumn(column.id, columnData);
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Column updated successfully',
          });
          onSuccess?.();
          onOpenChange(false);
        } else {
          throw new Error(response.message || 'Failed to update column');
        }
      } else {
        const createData: any = {
          name: columnData.name!,
          type: columnData.type!,
          position: getNextPosition(),
        };
        if (columnData.width) createData.width = columnData.width;
        if (columnData.required !== undefined) createData.required = columnData.required;
        if (columnData.settings) createData.settings = columnData.settings;
        
        const response = await boardAPI.createColumn(boardId, createData);
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Column created successfully',
          });
          onSuccess?.();
          onOpenChange(false);
        } else {
          throw new Error(response.message || 'Failed to create column');
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save column',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const needsOptions = ['DROPDOWN', 'MULTI_SELECT', 'STATUS'].includes(selectedType);
  const needsCurrency = selectedType === 'CURRENCY';
  const needsNumberType = selectedType === 'NUMBER';
  const needsPeopleType = selectedType === 'PEOPLE';
  const needsFileSettings = selectedType === 'FILE';
  const needsFormula = selectedType === 'FORMULA';
  const needsMirrorSettings = selectedType === 'MIRROR';
  const needsAutoNumberSettings = selectedType === 'AUTO_NUMBER';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Column' : 'Create New Column'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update column properties and settings'
              : 'Add a new column to this board. Columns define the data structure for items.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {/* Column Type Selector */}
              <ColumnTypeSelector
                value={watch('type')}
                onValueChange={(value) => setValue('type', value)}
                disabled={false} // Enable type change in edit mode with warning
                error={errors.type?.message as string}
              />

              {/* Type Change Warning - Only show if type changed in edit mode */}
              {isEditMode && originalType && selectedType !== originalType && (
                <ColumnTypeChangeWarning
                  originalType={originalType}
                  newType={selectedType}
                  itemCount={(column as any)?._count?.items ?? 0}
                />
              )}

              {/* Options Settings */}
              {needsOptions && (
                <OptionsSettings
                  register={register}
                  errors={errors}
                />
              )}

              {/* Currency Settings */}
              {needsCurrency && (
                <CurrencySettings
                  watch={watch}
                  setValue={setValue}
                />
              )}

              {/* Number Settings */}
              {needsNumberType && (
                <NumberSettings
                  watch={watch}
                  setValue={setValue}
                />
              )}

              {/* People Settings */}
              {needsPeopleType && (
                <PeopleSettings
                  watch={watch}
                  setValue={setValue}
                />
              )}

              {/* File Settings */}
              {needsFileSettings && (
                <FileSettings
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  errors={errors}
                />
              )}

              {/* Formula Settings */}
              {needsFormula && (
                <FormulaSettings
                  register={register}
                  errors={errors}
                />
              )}

              {/* Mirror Settings */}
              {needsMirrorSettings && (
                <MirrorSettings
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  errors={errors}
                  availableBoards={availableBoards}
                  linkedBoardColumns={linkedBoardColumns}
                />
              )}

              {/* Auto Number Settings */}
              {needsAutoNumberSettings && (
                <AutoNumberSettings
                  column={column || {
                    id: '',
                    name: watch('name') || '',
                    type: 'AUTO_NUMBER',
                    boardId,
                    position: 0,
                    settings: watch('settings') || {},
                  } as Column}
                  settings={watch('settings') || {}}
                  onSettingsChange={(newSettings) => {
                    setValue('settings', { ...watch('settings'), ...newSettings });
                  }}
                />
              )}

              {/* Basic Info (name, width, required, hidden, unique, defaultValue, position) */}
              <ColumnBasicInfo
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                selectedType={selectedType}
                isEditMode={isEditMode}
                currentColumn={column}
                existingColumns={existingColumns}
              />

              {/* Pin Column Settings */}
              <ColumnPinSettings
                watch={watch}
                setValue={setValue}
              />

              {/* Validation Rules */}
              <ValidationRulesSettings
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                columnType={selectedType}
              />

              {/* Column Permissions - Only in edit mode */}
              {isEditMode && (
                <ColumnPermissionsSettings
                  column={column}
                  onSuccess={onSuccess}
                />
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditMode ? 'Update Column' : 'Create Column'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

