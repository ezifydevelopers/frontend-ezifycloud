// Number cell editor

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { Column } from '@/types/workspace';

interface NumberCellEditorProps {
  column: Column;
  value: unknown;
  onChange?: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  disableBlurSave?: boolean;
}

export const NumberCellEditor: React.FC<NumberCellEditorProps> = ({
  column,
  value,
  onChange,
  onSave,
  onCancel,
  onKeyDown,
  disabled = false,
  disableBlurSave = false,
}) => {
  const [localValue, setLocalValue] = React.useState(String(value || ''));

  React.useEffect(() => {
    setLocalValue(String(value || ''));
  }, [value]);

  const handleBlur = React.useCallback(() => {
    if (!disableBlurSave) {
      onSave();
    }
  }, [onSave, disableBlurSave]);

  const numberSettings = column.settings as { numberType?: 'integer' | 'decimal' } | undefined;
  const isInteger = numberSettings?.numberType === 'integer';

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step={isInteger ? '1' : '0.01'}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onChange?.(e.target.value);
        }}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        autoFocus
        className="h-8 text-sm"
        disabled={disabled}
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={onSave}
        disabled={disabled}
      >
        <Check className="h-3 w-3 text-green-600" />
      </Button>
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

