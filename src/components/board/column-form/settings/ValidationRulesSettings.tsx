// Validation rules settings component

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { ColumnType } from '@/types/workspace';
import { AlertCircle } from 'lucide-react';

interface ValidationRulesSettingsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors;
  columnType: ColumnType;
}

export const ValidationRulesSettings: React.FC<ValidationRulesSettingsProps> = ({
  register,
  watch,
  setValue,
  errors,
  columnType,
}) => {
  const minLength = watch('validationMinLength');
  const maxLength = watch('validationMaxLength');
  const minValue = watch('validationMinValue');
  const maxValue = watch('validationMaxValue');
  const pattern = watch('validationPattern');
  const customMessage = watch('validationCustomMessage');

  const isTextType = ['TEXT', 'LONG_TEXT', 'EMAIL', 'PHONE', 'LINK'].includes(columnType);
  const isNumberType = ['NUMBER', 'CURRENCY', 'PERCENTAGE', 'RATING', 'PROGRESS'].includes(columnType);

  return (
    <div className="space-y-4 p-4 border rounded-md bg-slate-50">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <Label className="text-base font-semibold">Validation Rules</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Define rules to validate data entered in this column. Invalid data will be rejected.
      </p>

      {/* Text validation rules */}
      {isTextType && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validationMinLength">Minimum Length</Label>
              <Input
                id="validationMinLength"
                type="number"
                min="0"
                {...register('validationMinLength', {
                  valueAsNumber: true,
                  min: 0,
                })}
                placeholder="0"
              />
              {errors.validationMinLength && (
                <p className="text-xs text-destructive">{errors.validationMinLength.message as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="validationMaxLength">Maximum Length</Label>
              <Input
                id="validationMaxLength"
                type="number"
                min="1"
                {...register('validationMaxLength', {
                  valueAsNumber: true,
                  min: 1,
                  validate: (value) => {
                    if (minLength && value && value < minLength) {
                      return 'Max length must be greater than or equal to min length';
                    }
                    return true;
                  },
                })}
                placeholder="Unlimited"
              />
              {errors.validationMaxLength && (
                <p className="text-xs text-destructive">{errors.validationMaxLength.message as string}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validationPattern">Pattern (Regex)</Label>
            <Input
              id="validationPattern"
              {...register('validationPattern', {
                validate: (value) => {
                  if (!value) return true;
                  try {
                    new RegExp(value);
                    return true;
                  } catch {
                    return 'Invalid regex pattern';
                  }
                },
              })}
              placeholder="^[a-zA-Z0-9]+$"
            />
            <p className="text-xs text-muted-foreground">
              Enter a regular expression pattern to validate the format (e.g., ^[a-zA-Z0-9]+$ for alphanumeric)
            </p>
            {errors.validationPattern && (
              <p className="text-xs text-destructive">{errors.validationPattern.message as string}</p>
            )}
          </div>
        </>
      )}

      {/* Number validation rules */}
      {isNumberType && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="validationMinValue">Minimum Value</Label>
            <Input
              id="validationMinValue"
              type="number"
              {...register('validationMinValue', {
                valueAsNumber: true,
              })}
              placeholder="No minimum"
            />
            {errors.validationMinValue && (
              <p className="text-xs text-destructive">{errors.validationMinValue.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="validationMaxValue">Maximum Value</Label>
            <Input
              id="validationMaxValue"
              type="number"
              {...register('validationMaxValue', {
                valueAsNumber: true,
                validate: (value) => {
                  if (minValue !== undefined && value !== undefined && value < minValue) {
                    return 'Max value must be greater than or equal to min value';
                  }
                  return true;
                },
              })}
              placeholder="No maximum"
            />
            {errors.validationMaxValue && (
              <p className="text-xs text-destructive">{errors.validationMaxValue.message as string}</p>
            )}
          </div>
        </div>
      )}

      {/* Custom validation message */}
      <div className="space-y-2">
        <Label htmlFor="validationCustomMessage">Custom Error Message</Label>
        <Input
          id="validationCustomMessage"
          {...register('validationCustomMessage', { maxLength: 200 })}
          placeholder="Enter a custom error message for validation failures"
        />
        <p className="text-xs text-muted-foreground">
          Optional custom message shown when validation fails (defaults to generic message)
        </p>
        {errors.validationCustomMessage && (
          <p className="text-xs text-destructive">{errors.validationCustomMessage.message as string}</p>
        )}
      </div>
    </div>
  );
};

