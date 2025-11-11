// Number cell renderer

import React from 'react';

interface NumberCellProps {
  value: unknown;
  onClick: () => void;
}

export const NumberCell: React.FC<NumberCellProps> = ({ value, onClick }) => {
  const numValue = value ? Number(value) : null;
  
  return (
    <span 
      className="font-medium cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to edit"
    >
      {numValue !== null ? numValue.toLocaleString() : '—'}
    </span>
  );
};

