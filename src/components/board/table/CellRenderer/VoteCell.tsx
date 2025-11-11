// Vote cell renderer - displays thumbs up/down with count

import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoteCellProps {
  value: unknown;
  onClick: () => void;
}

export const VoteCell: React.FC<VoteCellProps> = ({ value, onClick }) => {
  if (value === null || value === undefined) {
    return (
      <span 
        className="text-muted-foreground cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
        onClick={onClick}
        title="Click to edit"
      >
        —
      </span>
    );
  }

  // Vote value can be: 'up', 'down', or { up: number, down: number }
  let upCount = 0;
  let downCount = 0;
  let currentVote: 'up' | 'down' | null = null;

  if (typeof value === 'string') {
    currentVote = value === 'up' ? 'up' : value === 'down' ? 'down' : null;
  } else if (typeof value === 'object' && value !== null) {
    const voteData = value as { up?: number; down?: number; vote?: 'up' | 'down' };
    upCount = voteData.up ?? 0;
    downCount = voteData.down ?? 0;
    currentVote = voteData.vote ?? null;
  } else if (typeof value === 'number') {
    // Simple numeric: positive = up, negative = down
    if (value > 0) {
      upCount = value;
    } else if (value < 0) {
      downCount = Math.abs(value);
    }
  }

  return (
    <div 
      className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to edit"
    >
      <div className={cn(
        "flex items-center gap-1",
        currentVote === 'up' && "text-green-600"
      )}>
        <ThumbsUp className="h-4 w-4" />
        {upCount > 0 && <span className="text-sm">{upCount}</span>}
      </div>
      <div className={cn(
        "flex items-center gap-1",
        currentVote === 'down' && "text-red-600"
      )}>
        <ThumbsDown className="h-4 w-4" />
        {downCount > 0 && <span className="text-sm">{downCount}</span>}
      </div>
    </div>
  );
};

