// Invoice Renderer Component - Renders invoice using template

import React from 'react';
import { InvoiceTemplateConfig } from '@/types/invoice';
import { LineItem } from './LineItemsEditor';
import { InvoiceCalculationResult } from './InvoiceCalculations';
// Date formatting utility
const formatDate = (dateStr: string, formatStr: string): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    // Simple date formatting (can be enhanced with date-fns if available)
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    
    return formatStr
      .replace('MM', m)
      .replace('DD', d)
      .replace('YYYY', y.toString())
      .replace('YY', y.toString().slice(-2));
  } catch {
    return dateStr;
  }
};

interface InvoiceRendererProps {
  template: InvoiceTemplateConfig;
  invoiceData: {
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    status?: string;
    clientName?: string;
    clientAddress?: string;
    clientEmail?: string;
    clientPhone?: string;
    lineItems: LineItem[];
    calculations: InvoiceCalculationResult;
    notes?: string;
  };
  onPrint?: () => void;
}

export const InvoiceRenderer: React.FC<InvoiceRendererProps> = ({
  template,
  invoiceData,
  onPrint,
}) => {

  const formatCurrency = (amount: number) => {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹',
      AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CHF: 'CHF',
    };
    const symbol = symbols[template.styling.currency] || template.styling.currency;
    return `${symbol}${amount.toLocaleString(template.styling.numberFormat, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const fontSizeMap = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <div 
      className={`bg-white p-8 max-w-4xl mx-auto ${fontSizeMap[template.styling.fontSize]}`}
      style={{ fontFamily: template.styling.fontFamily }}
    >
      {/* Header Section */}
      <div className={`flex items-start justify-between mb-8 pb-6 border-b-2`} style={{ borderColor: template.styling.primaryColor }}>
        <div className="flex-1">
          {template.header.showLogo && template.header.logoUrl && (
            <div className={`flex mb-4 ${
              template.header.logoPosition === 'center' ? 'justify-center' :
              template.header.logoPosition === 'right' ? 'justify-end' : 'justify-start'
            }`}>
              <img 
                src={template.header.logoUrl} 
                alt="Company Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          
          {template.header.companyName && (
            <h1 
              className="text-2xl font-bold mb-1"
              style={{ color: template.styling.primaryColor }}
            >
              {template.header.companyName}
            </h1>
          )}
          
          {template.header.companyTagline && (
            <p className="text-muted-foreground text-sm">{template.header.companyTagline}</p>
          )}
        </div>
      </div>

      {/* Company Information */}
      <div className="mb-8">
        <div 
          className="text-sm leading-relaxed"
          style={{ color: template.styling.secondaryColor }}
        >
          {template.companyInfo.name && <div className="font-semibold">{template.companyInfo.name}</div>}
          {template.companyInfo.address && <div>{template.companyInfo.address}</div>}
          {(template.companyInfo.city || template.companyInfo.state || template.companyInfo.zipCode) && (
            <div>
              {[template.companyInfo.city, template.companyInfo.state, template.companyInfo.zipCode]
                .filter(Boolean)
                .join(', ')}
            </div>
          )}
          {template.companyInfo.country && <div>{template.companyInfo.country}</div>}
          {template.companyInfo.phone && <div>Phone: {template.companyInfo.phone}</div>}
          {template.companyInfo.email && <div>Email: {template.companyInfo.email}</div>}
          {template.companyInfo.website && <div>Website: {template.companyInfo.website}</div>}
          {template.companyInfo.taxId && <div>Tax ID: {template.companyInfo.taxId}</div>}
          {template.companyInfo.registrationNumber && (
            <div>Registration: {template.companyInfo.registrationNumber}</div>
          )}
        </div>
      </div>

      {/* Invoice Details & Client Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Invoice Details */}
        <div>
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: template.styling.primaryColor }}
          >
            Invoice Details
          </h2>
          <div className="space-y-2 text-sm">
            {template.invoiceDetails.showInvoiceNumber && invoiceData.invoiceNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice #:</span>
                <span className="font-medium">{invoiceData.invoiceNumber}</span>
              </div>
            )}
            {template.invoiceDetails.showInvoiceDate && invoiceData.invoiceDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{formatDate(invoiceData.invoiceDate || '', template.styling.dateFormat)}</span>
              </div>
            )}
            {template.invoiceDetails.showDueDate && invoiceData.dueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span>{formatDate(invoiceData.dueDate || '', template.styling.dateFormat)}</span>
              </div>
            )}
            {template.invoiceDetails.showStatus && invoiceData.status && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">{invoiceData.status}</span>
              </div>
            )}
          </div>
        </div>

        {/* Client Information */}
        {template.clientInfo.showClientSection && (
          <div>
            <h2 
              className="text-lg font-semibold mb-4"
              style={{ color: template.styling.primaryColor }}
            >
              {template.clientInfo.title}
            </h2>
            <div className="space-y-2 text-sm">
              {template.clientInfo.fields.includes('name') && invoiceData.clientName && (
                <div className="font-semibold">{invoiceData.clientName}</div>
              )}
              {template.clientInfo.fields.includes('address') && invoiceData.clientAddress && (
                <div>{invoiceData.clientAddress}</div>
              )}
              {template.clientInfo.fields.includes('email') && invoiceData.clientEmail && (
                <div>Email: {invoiceData.clientEmail}</div>
              )}
              {template.clientInfo.fields.includes('phone') && invoiceData.clientPhone && (
                <div>Phone: {invoiceData.clientPhone}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Line Items Table */}
      {template.lineItems.showTable && invoiceData.lineItems.length > 0 && (
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2" style={{ borderColor: template.styling.primaryColor }}>
                {template.lineItems.columns.includes('description') && (
                  <th className="text-left py-3 px-4 font-semibold">Description</th>
                )}
                {template.lineItems.columns.includes('quantity') && (
                  <th className="text-right py-3 px-4 font-semibold">Quantity</th>
                )}
                {template.lineItems.columns.includes('unitPrice') && (
                  <th className="text-right py-3 px-4 font-semibold">Unit Price</th>
                )}
                {template.lineItems.columns.includes('tax') && (
                  <th className="text-right py-3 px-4 font-semibold">Tax</th>
                )}
                {template.lineItems.columns.includes('total') && (
                  <th className="text-right py-3 px-4 font-semibold">Total</th>
                )}
              </tr>
            </thead>
            <tbody>
              {invoiceData.lineItems.map((item, index) => (
                <tr key={item.id || index} className="border-b">
                  {template.lineItems.columns.includes('description') && (
                    <td className="py-3 px-4">{item.description}</td>
                  )}
                  {template.lineItems.columns.includes('quantity') && (
                    <td className="text-right py-3 px-4">{item.quantity}</td>
                  )}
                  {template.lineItems.columns.includes('unitPrice') && (
                    <td className="text-right py-3 px-4">{formatCurrency(item.unitPrice || 0)}</td>
                  )}
                  {template.lineItems.columns.includes('tax') && (
                    <td className="text-right py-3 px-4">{formatCurrency(item.tax || 0)}</td>
                  )}
                  {template.lineItems.columns.includes('total') && (
                    <td className="text-right py-3 px-4 font-semibold">
                      {formatCurrency(item.total || 0)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          {template.lineItems.showSubtotal && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(invoiceData.calculations.subtotal)}</span>
            </div>
          )}
          {template.lineItems.showTax && invoiceData.calculations.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax:</span>
              <span>{formatCurrency(invoiceData.calculations.tax)}</span>
            </div>
          )}
          {template.lineItems.showDiscount && invoiceData.calculations.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount:</span>
              <span className="text-green-600">- {formatCurrency(invoiceData.calculations.discount)}</span>
            </div>
          )}
          <div 
            className="flex justify-between pt-2 border-t-2 font-bold text-lg"
            style={{ borderColor: template.styling.primaryColor }}
          >
            <span>Total:</span>
            <span style={{ color: template.styling.primaryColor }}>
              {formatCurrency(invoiceData.calculations.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {template.footer.showNotes && invoiceData.notes && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">{template.footer.notesLabel || 'Notes'}</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoiceData.notes}</p>
        </div>
      )}

      {/* Payment Information */}
      {template.footer.showPaymentInfo && template.footer.paymentInfo && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Payment Information</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {template.footer.paymentInfo}
          </p>
        </div>
      )}

      {/* Terms & Conditions */}
      {template.footer.showTerms && template.footer.termsAndConditions && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-semibold mb-2">Terms & Conditions</h3>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
            {template.footer.termsAndConditions}
          </p>
        </div>
      )}

      {/* Print Button */}
      {onPrint && (
        <div className="mt-8 text-center">
          <button
            onClick={onPrint}
            className="px-6 py-2 text-white rounded-lg hover:opacity-90"
            style={{ backgroundColor: template.styling.primaryColor }}
          >
            Print Invoice
          </button>
        </div>
      )}
    </div>
  );
};

