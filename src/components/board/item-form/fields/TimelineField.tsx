// Timeline field component for TIMELINE column type

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Column } from '@/types/workspace';

interface TimelineFieldProps {
  column: Column;
  fieldName: string;
  control: Control<any>;
  errors: FieldErrors;
}

export const TimelineField: React.FC<TimelineFieldProps> = ({
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
        render={({ field }) => {
          let startDate = '';
          let endDate = '';

          if (field.value) {
            try {
              const timeline = typeof field.value === 'string' ? JSON.parse(field.value) : field.value;
              if (timeline.start) {
                const date = new Date(timeline.start);
                startDate = date.toISOString().split('T')[0];
              }
              if (timeline.end) {
                const date = new Date(timeline.end);
                endDate = date.toISOString().split('T')[0];
              }
            } catch {
              // Invalid format, leave empty
            }
          }

          const handleDateChange = (type: 'start' | 'end', value: string) => {
            const timeline = typeof field.value === 'string' && field.value ? JSON.parse(field.value) : (field.value || {});
            timeline[type] = value ? new Date(value).toISOString() : '';
            field.onChange(JSON.stringify(timeline));
          };

          return (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                placeholder="Start date"
                className={error ? 'border-destructive' : ''}
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
                placeholder="End date"
                className={error ? 'border-destructive' : ''}
              />
            </div>
          );
        }}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
};

