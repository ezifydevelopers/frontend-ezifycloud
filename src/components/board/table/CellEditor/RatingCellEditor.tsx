// Rating cell editor (star rating)

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingCellEditorProps {
  value: unknown;
  onChange?: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const RatingCellEditor: React.FC<RatingCellEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  disabled = false,
}) => {
  const ratingValue = Math.min(5, Math.max(0, Number(value) || 0));

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-5 w-5 cursor-pointer transition-colors',
              star <= ratingValue
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            )}
            onClick={() => {
              onChange?.(star);
              onSave();
            }}
          />
        ))}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={onCancel}
        disabled={disabled}
      >
        <X className="h-3 w-3 text-red-600" />
      </Button>
    </div>
  );
};

