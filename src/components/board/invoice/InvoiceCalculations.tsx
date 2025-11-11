// Invoice Calculations Component - Manage subtotal, tax, discount, and total

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, RefreshCw } from 'lucide-react';
import { LineItem } from './LineItemsEditor';

export interface InvoiceCalculationConfig {
  taxType: 'percentage' | 'flat';
  taxValue: number;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  currency: string;
  baseCurrency?: string;
  exchangeRate?: number;
}

export interface InvoiceCalculationResult {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
}

interface InvoiceCalculationsProps {
  lineItems: LineItem[];
  config: InvoiceCalculationConfig;
  onConfigChange: (config: InvoiceCalculationConfig) => void;
  result: InvoiceCalculationResult;
  readOnly?: boolean;
}

export const InvoiceCalculations: React.FC<InvoiceCalculationsProps> = ({
  lineItems,
  config,
  onConfigChange,
  result,
  readOnly = false,
}) => {
  const currencySymbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹',
    AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CHF: 'CHF',
    NZD: 'NZ$', BRL: 'R$', MXN: '$', ZAR: 'R',
  };
  const symbol = currencySymbols[config.currency] || config.currency;

  const updateConfig = (updates: Partial<InvoiceCalculationConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Invoice Calculations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calculation Configuration */}
        {!readOnly && (
          <div className="space-y-4">
            {/* Tax Configuration */}
            <div className="space-y-2">
              <Label>Tax</Label>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={config.taxType}
                  onValueChange={(value: 'percentage' | 'flat') => updateConfig({ taxType: value, taxValue: 0 })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Flat Amount</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  step={config.taxType === 'percentage' ? '0.01' : '0.01'}
                  value={config.taxValue}
                  onChange={(e) => updateConfig({ taxValue: parseFloat(e.target.value) || 0 })}
                  placeholder={config.taxType === 'percentage' ? 'Tax %' : 'Tax amount'}
                  suffix={config.taxType === 'percentage' ? '%' : symbol}
                />
              </div>
            </div>

            {/* Discount Configuration */}
            <div className="space-y-2">
              <Label>Discount</Label>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={config.discountType}
                  onValueChange={(value: 'percentage' | 'flat') => updateConfig({ discountType: value, discountValue: 0 })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Flat Amount</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  step={config.discountType === 'percentage' ? '0.01' : '0.01'}
                  value={config.discountValue}
                  onChange={(e) => updateConfig({ discountValue: parseFloat(e.target.value) || 0 })}
                  placeholder={config.discountType === 'percentage' ? 'Discount %' : 'Discount amount'}
                  suffix={config.discountType === 'percentage' ? '%' : symbol}
                />
              </div>
            </div>

            {/* Currency Conversion */}
            {config.baseCurrency && config.baseCurrency !== config.currency && (
              <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label>Currency Conversion</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{config.baseCurrency}</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="outline">{config.currency}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Rate: {config.exchangeRate || 1}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calculation Results */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({lineItems.length} items):</span>
            <span className="font-medium">
              {symbol}{result.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {result.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Tax ({config.taxType === 'percentage' ? `${config.taxValue}%` : 'Flat'}):
              </span>
              <span className="font-medium">
                {symbol}{result.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {result.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Discount ({config.discountType === 'percentage' ? `${config.discountValue}%` : 'Flat'}):
              </span>
              <span className="font-medium text-green-600">
                - {symbol}{result.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t font-bold text-lg">
            <span>Total Amount:</span>
            <span className="text-primary">
              {symbol}{result.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

