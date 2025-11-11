// Dropdown field component for DROPDOWN, STATUS column types

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Column } from '@/types/workspace';

interface DropdownFieldProps {
  column: Column;
  fieldName: string;
  control: Control<any>;
  errors: FieldErrors;
}

export const DropdownField: React.FC<DropdownFieldProps> = ({
  column,
  fieldName,
  control,
  errors,
}) => {
  const error = errors[fieldName];
  const isRequired = column.required;
  const settings = column.settings as { options?: string[] } | undefined;
  const options = settings?.options || [];

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>
        {column.name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => (
          <Select value={field.value || ''} onValueChange={field.onChange}>
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${column.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options
                .filter(option => option && option.trim() !== '') // Filter out empty options
                .map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
};

