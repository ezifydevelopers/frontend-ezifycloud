// Dropdown/Status cell editor

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Column } from '@/types/workspace';

interface DropdownCellEditorProps {
  column: Column;
  value: unknown;
  onChange?: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const DropdownCellEditor: React.FC<DropdownCellEditorProps> = ({
  column,
  value,
  onChange,
  onSave,
  onCancel,
  disabled = false,
}) => {
  const settings = column.settings as { 
    options?: Array<{ label: string; color?: string }> | string[];
    statusColors?: Record<string, string>;
  } | undefined;
  
  const options = settings?.options || [];
  
  // Helper to get option label and color
  const getOptionData = (option: string | { label: string; color?: string }) => {
    if (typeof option === 'object' && 'label' in option) {
      return { label: option.label, color: option.color };
    }
    return { label: String(option), color: undefined };
  };

  return (
    <div className="flex items-center gap-1">
      <Select
        value={String(value || '')}
        onValueChange={(val) => {
          onChange?.(val);
          onSave();
        }}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options
            .filter(option => {
              const data = getOptionData(option);
              return data.label && data.label.trim() !== '';
            })
            .map((option) => {
              const { label, color } = getOptionData(option);
              const optionValue = typeof option === 'object' ? label : String(option);
              
              return (
                <SelectItem key={optionValue} value={optionValue}>
                  <div className="flex items-center gap-2">
                    {color && (
                      <span 
                        className="w-3 h-3 rounded-full border border-slate-300"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              );
            })}
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

