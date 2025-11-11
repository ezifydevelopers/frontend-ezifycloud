// Progress cell editor - slider input

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';

interface ProgressCellEditorProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const ProgressCellEditor: React.FC<ProgressCellEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
}) => {
  const progressValue = typeof value === 'number' 
    ? Math.min(100, Math.max(0, value))
    : typeof value === 'string'
    ? Math.min(100, Math.max(0, parseFloat(value) || 0))
    : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
    onChange(newValue);
  };

  const handleBlur = () => {
    onSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 min-w-[200px]">
      <Input
        type="number"
        min="0"
        max="100"
        step="1"
        value={progressValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-20"
        autoFocus
      />
      <div className="flex-1 min-w-[100px]">
        <Progress value={progressValue} className="h-2" />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="h-6 w-6 p-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

