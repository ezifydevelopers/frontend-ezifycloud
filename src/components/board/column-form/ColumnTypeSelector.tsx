// Column type selector component

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColumnType } from '@/types/workspace';

const COLUMN_TYPES: { value: ColumnType; label: string; description: string }[] = [
  { value: 'TEXT', label: 'Text', description: 'Single-line text field' },
  { value: 'LONG_TEXT', label: 'Long Text', description: 'Multi-line text field' },
  { value: 'EMAIL', label: 'Email', description: 'Email address field' },
  { value: 'PHONE', label: 'Phone', description: 'Phone number field' },
  { value: 'NUMBER', label: 'Number', description: 'Numeric value (integer or decimal)' },
  { value: 'CURRENCY', label: 'Currency', description: 'Money amount with currency selector' },
  { value: 'PERCENTAGE', label: 'Percentage', description: 'Percentage value (0-100)' },
  { value: 'DATE', label: 'Date', description: 'Date picker' },
  { value: 'DATETIME', label: 'Date & Time', description: 'Date and time picker' },
  { value: 'WEEK', label: 'Week', description: 'Week picker' },
  { value: 'MONTH', label: 'Month', description: 'Month picker' },
  { value: 'YEAR', label: 'Year', description: 'Year picker' },
  { value: 'CHECKBOX', label: 'Checkbox', description: 'Yes/No toggle' },
  { value: 'DROPDOWN', label: 'Dropdown', description: 'Single selection from options' },
  { value: 'MULTI_SELECT', label: 'Multi-Select', description: 'Multiple selections (tags)' },
  { value: 'RADIO', label: 'Radio Buttons', description: 'Single choice from radio buttons' },
  { value: 'STATUS', label: 'Status', description: 'Color-coded status' },
  { value: 'PEOPLE', label: 'People', description: 'Assign to users' },
  { value: 'FILE', label: 'File', description: 'File upload' },
  { value: 'LINK', label: 'Link', description: 'URL link' },
  { value: 'AUTO_NUMBER', label: 'Auto-Number', description: 'Auto-incrementing number' },
  { value: 'RATING', label: 'Rating', description: 'Star rating (1-5)' },
  { value: 'VOTE', label: 'Vote', description: 'Thumbs up/down' },
  { value: 'TIMELINE', label: 'Timeline', description: 'Date range' },
  { value: 'FORMULA', label: 'Formula', description: 'Calculated value' },
  { value: 'PROGRESS', label: 'Progress Bar', description: 'Visual progress indicator (0-100%)' },
  { value: 'LOCATION', label: 'Location', description: 'Map picker for location' },
  { value: 'MIRROR', label: 'Mirror Column', description: 'Mirror data from linked board' },
];

interface ColumnTypeSelectorProps {
  value: ColumnType;
  onValueChange: (value: ColumnType) => void;
  disabled?: boolean;
  error?: string;
}

export const ColumnTypeSelector: React.FC<ColumnTypeSelectorProps> = ({
  value,
  onValueChange,
  disabled = false,
  error,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="type">
        Column Type <span className="text-destructive">*</span>
      </Label>
      <Select
        value={value}
        onValueChange={(val) => onValueChange(val as ColumnType)}
        disabled={disabled}
      >
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COLUMN_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div>
                <div className="font-medium">{type.label}</div>
                <div className="text-xs text-muted-foreground">{type.description}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {disabled && (
        <p className="text-xs text-muted-foreground">
          Column type cannot be changed after creation
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export { COLUMN_TYPES };

