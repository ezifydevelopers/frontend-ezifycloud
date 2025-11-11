// Rating cell renderer (star rating)

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingCellProps {
  value: unknown;
  onClick: () => void;
}

export const RatingCell: React.FC<RatingCellProps> = ({ value, onClick }) => {
  const rating = value ? Math.min(5, Math.max(0, Number(value))) : 0;
  
  return (
    <div 
      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded inline-flex items-center gap-1"
      onClick={onClick}
      title="Click to edit"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          )}
        />
      ))}
      {rating > 0 && <span className="text-xs text-muted-foreground ml-1">({rating})</span>}
    </div>
  );
};

