// Due date calculation and management utilities

export type PaymentTerms = 
  | 'net_15'    // Net 15 days
  | 'net_30'    // Net 30 days
  | 'net_45'    // Net 45 days
  | 'net_60'    // Net 60 days
  | 'due_on_receipt' // Due on receipt
  | 'custom';   // Custom days

export interface PaymentTermsConfig {
  type: PaymentTerms;
  days?: number; // For custom terms
}

/**
 * Calculate due date from issue date and payment terms
 */
export function calculateDueDate(
  issueDate: string | Date,
  terms: PaymentTermsConfig
): string | null {
  if (!issueDate) return null;

  const date = typeof issueDate === 'string' ? new Date(issueDate) : issueDate;
  if (isNaN(date.getTime())) return null;

  const dueDate = new Date(date);

  switch (terms.type) {
    case 'due_on_receipt':
      return dueDate.toISOString().split('T')[0];
    
    case 'net_15':
      dueDate.setDate(dueDate.getDate() + 15);
      break;
    
    case 'net_30':
      dueDate.setDate(dueDate.getDate() + 30);
      break;
    
    case 'net_45':
      dueDate.setDate(dueDate.getDate() + 45);
      break;
    
    case 'net_60':
      dueDate.setDate(dueDate.getDate() + 60);
      break;
    
    case 'custom':
      if (terms.days !== undefined && terms.days > 0) {
        dueDate.setDate(dueDate.getDate() + terms.days);
      } else {
        return null;
      }
      break;
    
    default:
      return null;
  }

  return dueDate.toISOString().split('T')[0];
}

/**
 * Check if a due date is overdue
 */
export function isOverdue(dueDate: string | Date | null | undefined): boolean {
  if (!dueDate) return false;

  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  if (isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

/**
 * Get days until due date (negative if overdue)
 */
export function getDaysUntilDue(dueDate: string | Date | null | undefined): number | null {
  if (!dueDate) return null;

  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  if (isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get overdue status text
 */
export function getOverdueStatus(dueDate: string | Date | null | undefined): {
  status: 'overdue' | 'due_soon' | 'due_later' | 'no_date';
  days: number | null;
  label: string;
} {
  if (!dueDate) {
    return {
      status: 'no_date',
      days: null,
      label: 'No due date',
    };
  }

  const days = getDaysUntilDue(dueDate);
  if (days === null) {
    return {
      status: 'no_date',
      days: null,
      label: 'Invalid date',
    };
  }

  if (days < 0) {
    return {
      status: 'overdue',
      days: Math.abs(days),
      label: `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`,
    };
  } else if (days === 0) {
    return {
      status: 'due_soon',
      days: 0,
      label: 'Due today',
    };
  } else if (days <= 3) {
    return {
      status: 'due_soon',
      days,
      label: `Due in ${days} day${days !== 1 ? 's' : ''}`,
    };
  } else {
    return {
      status: 'due_later',
      days,
      label: `Due in ${days} day${days !== 1 ? 's' : ''}`,
    };
  }
}

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
  { value: 'net_60', label: 'Net 60' },
  { value: 'custom', label: 'Custom' },
];

