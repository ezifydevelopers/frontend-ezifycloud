// Status cell renderer (color-coded)

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStatusColor, getStatusColorStyle } from '../utils/cellValueFormatter';
import { Column } from '@/types/workspace';

interface StatusCellProps {
  value: string;
  onClick: () => void;
  column?: Column;
}

export const StatusCell: React.FC<StatusCellProps> = ({ value, onClick, column }) => {
  const colorClass = getStatusColor(value, column);
  const colorStyle = getStatusColorStyle(value, column);
  
  return (
    <div 
      className="cursor-pointer inline-block"
      onClick={onClick}
      title="Click to edit"
    >
      <Badge 
        variant="outline" 
        className={cn('capitalize border', !colorStyle && colorClass)}
        style={colorStyle}
      >
        {value}
      </Badge>
    </div>
  );
};

