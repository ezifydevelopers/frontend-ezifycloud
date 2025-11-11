// Due date cell renderer with overdue highlighting

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';
import { isOverdue, getOverdueStatus, getDaysUntilDue } from '@/utils/dueDateUtils';

interface DueDateCellProps {
  value: unknown;
  onClick: () => void;
  isDueDate?: boolean; // Flag to indicate this is a due date column
}

export const DueDateCell: React.FC<DueDateCellProps> = ({
  value,
  onClick,
  isDueDate = false,
}) => {
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

  const dateStr = String(value);
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    return (
      <span 
        className="text-muted-foreground cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
        onClick={onClick}
      >
        Invalid date
      </span>
    );
  }

  const formatted = date.toLocaleDateString();
  const overdue = isDueDate && isOverdue(dateStr);
  const status = isDueDate ? getOverdueStatus(dateStr) : null;
  const daysUntil = isDueDate ? getDaysUntilDue(dateStr) : null;

  if (!isDueDate) {
    // Regular date cell
    return (
      <span 
        className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
        onClick={onClick}
        title="Click to edit"
      >
        {formatted}
      </span>
    );
  }

  // Due date cell with overdue highlighting
  return (
    <div
      className={`cursor-pointer hover:bg-slate-100 px-2 py-1 rounded ${
        overdue ? 'bg-red-50 border border-red-200' : ''
      } ${
        status?.status === 'due_soon' && !overdue ? 'bg-yellow-50 border border-yellow-200' : ''
      }`}
      onClick={onClick}
      title={status?.label || formatted}
    >
      <div className="flex items-center gap-2">
        <span className={overdue ? 'font-semibold text-red-700' : ''}>{formatted}</span>
        {overdue && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        )}
        {status?.status === 'due_soon' && !overdue && daysUntil !== null && (
          <Badge variant="outline" className="text-xs text-yellow-700 bg-yellow-100 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        )}
      </div>
    </div>
  );
};

