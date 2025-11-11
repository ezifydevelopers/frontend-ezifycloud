// Payment tracking cell editor

import React, { useState, useEffect } from 'react';
import { PaymentTrackingEditor } from '@/components/board/payment/PaymentTrackingEditor';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { PaymentTracking } from '@/types/payment';

interface PaymentTrackingCellEditorProps {
  value: unknown;
  onChange: (value: PaymentTracking) => void;
  onClose: () => void;
  currency?: string;
  totalAmount?: number; // Invoice total amount for initializing tracking
}

export const PaymentTrackingCellEditor: React.FC<PaymentTrackingCellEditorProps> = ({
  value,
  onChange,
  onClose,
  currency = 'USD',
  totalAmount,
}) => {
  const [tracking, setTracking] = useState<PaymentTracking | null>(
    value as PaymentTracking | null || null
  );

  useEffect(() => {
    // Initialize tracking if it doesn't exist and we have a total amount
    if (!tracking && totalAmount !== undefined && totalAmount > 0) {
      setTracking({
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        payments: [],
        status: 'pending',
        currency,
      });
    } else if (value && typeof value === 'object' && 'payments' in value) {
      const trackingValue = value as PaymentTracking;
      // Update totalAmount if provided and different
      if (totalAmount !== undefined && totalAmount !== trackingValue.totalAmount) {
        setTracking({
          ...trackingValue,
          totalAmount,
          remainingAmount: totalAmount - trackingValue.paidAmount,
        });
      } else {
        setTracking(trackingValue);
      }
    } else if (value === null || value === undefined) {
      // Initialize with totalAmount if available
      setTracking({
        totalAmount: totalAmount || 0,
        paidAmount: 0,
        remainingAmount: totalAmount || 0,
        payments: [],
        status: 'pending',
        currency,
      });
    }
  }, [value, totalAmount, currency]);

  const handleSave = () => {
    if (tracking) {
      onChange(tracking);
    }
    onClose();
  };

  if (!tracking) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-4 w-[900px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <div className="text-center p-8">
          <p className="text-muted-foreground">Payment tracking requires a total invoice amount.</p>
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border rounded-lg shadow-lg p-4 w-[900px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Payment Tracking</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <PaymentTrackingEditor
        value={tracking}
        onChange={(updated) => {
          setTracking(updated);
          onChange(updated);
        }}
        currency={currency}
      />

      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={handleSave}>
          Done
        </Button>
      </div>
    </div>
  );
};

