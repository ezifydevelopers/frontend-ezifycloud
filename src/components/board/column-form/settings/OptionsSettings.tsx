// Options settings for DROPDOWN, MULTI_SELECT, STATUS

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface OptionsSettingsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  required?: boolean;
}

export const OptionsSettings: React.FC<OptionsSettingsProps> = ({
  register,
  errors,
  required = true,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="options">
        Options
        {required && <span className="text-destructive">*</span>}
        <span className="text-xs text-muted-foreground ml-2">
          (comma-separated values)
        </span>
      </Label>
      <Textarea
        id="options"
        {...register('options', { required: required ? 'Options are required' : false })}
        placeholder="Option 1, Option 2, Option 3"
        rows={3}
        className={errors.options ? 'border-destructive' : ''}
      />
      {errors.options && (
        <p className="text-sm text-destructive">{errors.options.message as string}</p>
      )}
    </div>
  );
};

