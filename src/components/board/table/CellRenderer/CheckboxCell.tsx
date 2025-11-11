// Checkbox cell renderer

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CheckboxCellProps {
  value: boolean;
  onClick: () => void;
}

export const CheckboxCell: React.FC<CheckboxCellProps> = ({ value, onClick }) => {
  return (
    <div 
      className="cursor-pointer inline-block"
      onClick={onClick}
      title="Click to edit"
    >
      <Badge variant={value ? 'default' : 'outline'}>
        {value ? 'Yes' : 'No'}
      </Badge>
    </div>
  );
};

