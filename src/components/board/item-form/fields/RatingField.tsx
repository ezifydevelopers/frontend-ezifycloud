// Rating field component for RATING column type

import React from 'react';
import { Label } from '@/components/ui/label';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Column } from '@/types/workspace';

interface RatingFieldProps {
  column: Column;
  fieldName: string;
  control: Control<any>;
  errors: FieldErrors;
}

export const RatingField: React.FC<RatingFieldProps> = ({
  column,
  fieldName,
  control,
  errors,
}) => {
  const error = errors[fieldName];
  const isRequired = column.required;

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
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => field.onChange(star)}
                className="focus:outline-none"
              >
                <Star
                  className={cn(
                    'h-6 w-6 cursor-pointer transition-colors',
                    star <= (field.value || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-300'
                  )}
                />
              </button>
            ))}
            {field.value > 0 && (
              <span className="text-sm text-muted-foreground ml-2">({field.value}/5)</span>
            )}
          </div>
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
};

