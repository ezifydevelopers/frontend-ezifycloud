// Auto-number cell editor (read-only, no editing)

import React from 'react';

interface AutoNumberCellEditorProps {
  value: unknown;
}

export const AutoNumberCellEditor: React.FC<AutoNumberCellEditorProps> = ({ value }) => {
  return (
    <span className="text-muted-foreground px-2 py-1 text-sm">
      {String(value || '—')}
    </span>
  );
};

