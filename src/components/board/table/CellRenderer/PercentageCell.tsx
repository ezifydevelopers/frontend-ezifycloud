// Percentage cell renderer

import React from 'react';

interface PercentageCellProps {
  value: unknown;
  onClick: () => void;
}

export const PercentageCell: React.FC<PercentageCellProps> = ({ value, onClick }) => {
  const percentValue = value ? Number(value) : null;
  
  return (
    <span 
      className="font-medium cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to edit"
    >
      {percentValue !== null ? `${percentValue.toFixed(2)}%` : '—'}
    </span>
  );
};

