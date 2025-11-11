// Line items cell editor

import React, { useState, useEffect } from 'react';
import { LineItemsEditor, LineItem } from '@/components/board/invoice/LineItemsEditor';
import { InvoiceCalculations, InvoiceCalculationConfig, InvoiceCalculationResult } from '@/components/board/invoice/InvoiceCalculations';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { calculateInvoiceTotal } from '@/lib/api/invoiceAPI';

interface LineItemsCellEditorProps {
  value: unknown;
  onChange: (value: LineItem[]) => void;
  onClose: () => void;
  currency?: string;
  columnId?: string;
}

export const LineItemsCellEditor: React.FC<LineItemsCellEditorProps> = ({
  value,
  onChange,
  onClose,
  currency = 'USD',
  columnId,
}) => {
  const [lineItems, setLineItems] = useState<LineItem[]>(
    Array.isArray(value) ? (value as LineItem[]) : []
  );
  const [calculationConfig, setCalculationConfig] = useState<InvoiceCalculationConfig>({
    taxType: 'percentage',
    taxValue: 0,
    discountType: 'percentage',
    discountValue: 0,
    currency,
    baseCurrency: currency,
    exchangeRate: 1,
  });
  const [calculationResult, setCalculationResult] = useState<InvoiceCalculationResult>({
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    currency,
  });

  useEffect(() => {
    // Calculate totals when line items or config change
    const calculate = async () => {
      try {
        const result = await calculateInvoiceTotal(lineItems, calculationConfig);
        setCalculationResult(result);
      } catch (error) {
        console.error('Error calculating invoice total:', error);
      }
    };
    calculate();
  }, [lineItems, calculationConfig]);

  const handleSave = () => {
    onChange(lineItems);
    onClose();
  };

  return (
    <div className="bg-background border rounded-lg shadow-lg p-4 w-[800px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Edit Line Items</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        <LineItemsEditor
          value={lineItems}
          onChange={setLineItems}
          currency={currency}
        />

        <InvoiceCalculations
          lineItems={lineItems}
          config={calculationConfig}
          onConfigChange={setCalculationConfig}
          result={calculationResult}
        />

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

