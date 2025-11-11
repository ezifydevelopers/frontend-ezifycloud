// Long text field component for LONG_TEXT column type

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Column } from '@/types/workspace';

interface LongTextFieldProps {
  column: Column;
  fieldName: string;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export const LongTextField: React.FC<LongTextFieldProps> = ({
  column,
  fieldName,
  register,
  errors,
}) => {
  const error = errors[fieldName];
  const isRequired = column.required;

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>
        {column.name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id={fieldName}
        {...register(fieldName)}
        placeholder={`Enter ${column.name.toLowerCase()}`}
        rows={4}
        className={error ? 'border-destructive' : ''}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
};

