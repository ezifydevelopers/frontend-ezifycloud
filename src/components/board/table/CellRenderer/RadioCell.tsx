// Radio cell renderer (same as dropdown for display)

import React from 'react';
import { DropdownCell } from './DropdownCell';

interface RadioCellProps {
  value: string;
  onClick: () => void;
}

export const RadioCell: React.FC<RadioCellProps> = ({ value, onClick }) => {
  return <DropdownCell value={value} onClick={onClick} />;
};

