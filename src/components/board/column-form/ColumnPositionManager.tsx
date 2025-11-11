// Column position manager - allows reordering columns by position

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Column } from '@/types/workspace';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';

interface ColumnPositionManagerProps {
  register: any;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  currentColumn?: Column | null;
  existingColumns: Column[];
}

export const ColumnPositionManager: React.FC<ColumnPositionManagerProps> = ({
  watch,
  setValue,
  currentColumn,
  existingColumns,
}) => {
  const currentPosition = watch('position') ?? (currentColumn?.position ?? 0);
  
  // Get sorted columns excluding the current one
  const otherColumns = existingColumns
    .filter(col => !currentColumn || col.id !== currentColumn.id)
    .sort((a, b) => a.position - b.position);

  const handlePositionChange = (newPosition: number) => {
    setValue('position', newPosition);
  };

  const handleMoveUp = () => {
    const newPos = currentPosition - 1;
    if (newPos >= 0) {
      handlePositionChange(newPos);
    }
  };

  const handleMoveDown = () => {
    const maxPosition = existingColumns.length - 1;
    const newPos = currentPosition + 1;
    if (newPos <= maxPosition) {
      handlePositionChange(newPos);
    }
  };

  // Calculate available positions
  const availablePositions = Array.from({ length: existingColumns.length }, (_, i) => i);

  return (
    <div className="space-y-2">
      <Label htmlFor="position">Column Position</Label>
      <div className="flex items-center gap-2">
        <Select
          value={String(currentPosition)}
          onValueChange={(value) => handlePositionChange(parseInt(value, 10))}
        >
          <SelectTrigger id="position" className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availablePositions.map((pos) => {
              const columnAtPosition = existingColumns.find(c => c.position === pos && (!currentColumn || c.id !== currentColumn.id));
              return (
                <SelectItem key={pos} value={String(pos)}>
                  Position {pos}
                  {columnAtPosition && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({columnAtPosition.name})
                    </span>
                  )}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMoveUp}
            disabled={currentPosition === 0}
            className="h-6 px-2"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMoveDown}
            disabled={currentPosition >= existingColumns.length - 1}
            className="h-6 px-2"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Lower positions appear first. Position {currentPosition} of {existingColumns.length - 1}
      </p>
    </div>
  );
};

