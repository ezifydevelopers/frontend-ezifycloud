// Payment tracking types

export type PaymentStatus = 
  | 'pending'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'check'
  | 'cash'
  | 'paypal'
  | 'stripe'
  | 'wire_transfer'
  | 'other';

export interface Payment {
  id: string;
  amount: number;
  date: string; // ISO date string
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  status: PaymentStatus;
  currency?: string;
}

export interface PaymentTracking {
  totalAmount: number; // Total invoice amount
  paidAmount: number; // Sum of all payments
  remainingAmount: number; // Total - Paid
  payments: Payment[];
  status: PaymentStatus;
  lastPaymentDate?: string;
  currency: string;
}

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#fbbf24' },
  { value: 'partial', label: 'Partial', color: '#3b82f6' },
  { value: 'paid', label: 'Paid', color: '#10b981' },
  { value: 'overdue', label: 'Overdue', color: '#ef4444' },
  { value: 'failed', label: 'Failed', color: '#dc2626' },
  { value: 'refunded', label: 'Refunded', color: '#8b5cf6' },
  { value: 'cancelled', label: 'Cancelled', color: '#6b7280' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'wire_transfer', label: 'Wire Transfer' },
  { value: 'other', label: 'Other' },
];

