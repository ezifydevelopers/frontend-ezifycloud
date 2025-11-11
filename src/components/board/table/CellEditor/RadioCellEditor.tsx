// Radio cell editor

import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Column } from '@/types/workspace';

interface RadioCellEditorProps {
  column: Column;
  value: unknown;
  onChange?: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const RadioCellEditor: React.FC<RadioCellEditorProps> = ({
  column,
  value,
  onChange,
  onSave,
  onCancel,
  disabled = false,
}) => {
  const radioOptions = (column.settings as { options?: string[] })?.options || [];

  return (
    <div className="flex items-start gap-2 py-1">
      <RadioGroup
        value={String(value || '')}
        onValueChange={(val) => {
          onChange?.(val);
          onSave();
        }}
        disabled={disabled}
        className="flex flex-col gap-2"
      >
        {radioOptions.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`radio-${column.id}-${option}`} />
            <Label 
              htmlFor={`radio-${column.id}-${option}`} 
              className="text-sm font-normal cursor-pointer"
            >
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
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

