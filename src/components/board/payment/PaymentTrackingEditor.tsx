// Payment Tracking Editor Component - Manage payments for an invoice

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Payment, PaymentTracking, PaymentStatus, PaymentMethod, PAYMENT_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/types/payment';

interface PaymentTrackingEditorProps {
  value: PaymentTracking | null;
  onChange: (tracking: PaymentTracking) => void;
  currency?: string;
  readOnly?: boolean;
}

export const PaymentTrackingEditor: React.FC<PaymentTrackingEditorProps> = ({
  value,
  onChange,
  currency = 'USD',
  readOnly = false,
}) => {
  const [tracking, setTracking] = useState<PaymentTracking>(() => 
    value || {
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      payments: [],
      status: 'pending',
      currency,
    }
  );
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (value) {
      setTracking(value);
    } else {
      // Initialize with empty tracking
      setTracking({
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        payments: [],
        status: 'pending',
        currency,
      });
    }
  }, [value, currency]);

  // Update totalAmount if it changes externally
  useEffect(() => {
    if (tracking && tracking.totalAmount === 0 && tracking.payments.length === 0) {
      // Only update if tracking is empty
      // Total amount will be set by parent component or user input
    }
  }, [tracking]);

  const currencySymbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹',
    AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CHF: 'CHF',
    NZD: 'NZ$', BRL: 'R$', MXN: '$', ZAR: 'R',
  };
  const symbol = currencySymbols[currency] || currency;

  const calculateTracking = (payments: Payment[], newTotalAmount?: number): PaymentTracking => {
    const totalAmount = newTotalAmount ?? tracking.totalAmount;
    const paidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remainingAmount = totalAmount - paidAmount;
    
    // Determine status
    let status: PaymentStatus = 'pending';
    if (totalAmount > 0) {
      if (paidAmount >= totalAmount) {
        status = 'paid';
      } else if (paidAmount > 0) {
        status = 'partial';
      } else {
        status = 'pending';
      }
    }

    const lastPayment = payments
      .filter(p => p.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      payments,
      status,
      lastPaymentDate: lastPayment?.date,
      currency: tracking.currency,
    };
  };

  const handleAddPayment = () => {
    const newPayment: Payment = {
      id: `payment-${Date.now()}`,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      method: 'bank_transfer',
      referenceNumber: '',
      status: 'pending',
      currency,
    };
    setEditingPayment(newPayment);
    setIsDialogOpen(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment({ ...payment });
    setIsDialogOpen(true);
  };

  const handleSavePayment = () => {
    if (!editingPayment) return;

    const updatedPayments = editingPayment.id && tracking.payments.find(p => p.id === editingPayment.id)
      ? tracking.payments.map(p => p.id === editingPayment.id ? editingPayment : p)
      : [...tracking.payments, editingPayment];

    const updatedTracking = calculateTracking(updatedPayments);
    setTracking(updatedTracking);
    onChange(updatedTracking);
    setIsDialogOpen(false);
    setEditingPayment(null);
  };

  // Allow manual total amount update
  const handleTotalAmountUpdate = (newTotal: number) => {
    const updatedTracking = calculateTracking(tracking.payments, newTotal);
    setTracking(updatedTracking);
    onChange(updatedTracking);
  };

  const handleDeletePayment = (paymentId: string) => {
    const updatedPayments = tracking.payments.filter(p => p.id !== paymentId);
    const updatedTracking = calculateTracking(updatedPayments);
    setTracking(updatedTracking);
    onChange(updatedTracking);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const statusOption = PAYMENT_STATUS_OPTIONS.find(s => s.value === status);
    if (!statusOption) return null;
    
    return (
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
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Payment Tracking</Label>
        {!readOnly && (
          <Button type="button" size="sm" onClick={handleAddPayment}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        )}
      </div>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {!readOnly && tracking.totalAmount === 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Label className="text-sm font-medium text-yellow-800 mb-2 block">
                Set Invoice Total Amount
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter total invoice amount"
                onBlur={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  if (amount > 0) {
                    handleTotalAmountUpdate(amount);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const amount = parseFloat((e.target as HTMLInputElement).value) || 0;
                    if (amount > 0) {
                      handleTotalAmountUpdate(amount);
                    }
                  }
                }}
              />
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Total Amount</Label>
              <p className="text-lg font-semibold">
                {symbol}{tracking.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Paid Amount</Label>
              <p className="text-lg font-semibold text-green-600">
                {symbol}{tracking.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Remaining</Label>
              <p className={`text-lg font-semibold ${tracking.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {symbol}{tracking.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Payment Status:</Label>
              {getStatusBadge(tracking.status)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      {tracking.payments.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <p>No payments recorded yet.</p>
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={handleAddPayment}>
              <Plus className="h-4 w-4 mr-2" />
              Record First Payment
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                {!readOnly && <TableHead className="w-[100px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracking.payments
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell className="font-semibold">
                      {symbol}{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {PAYMENT_METHOD_OPTIONS.find(m => m.value === payment.method)?.label || payment.method}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.referenceNumber || '—'}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    {!readOnly && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPayment(payment)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPayment?.id && tracking.payments.find(p => p.id === editingPayment.id)
                ? 'Edit Payment'
                : 'Record Payment'}
            </DialogTitle>
            <DialogDescription>
              Record a payment for this invoice
            </DialogDescription>
          </DialogHeader>

          {editingPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={editingPayment.date}
                    onChange={(e) => setEditingPayment({ ...editingPayment, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Amount ({currency}) *</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPayment.amount}
                    onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0;
                      setEditingPayment({ ...editingPayment, amount });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={editingPayment.method}
                    onValueChange={(value: PaymentMethod) =>
                      setEditingPayment({ ...editingPayment, method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={editingPayment.status}
                    onValueChange={(value: PaymentStatus) =>
                      setEditingPayment({ ...editingPayment, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  value={editingPayment.referenceNumber || ''}
                  onChange={(e) =>
                    setEditingPayment({ ...editingPayment, referenceNumber: e.target.value })
                  }
                  placeholder="Transaction ID, Check #, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentNotes">Notes</Label>
                <Textarea
                  id="paymentNotes"
                  value={editingPayment.notes || ''}
                  onChange={(e) =>
                    setEditingPayment({ ...editingPayment, notes: e.target.value })
                  }
                  placeholder="Additional payment details..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePayment}
                  disabled={!editingPayment.date || editingPayment.amount <= 0 || !editingPayment.method}
                >
                  Save Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

