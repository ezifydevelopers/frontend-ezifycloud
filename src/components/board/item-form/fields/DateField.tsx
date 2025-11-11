// Date field component for DATE, DATETIME, WEEK, MONTH, YEAR column types

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Column } from '@/types/workspace';

interface DateFieldProps {
  column: Column;
  fieldName: string;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export const DateField: React.FC<DateFieldProps> = ({
  column,
  fieldName,
  register,
  errors,
}) => {
  const error = errors[fieldName];
  const isRequired = column.required;

  const getInputType = () => {
    switch (column.type) {
      case 'DATETIME':
        return 'datetime-local';
      case 'WEEK':
        return 'week';
      case 'MONTH':
        return 'month';
      case 'YEAR':
        return 'number';
      default:
        return 'date';
    }
  };

  const getPlaceholder = () => {
    switch (column.type) {
      case 'WEEK':
        return 'YYYY-WNN';
      case 'MONTH':
        return 'YYYY-MM';
      case 'YEAR':
        return 'YYYY';
      default:
        return undefined;
    }
  };

  if (column.type === 'YEAR') {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldName}>
          {column.name}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id={fieldName}
          type="number"
          min="1900"
          max="2100"
          {...register(fieldName)}
          placeholder="YYYY"
          className={error ? 'border-destructive' : ''}
        />
        {error && (
          <p className="text-sm text-destructive">{error.message as string}</p>
        )}
      </div>
    );
  }

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

