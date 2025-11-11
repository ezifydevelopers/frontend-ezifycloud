// Progress cell renderer - displays progress bar

import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressCellProps {
  value: unknown;
  onClick: () => void;
}

export const ProgressCell: React.FC<ProgressCellProps> = ({ value, onClick }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  // Progress value should be 0-100
  const progressValue = typeof value === 'number' 
    ? Math.min(100, Math.max(0, value))
    : typeof value === 'string'
    ? Math.min(100, Math.max(0, parseFloat(value) || 0))
    : 0;

  const getColorClass = (val: number) => {
    if (val < 25) return 'bg-red-500';
    if (val < 50) return 'bg-orange-500';
    if (val < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div 
      className="flex items-center gap-2 w-full min-w-[100px] cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to edit"
    >
      <Progress 
        value={progressValue} 
        className="flex-1 h-2"
      />
      <span className="text-sm text-muted-foreground min-w-[35px] text-right">
        {Math.round(progressValue)}%
      </span>
    </div>
  );
};

