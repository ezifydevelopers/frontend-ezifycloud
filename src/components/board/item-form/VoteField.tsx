// Vote field component for item form

import React from 'react';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Column } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface VoteFieldProps {
  column: Column;
  fieldName: string;
  control: any;
  errors: any;
}

export const VoteField: React.FC<VoteFieldProps> = ({
  column,
  fieldName,
  control,
  errors,
}) => {
  const isRequired = column.required || false;
  const error = errors[fieldName];

  return (
    <Controller
      name={fieldName}
      control={control}
      rules={{ required: isRequired ? `${column.name} is required` : false }}
      render={({ field }) => {
        const currentVote = field.value === 'up' ? 'up' : field.value === 'down' ? 'down' : null;

        return (
          <div className="space-y-2">
            <Label>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={currentVote === 'up' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newVote = currentVote === 'up' ? null : 'up';
                  field.onChange(newVote);
                }}
                className={cn(
                  currentVote === 'up' && "bg-green-600 hover:bg-green-700"
                )}
              >
                <ThumbsUp className={cn(
                  "h-4 w-4 mr-2",
                  currentVote === 'up' && "fill-current"
                )} />
                Up
              </Button>
              <Button
                type="button"
                variant={currentVote === 'down' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newVote = currentVote === 'down' ? null : 'down';
                  field.onChange(newVote);
                }}
                className={cn(
                  currentVote === 'down' && "bg-red-600 hover:bg-red-700"
                )}
              >
                <ThumbsDown className={cn(
                  "h-4 w-4 mr-2",
                  currentVote === 'down' && "fill-current"
                )} />
                Down
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );
      }}
    />
  );
};

