// Checkbox cell editor

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CheckboxCellEditorProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const CheckboxCellEditor: React.FC<CheckboxCellEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-1">
      <Checkbox
        checked={Boolean(value)}
        onCheckedChange={(checked) => {
          onChange?.(checked);
          onSave();
        }}
        disabled={disabled}
      />
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

