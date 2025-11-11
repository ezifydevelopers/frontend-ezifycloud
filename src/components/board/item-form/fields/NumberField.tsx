// Number field component for NUMBER, CURRENCY, PERCENTAGE column types

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { Column } from '@/types/workspace';

interface NumberFieldProps {
  column: Column;
  fieldName: string;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  column,
  fieldName,
  register,
  setValue,
  errors,
}) => {
  const error = errors[fieldName];
  const isRequired = column.required;
  const currencySettings = column.settings as { currency?: string } | undefined;
  const currency = currencySettings?.currency || 'USD';

  const currencySymbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹',
    AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CHF: 'CHF',
    NZD: 'NZ$', BRL: 'R$', MXN: '$', ZAR: 'R'
  };

  if (column.type === 'CURRENCY') {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldName}>
          {column.name}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="flex gap-2">
          <Select
            value={currency}
            onValueChange={(value) => {
              setValue(fieldName + '_currency', value);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(currencySymbols).map((curr) => (
                <SelectItem key={curr} value={curr}>
                  {currencySymbols[curr]} {curr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id={fieldName}
            type="number"
            step="0.01"
            {...register(fieldName)}
            placeholder="0.00"
            className={error ? 'border-destructive flex-1' : 'flex-1'}
          />
        </div>
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
        type="number"
        step={column.type === 'PERCENTAGE' ? '0.01' : '1'}
        {...register(fieldName)}
        placeholder={column.type === 'PERCENTAGE' ? '0.00' : '0'}
        className={error ? 'border-destructive' : ''}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
};

