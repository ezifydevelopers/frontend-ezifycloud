// Date cell renderer (for DATE, DATETIME, WEEK, MONTH, YEAR types)

import React from 'react';
import { ColumnType } from '@/types/workspace';
import { getWeekNumber } from '../utils/dateUtils';

interface DateCellProps {
  type: ColumnType;
  value: unknown;
  onClick: () => void;
}

export const DateCell: React.FC<DateCellProps> = ({ type, value, onClick }) => {
  if (!value) {
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

  const date = new Date(value as string);

  let formatted: string;
  switch (type) {
    case 'DATE':
      formatted = date.toLocaleDateString();
      break;
    case 'DATETIME':
      formatted = date.toLocaleString();
      break;
    case 'WEEK':
      formatted = `${date.getFullYear()}-W${String(getWeekNumber(date)).padStart(2, '0')}`;
      break;
    case 'MONTH':
      formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      break;
    case 'YEAR':
      formatted = String(date.getFullYear());
      break;
    default:
      formatted = date.toLocaleDateString();
  }

  return (
    <span 
      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to edit"
    >
      {formatted}
    </span>
  );
};

