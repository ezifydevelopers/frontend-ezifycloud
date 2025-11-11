// Line items cell renderer

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { LineItem } from '@/components/board/invoice/LineItemsEditor';

interface LineItemsCellProps {
  value: unknown;
  onClick: () => void;
  currency?: string;
}

export const LineItemsCell: React.FC<LineItemsCellProps> = ({
  value,
  onClick,
  currency = 'USD',
}) => {
  const items = Array.isArray(value) ? (value as LineItem[]) : [];

  if (items.length === 0) {
    return (
      <span
        className="text-muted-foreground cursor-pointer hover:bg-slate-100 px-2 py-1 rounded text-sm"
        onClick={onClick}
        title="Click to edit line items"
      >
        No items
      </span>
    );
  }

  const currencySymbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹',
    AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CHF: 'CHF',
    NZD: 'NZ$', BRL: 'R$', MXN: '$', ZAR: 'R',
  };
  const symbol = currencySymbols[currency] || currency;

  const total = items.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <div
      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to edit line items"
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline">{items.length} items</Badge>
        <span className="text-sm font-medium">
          {symbol}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};

