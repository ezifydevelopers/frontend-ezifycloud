// Multi-select field component for MULTI_SELECT column type

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Controller, Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Column } from '@/types/workspace';

interface MultiSelectFieldProps {
  column: Column;
  fieldName: string;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors;
}

export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  column,
  fieldName,
  control,
  setValue,
  errors,
}) => {
  const error = errors[fieldName];
  const isRequired = column.required;
  const settings = column.settings as { options?: string[] } | undefined;
  const options = settings?.options || [];

  return (
    <div className="space-y-2">
      <Label>
        {column.name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => {
          const selectedValues = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];

          return (
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {options.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${fieldName}_${option}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setValue(fieldName, [...selectedValues, option]);
                        } else {
                          setValue(fieldName, selectedValues.filter((v: string) => v !== option));
                        }
                      }}
                    />
                    <Label htmlFor={`${fieldName}_${option}`} className="cursor-pointer font-normal">
                      {option}
                    </Label>
                  </div>
                );
              })}
            </div>
          );
        }}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
};

