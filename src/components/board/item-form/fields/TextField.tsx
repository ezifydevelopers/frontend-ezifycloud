// Text field component for TEXT, EMAIL, PHONE, LINK column types

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Column } from '@/types/workspace';

interface TextFieldProps {
  column: Column;
  fieldName: string;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export const TextField: React.FC<TextFieldProps> = ({
  column,
  fieldName,
  register,
  errors,
}) => {
  const error = errors[fieldName];
  const isRequired = column.required;

  const getInputType = () => {
    switch (column.type) {
      case 'EMAIL':
        return 'email';
      case 'PHONE':
        return 'tel';
      case 'LINK':
        return 'url';
      default:
        return 'text';
    }
  };

  const getPlaceholder = () => {
    switch (column.type) {
      case 'EMAIL':
        return 'email@example.com';
      case 'PHONE':
        return '+1 (555) 123-4567';
      case 'LINK':
        return 'https://example.com';
      default:
        return `Enter ${column.name.toLowerCase()}`;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>
        {column.name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={fieldName}
        type={getInputType()}
        {...register(fieldName)}
        placeholder={getPlaceholder()}
        className={error ? 'border-destructive' : ''}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
};

