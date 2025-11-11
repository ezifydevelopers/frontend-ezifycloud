// Default value input component - type-aware default value editor

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { ColumnType } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface DefaultValueInputProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: (name: string, value: unknown) => void;
  errors: FieldErrors;
  columnType: ColumnType;
  settings?: Record<string, unknown>;
}

export const DefaultValueInput: React.FC<DefaultValueInputProps> = ({
  register,
  watch,
  setValue,
  errors,
  columnType,
  settings,
}) => {
  const defaultValue = watch('defaultValue');
  const defaultValueError = errors.defaultValue;

  // Helper to parse default value based on type
  const getDisplayValue = () => {
    if (!defaultValue) return '';
    if (columnType === 'DATE' && typeof defaultValue === 'string') {
      return defaultValue.split('T')[0];
    }
    if (columnType === 'DATETIME' && typeof defaultValue === 'string') {
      return defaultValue.replace('Z', '').slice(0, 16);
    }
    if (columnType === 'CHECKBOX') {
      return String(defaultValue === true || defaultValue === 'true');
    }
    return String(defaultValue);
  };

  // Render based on column type
  switch (columnType) {
    case 'TEXT':
    case 'EMAIL':
    case 'PHONE':
    case 'LINK':
      return (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          <Input
            id="defaultValue"
            {...register('defaultValue')}
            placeholder={
              columnType === 'EMAIL'
                ? 'email@example.com'
                : columnType === 'PHONE'
                ? '+1 (555) 123-4567'
                : columnType === 'LINK'
                ? 'https://example.com'
                : 'Enter default text'
            }
            type={columnType === 'EMAIL' ? 'email' : columnType === 'PHONE' ? 'tel' : columnType === 'LINK' ? 'url' : 'text'}
            className={defaultValueError ? 'border-destructive' : ''}
          />
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );

    case 'LONG_TEXT':
      return (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          <Textarea
            id="defaultValue"
            {...register('defaultValue')}
            placeholder="Enter default text"
            rows={3}
            className={defaultValueError ? 'border-destructive' : ''}
          />
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );

    case 'NUMBER':
    case 'CURRENCY':
    case 'PERCENTAGE':
      return (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          <Input
            id="defaultValue"
            type="number"
            step={columnType === 'NUMBER' && (settings?.numberType === 'integer' ? '1' : '0.01')}
            {...register('defaultValue', {
              setValueAs: (value) => value === '' ? undefined : parseFloat(value),
            })}
            placeholder="0"
            className={defaultValueError ? 'border-destructive' : ''}
          />
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );

    case 'DATE':
      return (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          <Input
            id="defaultValue"
            type="date"
            {...register('defaultValue')}
            value={getDisplayValue()}
            className={defaultValueError ? 'border-destructive' : ''}
          />
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );

    case 'DATETIME':
      return (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          <Input
            id="defaultValue"
            type="datetime-local"
            {...register('defaultValue')}
            value={getDisplayValue()}
            className={defaultValueError ? 'border-destructive' : ''}
          />
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );

    case 'WEEK':
      return (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          <Input
            id="defaultValue"
            type="week"
            {...register('defaultValue')}
            className={defaultValueError ? 'border-destructive' : ''}
          />
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );

    case 'MONTH':
      return (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          <Input
            id="defaultValue"
            type="month"
            {...register('defaultValue')}
            className={defaultValueError ? 'border-destructive' : ''}
          />
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );

    case 'YEAR':
      return (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          <Input
            id="defaultValue"
            type="number"
            min="1900"
            max="2100"
            {...register('defaultValue', {
              setValueAs: (value) => value === '' ? undefined : parseInt(value, 10),
            })}
            placeholder="YYYY"
            className={defaultValueError ? 'border-destructive' : ''}
          />
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );

    case 'CHECKBOX':
      return (
        <div className="space-y-2">
          <Label>Default Value</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="defaultValue"
              checked={defaultValue === true || defaultValue === 'true'}
              onCheckedChange={(checked) => {
                register('defaultValue').onChange({
                  target: { value: checked ? 'true' : 'false', name: 'defaultValue' },
                });
              }}
            />
            <Label htmlFor="defaultValue" className="cursor-pointer font-normal">
              Checked by default
            </Label>
          </div>
        </div>
      );

    case 'DROPDOWN':
    case 'STATUS':
    case 'RADIO': {
      const options = (settings?.options as string[]) || [];
      const NONE_VALUE = '__none__'; // Special value to represent "no default"
      return (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          {options.length > 0 ? (
            <Select
              value={defaultValue || NONE_VALUE}
              onValueChange={(value) => {
                setValue('defaultValue', value === NONE_VALUE ? undefined : value);
              }}
            >
              <SelectTrigger className={defaultValueError ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select default value" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>No default value</SelectItem>
                {options
                  .filter(option => option && option.trim() !== '') // Filter out empty options
                  .map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-muted-foreground">
              Please add options first in column settings
            </div>
          )}
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );
    }

    case 'MULTI_SELECT': {
      const options = (settings?.options as string[]) || [];
      const selectedValues = Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : [];
      return (
        <div className="space-y-2">
          <Label>Default Value</Label>
          {options.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
              {options.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`defaultValue_${option}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        const newValues = checked
                          ? [...selectedValues, option]
                          : selectedValues.filter((v: string) => v !== option);
                        setValue('defaultValue', newValues.length > 0 ? newValues : undefined);
                      }}
                    />
                    <Label htmlFor={`defaultValue_${option}`} className="cursor-pointer font-normal">
                      {option}
                    </Label>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Please add options first in column settings
            </div>
          )}
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );
    }

    case 'RATING':
      return (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value (1-5)</Label>
          <Input
            id="defaultValue"
            type="number"
            min="1"
            max="5"
            step="1"
            {...register('defaultValue', {
              setValueAs: (value) => value === '' ? undefined : parseInt(value, 10),
            })}
            placeholder="1"
            className={defaultValueError ? 'border-destructive' : ''}
          />
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );

    case 'PROGRESS':
      return (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value (0-100%)</Label>
          <Input
            id="defaultValue"
            type="number"
            min="0"
            max="100"
            step="1"
            {...register('defaultValue', {
              setValueAs: (value) => value === '' ? undefined : parseInt(value, 10),
            })}
            placeholder="0"
            className={defaultValueError ? 'border-destructive' : ''}
          />
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );

    case 'VOTE':
      return (
        <div className="space-y-2">
          <Label>Default Value</Label>
          <RadioGroup
            value={defaultValue || 'none'}
            onValueChange={(value) => {
              setValue('defaultValue', value === 'none' ? undefined : value);
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="vote_none" />
              <Label htmlFor="vote_none" className="cursor-pointer font-normal">
                No default
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="up" id="vote_up" />
              <Label htmlFor="vote_up" className="cursor-pointer font-normal">
                Thumbs up
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="down" id="vote_down" />
              <Label htmlFor="vote_down" className="cursor-pointer font-normal">
                Thumbs down
              </Label>
            </div>
          </RadioGroup>
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );

    case 'FORMULA':
    case 'AUTO_NUMBER':
      return (
        <div className="space-y-2">
          <Label>Default Value</Label>
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            {columnType === 'FORMULA'
              ? 'Default value is calculated automatically based on the formula'
              : 'Default value is auto-generated sequentially'}
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          <Input
            id="defaultValue"
            {...register('defaultValue')}
            placeholder="Enter default value"
            className={defaultValueError ? 'border-destructive' : ''}
          />
          {defaultValueError && (
            <p className="text-sm text-destructive">{defaultValueError.message as string}</p>
          )}
        </div>
      );
  }
};

