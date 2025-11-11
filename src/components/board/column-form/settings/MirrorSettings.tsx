// Mirror column settings component

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { Board, Column } from '@/types/workspace';

interface MirrorSettingsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors;
  availableBoards: Board[];
  linkedBoardColumns: Column[];
}

export const MirrorSettings: React.FC<MirrorSettingsProps> = ({
  register,
  watch,
  setValue,
  errors,
  availableBoards,
  linkedBoardColumns,
}) => {
  const selectedLinkedBoardId = watch('linkedBoardId');

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="linkedBoardId">
          Linked Board
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Select
          value={watch('linkedBoardId') || ''}
          onValueChange={(value) => {
            setValue('linkedBoardId', value);
            setValue('linkedColumnId', ''); // Reset column when board changes
            setValue('linkedItemId', ''); // Reset item when board changes
          }}
        >
          <SelectTrigger className={errors.linkedBoardId ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select board to mirror from" />
          </SelectTrigger>
          <SelectContent>
            {availableBoards.length > 0 ? (
              availableBoards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="__no_boards__" disabled>No other boards available</SelectItem>
            )}
          </SelectContent>
        </Select>
        {errors.linkedBoardId && (
          <p className="text-sm text-destructive">{errors.linkedBoardId.message as string}</p>
        )}
      </div>

      {selectedLinkedBoardId && (
        <div className="space-y-2">
          <Label htmlFor="linkedColumnId">
            Column to Mirror
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Select
            value={watch('linkedColumnId') || ''}
            onValueChange={(value) => setValue('linkedColumnId', value)}
          >
            <SelectTrigger className={errors.linkedColumnId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select column to mirror" />
            </SelectTrigger>
            <SelectContent>
              {linkedBoardColumns.length > 0 ? (
                linkedBoardColumns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name} ({col.type})
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__loading__" disabled>Loading columns...</SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.linkedColumnId && (
            <p className="text-sm text-destructive">{errors.linkedColumnId.message as string}</p>
          )}
        </div>
      )}

      {selectedLinkedBoardId && (
        <div className="space-y-2">
          <Label htmlFor="linkedItemId">Link to Specific Item (Optional)</Label>
          <Input
            id="linkedItemId"
            {...register('linkedItemId')}
            placeholder="Item ID (leave empty to link dynamically)"
            className={errors.linkedItemId ? 'border-destructive' : ''}
          />
          <p className="text-xs text-muted-foreground">
            If specified, this column will always show the value from that specific item. Leave empty to link items dynamically.
          </p>
        </div>
      )}
    </>
  );
};

