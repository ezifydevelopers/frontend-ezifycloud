// Currency cell renderer

import React from 'react';
import { Column } from '@/types/workspace';

interface CurrencyCellProps {
  value: unknown;
  column: Column;
  onClick: () => void;
}

export const CurrencyCell: React.FC<CurrencyCellProps> = ({ value, column, onClick }) => {
  const currencySettings = column.settings as { currency?: string } | undefined;
  const currency = currencySettings?.currency || 'USD';
  const currencyValue = value ? Number(value) : null;
  
  const currencySymbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹',
    AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CHF: 'CHF',
    NZD: 'NZ$', BRL: 'R$', MXN: '$', ZAR: 'R'
  };
  const symbol = currencySymbols[currency] || currency;
  
  return (
    <span 
      className="font-medium cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to edit"
    >
      {currencyValue !== null 
        ? `${symbol}${currencyValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : '—'}
    </span>
  );
};

