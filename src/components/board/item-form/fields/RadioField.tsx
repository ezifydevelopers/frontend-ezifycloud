// Radio field component for RADIO column type

import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Column } from '@/types/workspace';

interface RadioFieldProps {
  column: Column;
  fieldName: string;
  control: Control<any>;
  errors: FieldErrors;
}

export const RadioField: React.FC<RadioFieldProps> = ({
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
      <Label>
        {column.name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => (
          <RadioGroup value={field.value || ''} onValueChange={field.onChange}>
            {options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${fieldName}_${option}`} />
                <Label htmlFor={`${fieldName}_${option}`} className="cursor-pointer font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
};

