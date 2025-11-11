// Invoice-specific API endpoints

import { apiRequest } from './base';
import { ApiResponse } from '../../types/api';
import { LineItem } from '@/components/board/invoice/LineItemsEditor';
import { InvoiceCalculationConfig, InvoiceCalculationResult } from '@/components/board/invoice/InvoiceCalculations';

export const invoiceAPI = {
  /**
   * Reset invoice number counter for a column
   */
  resetInvoiceCounter: (
    columnId: string,
    resetTo?: number
  ): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/boards/columns/${columnId}/reset-counter`, {
      method: 'POST',
      body: JSON.stringify({ resetTo }),
    }),

  /**
   * Get next invoice number preview (without generating)
   */
  previewInvoiceNumber: (
    columnId: string
  ): Promise<ApiResponse<{ preview: string }>> =>
    apiRequest(`/boards/columns/${columnId}/preview-number`),

  /**
   * Calculate invoice totals
   */
  calculateInvoiceTotal: (
    lineItems: LineItem[],
    config: InvoiceCalculationConfig
  ): Promise<InvoiceCalculationResult> => {
    // Calculate client-side (can be enhanced with backend API)
    return Promise.resolve(calculateInvoiceTotal(lineItems, config));
  },

  /**
   * Get currency exchange rate
   */
  getExchangeRate: (
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> => {
    return apiRequest(`/api/currency/exchange-rate?from=${fromCurrency}&to=${toCurrency}`)
      .then((response: any) => {
        if (response.success && response.data?.rate) {
          return response.data.rate;
        }
        // Fallback to mock rates
        return getExchangeRate(fromCurrency, toCurrency);
      })
      .catch(() => {
        // Fallback to mock rates on error
        return getExchangeRate(fromCurrency, toCurrency);
      });
  },
};

// Export calculation functions for client-side use
export function calculateInvoiceTotal(
  lineItems: LineItem[],
  config: InvoiceCalculationConfig
): InvoiceCalculationResult {
  // Import calculation service logic
  const calculateSubtotal = (items: LineItem[]): number => {
    return items.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const calculateTax = (subtotal: number, taxConfig: InvoiceCalculationConfig): number => {
    if (!taxConfig.taxValue || taxConfig.taxValue <= 0) return 0;
    if (taxConfig.taxType === 'percentage') {
      return (subtotal * taxConfig.taxValue) / 100;
    }
    return taxConfig.taxValue;
  };

  const calculateDiscount = (subtotal: number, discountConfig: InvoiceCalculationConfig): number => {
    if (!discountConfig.discountValue || discountConfig.discountValue <= 0) return 0;
    if (discountConfig.discountType === 'percentage') {
      return (subtotal * discountConfig.discountValue) / 100;
    }
    return discountConfig.discountValue;
  };

  let subtotal = calculateSubtotal(lineItems);

  // Apply currency conversion if needed
  if (config.baseCurrency && config.exchangeRate && config.baseCurrency !== config.currency) {
    subtotal = subtotal * config.exchangeRate;
  }

  const tax = calculateTax(subtotal, config);
  const discount = calculateDiscount(subtotal, config);
  const total = subtotal + tax - discount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
    currency: config.currency,
  };
}

export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  // Mock exchange rates (in production, use real API)
  const rates: Record<string, Record<string, number>> = {
    USD: { EUR: 0.85, GBP: 0.73, INR: 83.0, JPY: 150.0, CNY: 7.2, AED: 3.67 },
    EUR: { USD: 1.18, GBP: 0.86, INR: 97.6 },
    GBP: { USD: 1.37, EUR: 1.16, INR: 113.5 },
    INR: { USD: 0.012, EUR: 0.0102, GBP: 0.0088 },
  };

  if (fromCurrency === toCurrency) return 1;
  if (rates[fromCurrency]?.[toCurrency]) return rates[fromCurrency][toCurrency];
  if (rates[toCurrency]?.[fromCurrency]) return 1 / rates[toCurrency][fromCurrency];
  return 1;
}
