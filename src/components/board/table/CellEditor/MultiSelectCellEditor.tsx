// Multi-select cell editor

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Column } from '@/types/workspace';

interface MultiSelectCellEditorProps {
  column: Column;
  value: unknown;
  onChange?: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const MultiSelectCellEditor: React.FC<MultiSelectCellEditorProps> = ({
  column,
  value,
  onChange,
  onSave,
  onCancel,
  disabled = false,
}) => {
  const multiOptions = (column.settings as { options?: string[] })?.options || [];
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div className="flex items-center gap-1">
      <Select
        value=""
        onValueChange={(val) => {
          const newValues = selectedValues.includes(val)
            ? selectedValues.filter(v => v !== val)
            : [...selectedValues, val];
          onChange?.(newValues);
          onSave();
        }}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 text-sm min-w-[150px]">
          <SelectValue placeholder={selectedValues.length > 0 ? `${selectedValues.length} selected` : 'Select options'} />
        </SelectTrigger>
        <SelectContent>
          {multiOptions.map((option) => (
            <SelectItem 
              key={option} 
              value={option}
              className={selectedValues.includes(option) ? 'bg-blue-50' : ''}
            >
              <div className="flex items-center gap-2">
                <Checkbox checked={selectedValues.includes(option)} />
                {option}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={onCancel}
        disabled={disabled}
      >
        <X className="h-3 w-3 text-red-600" />
      </Button>
    </div>
  );
};

