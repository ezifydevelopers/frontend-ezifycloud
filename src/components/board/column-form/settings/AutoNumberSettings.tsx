// Auto-number settings component - Configure invoice numbering format

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Info } from 'lucide-react';
import { Column } from '@/types/workspace';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AutoNumberSettingsProps {
  column: Column;
  settings: {
    format?: string; // Format template like "INV-{number}" or "{prefix}-{number}-{suffix}"
    prefix?: string;
    suffix?: string;
    startNumber?: number;
    numberPadding?: number; // Zero padding (e.g., 5 for 00001)
    resetOn?: 'never' | 'month' | 'year'; // When to reset counter
  };
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

export const AutoNumberSettings: React.FC<AutoNumberSettingsProps> = ({
  column,
  settings,
  onSettingsChange,
}) => {
  const {
    format = '{number}',
    prefix = '',
    suffix = '',
    startNumber = 1,
    numberPadding = 0,
    resetOn = 'never',
  } = settings;

  const updateSetting = (key: string, value: unknown) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  // Generate preview of next number
  const generatePreview = (): string => {
    let previewNumber = startNumber;
    
    // Apply padding
    const paddedNumber = numberPadding > 0
      ? String(previewNumber).padStart(numberPadding, '0')
      : String(previewNumber);

    // Build format
    let result = format
      .replace(/{prefix}/g, prefix || '')
      .replace(/{number}/g, paddedNumber)
      .replace(/{suffix}/g, suffix || '')
      .replace(/{date:YYYY}/g, new Date().getFullYear().toString())
      .replace(/{date:MM}/g, String(new Date().getMonth() + 1).padStart(2, '0'))
      .replace(/{date:DD}/g, String(new Date().getDate()).padStart(2, '0'))
      .replace(/{date:YY}/g, String(new Date().getFullYear()).slice(-2));

    return result || previewNumber;
  };

  const preview = generatePreview();

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure how invoice numbers are automatically generated for this column.
        </AlertDescription>
      </Alert>

      {/* Format Template */}
      <div className="space-y-2">
        <Label htmlFor="format">Number Format Template</Label>
        <Input
          id="format"
          placeholder="e.g., INV-{number} or {prefix}-{number}-{suffix}"
          value={format}
          onChange={(e) => updateSetting('format', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Use placeholders: {'{'}number{'}'}, {'{'}prefix{'}'}, {'{'}suffix{'}'}, {'{'}date:YYYY{'}'}, {'{'}date:MM{'}'}, {'{'}date:DD{'}'}, {'{'}date:YY{'}'}
        </p>
      </div>

      {/* Prefix */}
      <div className="space-y-2">
        <Label htmlFor="prefix">Prefix (Optional)</Label>
        <Input
          id="prefix"
          placeholder="e.g., INV, INVOICE, etc."
          value={prefix}
          onChange={(e) => updateSetting('prefix', e.target.value)}
          maxLength={20}
        />
        <p className="text-xs text-muted-foreground">
          Fixed text that appears before the number
        </p>
      </div>

      {/* Suffix */}
      <div className="space-y-2">
        <Label htmlFor="suffix">Suffix (Optional)</Label>
        <Input
          id="suffix"
          placeholder="e.g., -2024, -A, etc."
          value={suffix}
          onChange={(e) => updateSetting('suffix', e.target.value)}
          maxLength={20}
        />
        <p className="text-xs text-muted-foreground">
          Fixed text that appears after the number
        </p>
      </div>

      {/* Start Number */}
      <div className="space-y-2">
        <Label htmlFor="startNumber">Starting Number</Label>
        <Input
          id="startNumber"
          type="number"
          min="1"
          value={startNumber}
          onChange={(e) => updateSetting('startNumber', parseInt(e.target.value, 10) || 1)}
        />
        <p className="text-xs text-muted-foreground">
          The number to start counting from (will be used if no items exist yet)
        </p>
      </div>

      {/* Number Padding */}
      <div className="space-y-2">
        <Label htmlFor="numberPadding">Zero Padding</Label>
        <Input
          id="numberPadding"
          type="number"
          min="0"
          max="10"
          value={numberPadding}
          onChange={(e) => updateSetting('numberPadding', parseInt(e.target.value, 10) || 0)}
        />
        <p className="text-xs text-muted-foreground">
          Number of leading zeros (e.g., 5 for 00001, 00002, etc.)
        </p>
      </div>

      {/* Reset Counter */}
      <div className="space-y-2">
        <Label htmlFor="resetOn">Reset Counter</Label>
        <Select
          value={resetOn}
          onValueChange={(value) => updateSetting('resetOn', value)}
        >
          <SelectTrigger id="resetOn">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never (Continuous)</SelectItem>
            <SelectItem value="month">Every Month</SelectItem>
            <SelectItem value="year">Every Year</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          When to reset the counter back to the starting number
        </p>
      </div>

      {/* Preview */}
      <div className="p-3 bg-slate-50 rounded-lg border">
        <Label className="text-sm font-medium">Preview</Label>
        <p className="text-lg font-mono mt-2 text-primary">{preview}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Example of how the next invoice number will look
        </p>
      </div>
    </div>
  );
};

