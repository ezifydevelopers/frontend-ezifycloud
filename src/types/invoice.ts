// Invoice template types

export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  workspaceId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Template configuration
  config: InvoiceTemplateConfig;
}

export interface InvoiceTemplateConfig {
  // Header Section
  header: {
    showLogo: boolean;
    logoUrl?: string;
    logoPosition: 'left' | 'center' | 'right';
    companyName?: string;
    companyTagline?: string;
  };
  
  // Company Information
  companyInfo: {
    name: string;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
    registrationNumber?: string;
  };
  
  // Invoice Details
  invoiceDetails: {
    showInvoiceNumber: boolean;
    showInvoiceDate: boolean;
    showDueDate: boolean;
    showStatus: boolean;
    showTerms: boolean;
  };
  
  // Client Information
  clientInfo: {
    showClientSection: boolean;
    title: string; // "Bill To", "Client", etc.
    fields: string[]; // Which fields to show
  };
  
  // Line Items
  lineItems: {
    showTable: boolean;
    columns: string[]; // Description, Quantity, Price, Tax, Total
    showSubtotal: boolean;
    showTax: boolean;
    showDiscount: boolean;
  };
  
  // Footer Section
  footer: {
    showTerms: boolean;
    termsAndConditions?: string;
    showNotes: boolean;
    notesLabel?: string;
    showPaymentInfo: boolean;
    paymentInfo?: string;
  };
  
  // Styling
  styling: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: 'small' | 'medium' | 'large';
    currency: string;
    dateFormat: string;
    numberFormat: string;
  };
}

export const DEFAULT_INVOICE_TEMPLATE_CONFIG: InvoiceTemplateConfig = {
  header: {
    showLogo: false,
    logoPosition: 'left',
    companyName: '',
    companyTagline: '',
  },
  companyInfo: {
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    registrationNumber: '',
  },
  invoiceDetails: {
    showInvoiceNumber: true,
    showInvoiceDate: true,
    showDueDate: true,
    showStatus: true,
    showTerms: true,
  },
  clientInfo: {
    showClientSection: true,
    title: 'Bill To',
    fields: ['name', 'address', 'email', 'phone'],
  },
  lineItems: {
    showTable: true,
    columns: ['description', 'quantity', 'unitPrice', 'tax', 'total'],
    showSubtotal: true,
    showTax: true,
    showDiscount: true,
  },
  footer: {
    showTerms: true,
    termsAndConditions: 'Payment is due within 30 days. Late payments may incur a fee.',
    showNotes: true,
    notesLabel: 'Notes',
    showPaymentInfo: false,
    paymentInfo: '',
  },
  styling: {
    primaryColor: '#000000',
    secondaryColor: '#666666',
    fontFamily: 'Inter',
    fontSize: 'medium',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US',
  },
};

