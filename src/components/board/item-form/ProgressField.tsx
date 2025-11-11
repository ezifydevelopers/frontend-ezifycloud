// Progress field component for item form

import React from 'react';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Column } from '@/types/workspace';

interface ProgressFieldProps {
  column: Column;
  fieldName: string;
  control: any;
  errors: any;
}

export const ProgressField: React.FC<ProgressFieldProps> = ({
  column,
  fieldName,
  control,
  errors,
}) => {
  const isRequired = column.required || false;
  const error = errors[fieldName];

  return (
    <Controller
      name={fieldName}
      control={control}
      rules={{
        required: isRequired ? `${column.name} is required` : false,
        min: { value: 0, message: 'Progress must be between 0 and 100' },
        max: { value: 100, message: 'Progress must be between 0 and 100' },
      }}
      render={({ field }) => {
        const progressValue = typeof field.value === 'number'
          ? Math.min(100, Math.max(0, field.value))
          : typeof field.value === 'string'
          ? Math.min(100, Math.max(0, parseFloat(field.value) || 0))
          : 0;

        return (
          <div className="space-y-2">
            <Label>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={progressValue}
                onChange={(e) => {
                  const newValue = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                  field.onChange(newValue);
                }}
                className={error ? 'border-destructive' : ''}
              />
              <div className="space-y-1">
                <Progress value={progressValue} className="h-2" />
                <div className="text-xs text-muted-foreground text-right">
                  {Math.round(progressValue)}%
                </div>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );
      }}
    />
  );
};

