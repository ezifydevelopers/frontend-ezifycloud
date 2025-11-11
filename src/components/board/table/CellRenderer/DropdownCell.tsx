// Dropdown/Radio cell renderer

import React from 'react';

interface DropdownCellProps {
  value: string;
  onClick: () => void;
}

export const DropdownCell: React.FC<DropdownCellProps> = ({ value, onClick }) => {
  return (
    <span 
      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to edit"
    >
      {value || '—'}
    </span>
  );
};

