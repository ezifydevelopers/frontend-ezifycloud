// Text cell editor

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface TextCellEditorProps {
  value: unknown;
  onChange?: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  disableBlurSave?: boolean; // Option to disable auto-save on blur
}

export const TextCellEditor: React.FC<TextCellEditorProps> = ({
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

  const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Only save on blur if not disabled (for quick create, we don't want auto-close)
    if (!disableBlurSave) {
      onSave();
    }
  }, [onSave, disableBlurSave]);

  return (
    <div className="flex items-center gap-1">
      <Input
        type="text"
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

