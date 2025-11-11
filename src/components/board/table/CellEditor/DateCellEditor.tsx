// Date cell editor (for DATE, DATETIME, WEEK, MONTH, YEAR types)

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { ColumnType } from '@/types/workspace';

interface DateCellEditorProps {
  type: ColumnType;
  value: unknown;
  onChange?: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  disableBlurSave?: boolean;
}

export const DateCellEditor: React.FC<DateCellEditorProps> = ({
  type,
  value,
  onChange,
  onSave,
  onCancel,
  onKeyDown,
  disabled = false,
  disableBlurSave = false,
}) => {
  let inputType: string;
  switch (type) {
    case 'DATE':
      inputType = 'date';
      break;
    case 'DATETIME':
      inputType = 'datetime-local';
      break;
    case 'WEEK':
      inputType = 'week';
      break;
    case 'MONTH':
      inputType = 'month';
      break;
    case 'YEAR':
      inputType = 'number';
      break;
    default:
      inputType = 'date';
  }

  const [localValue, setLocalValue] = React.useState(String(value || ''));

  React.useEffect(() => {
    setLocalValue(String(value || ''));
  }, [value]);

  const handleBlur = React.useCallback(() => {
    if (!disableBlurSave) {
      onSave();
    }
  }, [onSave, disableBlurSave]);

  if (type === 'YEAR') {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min="1900"
          max="2100"
          placeholder="YYYY"
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
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type={inputType}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onChange?.(e.target.value);
        }}
        onBlur={onSave}
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

