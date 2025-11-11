// Vote cell editor - thumbs up/down buttons

import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoteCellEditorProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const VoteCellEditor: React.FC<VoteCellEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
}) => {
  // Parse current value
  let currentVote: 'up' | 'down' | null = null;
  if (typeof value === 'string') {
    currentVote = value === 'up' ? 'up' : value === 'down' ? 'down' : null;
  } else if (typeof value === 'object' && value !== null) {
    const voteData = value as { vote?: 'up' | 'down' };
    currentVote = voteData.vote ?? null;
  }

  const handleVote = (vote: 'up' | 'down') => {
    const newVote = currentVote === vote ? null : vote;
    onChange(newVote);
    onSave();
  };

  return (
    <div className="flex items-center gap-2 p-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleVote('up')}
        className={cn(
          "h-8 w-8 p-0",
          currentVote === 'up' && "text-green-600 bg-green-50"
        )}
      >
        <ThumbsUp className={cn(
          "h-5 w-5",
          currentVote === 'up' && "fill-current"
        )} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleVote('down')}
        className={cn(
          "h-8 w-8 p-0",
          currentVote === 'down' && "text-red-600 bg-red-50"
        )}
      >
        <ThumbsDown className={cn(
          "h-5 w-5",
          currentVote === 'down' && "fill-current"
        )} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="h-6 w-6 p-0"
      >
        ×
      </Button>
    </div>
  );
};

