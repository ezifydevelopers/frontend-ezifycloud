// Payment tracking cell renderer - Display payment status and summary

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PaymentTracking, PaymentStatus, PAYMENT_STATUS_OPTIONS } from '@/types/payment';

interface PaymentTrackingCellProps {
  value: unknown;
  onClick: () => void;
  currency?: string;
}

export const PaymentTrackingCell: React.FC<PaymentTrackingCellProps> = ({
  value,
  onClick,
  currency = 'USD',
}) => {
  const tracking = value as PaymentTracking | null;

  if (!tracking) {
    return (
      <span
        className="text-muted-foreground cursor-pointer hover:bg-slate-100 px-2 py-1 rounded text-sm"
        onClick={onClick}
        title="Click to manage payments"
      >
        No payments
      </span>
    );
  }

  const currencySymbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹',
    AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CHF: 'CHF',
    NZD: 'NZ$', BRL: 'R$', MXN: '$', ZAR: 'R',
  };
  const symbol = currencySymbols[currency] || currency;

  const statusOption = PAYMENT_STATUS_OPTIONS.find(s => s.value === tracking.status);
  const paymentCount = tracking.payments?.length || 0;

  return (
    <div
      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to manage payments"
    >
      <div className="flex items-center gap-2 flex-wrap">
        {statusOption && (
          <Badge
            variant="outline"
            style={{
              backgroundColor: `${statusOption.color}20`,
              borderColor: statusOption.color,
              color: statusOption.color,
            }}
          >
            {statusOption.label}
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          {paymentCount > 0 && `${paymentCount} payment${paymentCount > 1 ? 's' : ''} • `}
          {symbol}{tracking.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {symbol}{tracking.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};

