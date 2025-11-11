// Multi-select cell renderer (tags)

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface MultiSelectCellProps {
  value: unknown;
  onClick: () => void;
}

export const MultiSelectCell: React.FC<MultiSelectCellProps> = ({ value, onClick }) => {
  const selectedVals = Array.isArray(value) ? value : value ? [value] : [];
  
  return (
    <div 
      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded flex flex-wrap gap-1"
      onClick={onClick}
      title="Click to edit"
    >
      {selectedVals.length > 0 ? (
        selectedVals.map((val, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs">
            {String(val)}
          </Badge>
        ))
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      )}
    </div>
  );
};

