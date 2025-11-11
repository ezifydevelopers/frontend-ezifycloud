// Auto-number cell renderer (read-only)

import React from 'react';

interface AutoNumberCellProps {
  value: unknown;
}

export const AutoNumberCell: React.FC<AutoNumberCellProps> = ({ value }) => {
  return (
    <span className="text-muted-foreground px-2 py-1 text-sm font-mono">
      {value ? String(value) : '—'}
    </span>
  );
};

