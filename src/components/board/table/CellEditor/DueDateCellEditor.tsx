// Due date cell editor with automatic calculation

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Calculator } from 'lucide-react';
import { calculateDueDate, PaymentTermsConfig, PAYMENT_TERMS_OPTIONS } from '@/utils/dueDateUtils';
import { Item, Column } from '@/types/workspace';
import { getCellValue } from '../utils/tableUtils';

interface DueDateCellEditorProps {
  value: unknown;
  onChange: (value: string | null) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  item?: Item;
  columns?: Column[];
  column?: Column;
}

export const DueDateCellEditor: React.FC<DueDateCellEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  onKeyDown,
  disabled = false,
  item,
  columns = [],
  column,
}) => {
  const [dateValue, setDateValue] = useState<string>(
    value ? (typeof value === 'string' ? value : new Date(value as string).toISOString().split('T')[0]) : ''
  );
  const [autoCalculate, setAutoCalculate] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermsConfig>({
    type: 'net_30',
    days: 30,
  });

  // Try to find invoice date column
  const invoiceDateColumn = columns.find(c => {
    const name = c.name.toLowerCase();
    return name.includes('invoice date') || name.includes('issue date') || name.includes('date issued');
  });

  const issueDate = invoiceDateColumn && item?.cells?.[invoiceDateColumn.id]
    ? String(getCellValue(item, invoiceDateColumn.id))
    : null;

  useEffect(() => {
    if (autoCalculate && issueDate) {
      const calculated = calculateDueDate(issueDate, paymentTerms);
      if (calculated) {
        setDateValue(calculated);
        onChange(calculated);
      }
    }
  }, [autoCalculate, issueDate, paymentTerms]);

  const handleDateChange = (newValue: string) => {
    setDateValue(newValue);
    onChange(newValue || null);
  };

  const handleTermsChange = (type: string, days?: number) => {
    const newTerms: PaymentTermsConfig = {
      type: type as PaymentTermsConfig['type'],
      days: days || (type === 'net_15' ? 15 : type === 'net_30' ? 30 : type === 'net_45' ? 45 : type === 'net_60' ? 60 : 30),
    };
    setPaymentTerms(newTerms);
    
    if (autoCalculate && issueDate) {
      const calculated = calculateDueDate(issueDate, newTerms);
      if (calculated) {
        setDateValue(calculated);
        onChange(calculated);
      }
    }
  };

  const handleCalculate = () => {
    if (issueDate) {
      const calculated = calculateDueDate(issueDate, paymentTerms);
      if (calculated) {
        setDateValue(calculated);
        onChange(calculated);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-background border rounded shadow-lg min-w-[300px]">
      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={dateValue}
          onChange={(e) => handleDateChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSave();
            } else if (e.key === 'Escape') {
              onCancel();
            }
            onKeyDown?.(e);
          }}
          disabled={disabled}
          className="w-full"
        />
      </div>

      {/* Auto-calculation section */}
      {issueDate && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoCalculate"
              checked={autoCalculate}
              onCheckedChange={(checked) => setAutoCalculate(checked as boolean)}
            />
            <Label htmlFor="autoCalculate" className="text-sm">
              Auto-calculate from invoice date
            </Label>
          </div>

          {autoCalculate && (
            <div className="space-y-2 pl-6">
              <div className="space-y-1">
                <Label htmlFor="paymentTerms" className="text-xs">Payment Terms</Label>
                <Select
                  value={paymentTerms.type}
                  onValueChange={(value) => handleTermsChange(value)}
                >
                  <SelectTrigger id="paymentTerms" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {paymentTerms.type === 'custom' && (
                <div className="space-y-1">
                  <Label htmlFor="customDays" className="text-xs">Days</Label>
                  <Input
                    id="customDays"
                    type="number"
                    min="1"
                    value={paymentTerms.days || 30}
                    onChange={(e) => {
                      const days = parseInt(e.target.value, 10);
                      handleTermsChange('custom', days);
                    }}
                    className="h-8"
                  />
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Invoice Date: {new Date(issueDate).toLocaleDateString()}
              </div>
            </div>
          )}

          {!autoCalculate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCalculate}
              className="w-full"
            >
              <Calculator className="h-3 w-3 mr-2" />
              Calculate from Invoice Date
            </Button>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={disabled}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={disabled}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

