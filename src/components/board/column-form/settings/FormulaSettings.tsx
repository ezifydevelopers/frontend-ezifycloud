// Formula settings component

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface FormulaSettingsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  required?: boolean;
}

export const FormulaSettings: React.FC<FormulaSettingsProps> = ({
  register,
  errors,
  required = true,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="formula">
        Formula
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id="formula"
        {...register('formula', { required: required ? 'Formula is required' : false })}
        placeholder="Enter formula (e.g., {Column1} + {Column2} * 0.1)"
        rows={4}
        className={errors.formula ? 'border-destructive' : 'font-mono text-sm'}
      />
      <p className="text-xs text-muted-foreground">
        Use {'{ColumnName}'} to reference other columns. Supports: +, -, *, /, SUM(), AVG(), COUNT(), MAX(), MIN()
      </p>
      {errors.formula && (
        <p className="text-sm text-destructive">{errors.formula.message as string}</p>
      )}
    </div>
  );
};

