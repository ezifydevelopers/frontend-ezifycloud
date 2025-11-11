// Checkbox field component for CHECKBOX column type

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Column } from '@/types/workspace';

interface CheckboxFieldProps {
  column: Column;
  fieldName: string;
  control: Control<any>;
  errors: FieldErrors;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  column,
  fieldName,
  control,
  errors,
}) => {
  const error = errors[fieldName];
  const isRequired = column.required;

  return (
    <div className="space-y-2">
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldName}
              checked={field.value || false}
              onCheckedChange={field.onChange}
              className={error ? 'border-destructive' : ''}
            />
            <Label htmlFor={fieldName} className="cursor-pointer">
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
};

