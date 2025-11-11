// Long text cell renderer

import React from 'react';

interface LongTextCellProps {
  value: string;
  onClick: () => void;
}

export const LongTextCell: React.FC<LongTextCellProps> = ({ value, onClick }) => {
  return (
    <div 
      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded max-w-md"
      onClick={onClick}
      title="Click to edit"
    >
      <p className="text-sm line-clamp-2">{value || '—'}</p>
    </div>
  );
};

