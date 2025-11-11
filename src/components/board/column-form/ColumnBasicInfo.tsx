// Basic column information fields (name, description, width, required, hidden, unique)

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { ColumnType, Column } from '@/types/workspace';
import { DefaultValueInput } from './DefaultValueInput';
import { ColumnPositionManager } from './ColumnPositionManager';

interface ColumnBasicInfoProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors;
  selectedType: ColumnType;
  isEditMode: boolean;
  currentColumn?: Column | null;
  existingColumns?: Column[];
}

export const ColumnBasicInfo: React.FC<ColumnBasicInfoProps> = ({
  register,
  watch,
  setValue,
  errors,
  selectedType,
  isEditMode,
  currentColumn,
  existingColumns = [],
}) => {
  return (
    <>
      {/* Column Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Column Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register('name', { required: 'Column name is required', minLength: 1, maxLength: 100 })}
          placeholder="Enter column name"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message as string}</p>
        )}
      </div>

      {/* Column Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description', { maxLength: 500 })}
          placeholder="Optional description for this column"
          rows={2}
          className={errors.description ? 'border-destructive' : ''}
        />
        <p className="text-xs text-muted-foreground">
          Help users understand the purpose of this column (optional)
        </p>
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message as string}</p>
        )}
      </div>

      {/* Column Width */}
      <div className="space-y-2">
        <Label htmlFor="width">Column Width (px)</Label>
        <Input
          id="width"
          type="number"
          min="50"
          max="1000"
          {...register('width', { 
            valueAsNumber: true, 
            min: 50, 
            max: 1000 
          })}
          placeholder="200"
        />
        <p className="text-xs text-muted-foreground">
          Default column width in pixels. Users can resize columns in table view.
        </p>
      </div>

      {/* Required Field */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={watch('required')}
          onCheckedChange={(checked) => setValue('required', checked as boolean)}
        />
        <Label htmlFor="required" className="cursor-pointer">
          Required field
        </Label>
      </div>

      {/* Hide Column */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isHidden"
          checked={watch('isHidden')}
          onCheckedChange={(checked) => setValue('isHidden', checked as boolean)}
        />
        <Label htmlFor="isHidden" className="cursor-pointer">
          Hide column (will not be visible in views)
        </Label>
      </div>

      {/* Unique Values */}
      {selectedType !== 'CHECKBOX' && selectedType !== 'FILE' && selectedType !== 'FORMULA' && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="unique"
            checked={watch('unique')}
            onCheckedChange={(checked) => setValue('unique', checked as boolean)}
          />
          <Label htmlFor="unique" className="cursor-pointer">
            Unique values only (no duplicates allowed)
          </Label>
        </div>
      )}

      {/* Default Value - Using type-aware component */}
      <DefaultValueInput
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        columnType={selectedType}
        settings={(() => {
          // Get settings from form based on column type
          if (selectedType === 'DROPDOWN' || selectedType === 'STATUS' || selectedType === 'RADIO' || selectedType === 'MULTI_SELECT') {
            const optionsStr = watch('options') || '';
            return {
              options: optionsStr ? optionsStr.split(',').map((opt: string) => opt.trim()).filter(Boolean) : [],
            };
          }
          return watch('settings') as Record<string, unknown> | undefined;
        })()}
      />

      {/* Position Manager - Only in edit mode */}
      {isEditMode && existingColumns.length > 0 && (
        <ColumnPositionManager
          register={register}
          watch={watch}
          setValue={setValue}
          currentColumn={currentColumn}
          existingColumns={existingColumns}
        />
      )}
    </>
  );
};

