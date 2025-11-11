// Long text cell editor

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface LongTextCellEditorProps {
  value: unknown;
  onChange?: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  disableBlurSave?: boolean;
}

export const LongTextCellEditor: React.FC<LongTextCellEditorProps> = ({
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className="flex items-start gap-1">
      <Textarea
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onChange?.(e.target.value);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="h-20 text-sm"
        disabled={disabled}
      />
      <div className="flex flex-col gap-1">
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
    </div>
  );
};

