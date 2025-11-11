// Auto-number field component - read-only display

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Column } from '@/types/workspace';

interface AutoNumberFieldProps {
  column: Column;
  fieldName: string;
}

export const AutoNumberField: React.FC<AutoNumberFieldProps> = ({
  column,
  fieldName,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>{column.name}</Label>
      <Input
        id={fieldName}
        type="text"
        value="Auto-generated"
        disabled
        className="bg-slate-100 text-muted-foreground"
      />
      <p className="text-xs text-muted-foreground">
        This number will be automatically generated when the item is created.
      </p>
    </div>
  );
};

