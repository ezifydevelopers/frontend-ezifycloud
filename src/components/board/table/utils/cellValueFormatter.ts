// Cell value formatting utilities for display

import { Column } from '@/types/workspace';
import { getWeekNumber } from './dateUtils';

/**
 * Format cell value for display based on column type
 */
export const formatCellValue = (value: unknown, column: Column): string => {
  if (value === null || value === undefined) return '—';

  switch (column.type) {
    case 'NUMBER':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    
    case 'CURRENCY': {
      const currencySettings = column.settings as { currency?: string } | undefined;
      const currency = currencySettings?.currency || 'USD';
      const currencyValue = typeof value === 'number' ? value : Number(value) || 0;
      const currencySymbols: Record<string, string> = {
        USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹',
        AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CHF: 'CHF',
        NZD: 'NZ$', BRL: 'R$', MXN: '$', ZAR: 'R'
      };
      const symbol = currencySymbols[currency] || currency;
      return `${symbol}${currencyValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    case 'PERCENTAGE':
      const percentValue = typeof value === 'number' ? value : Number(value) || 0;
      return `${percentValue.toFixed(2)}%`;
    
    case 'DATE':
      return new Date(value as string).toLocaleDateString();
    
    case 'DATETIME':
      return new Date(value as string).toLocaleString();
    
    case 'WEEK': {
      const weekDate = new Date(value as string);
      return `${weekDate.getFullYear()}-W${String(getWeekNumber(weekDate)).padStart(2, '0')}`;
    }
    
    case 'MONTH': {
      const monthDate = new Date(value as string);
      return monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    
    case 'YEAR': {
      const yearDate = new Date(value as string);
      return String(yearDate.getFullYear());
    }
    
    case 'TIMELINE': {
      try {
        const timeline = typeof value === 'object' && value !== null && 'start' in value && 'end' in value
          ? value as { start: string; end: string }
          : typeof value === 'string' 
            ? JSON.parse(value) 
            : null;
        if (timeline && timeline.start && timeline.end) {
          return `${new Date(timeline.start).toLocaleDateString()} - ${new Date(timeline.end).toLocaleDateString()}`;
        }
        return '—';
      } catch {
        return '—';
      }
    }
    
    case 'AUTO_NUMBER':
      return String(value);
    
    default:
      return String(value);
  }
};

/**
 * Get status color classes based on status value and column settings
 */
export const getStatusColor = (status: string, column?: Column): string => {
  // Check for custom colors in column settings first
  if (column) {
    const settings = column.settings as { 
      options?: Array<{ label: string; color?: string }> | string[];
      statusColors?: Record<string, string>;
    } | undefined;
    
    // Check if statusColors mapping exists
    if (settings?.statusColors && typeof settings.statusColors === 'object') {
      const customColor = settings.statusColors[status];
      if (customColor) {
        // Return custom color as inline style class or use predefined color mapping
        return getColorClassFromHex(customColor);
      }
    }
    
    // Check if options array has color info
    if (settings?.options && Array.isArray(settings.options)) {
      for (const option of settings.options) {
        if (typeof option === 'object' && 'label' in option) {
          if (option.label === status && option.color) {
            return getColorClassFromHex(option.color);
          }
        } else if (option === status) {
          // Fallback to default colors for string options
          break;
        }
      }
    }
  }
  
  // Default color mapping based on status value
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('done') || lowerStatus.includes('completed') || lowerStatus.includes('success')) {
    return 'bg-green-100 text-green-800 border-green-200';
  } else if (lowerStatus.includes('in progress') || lowerStatus.includes('pending') || lowerStatus.includes('active')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  } else if (lowerStatus.includes('blocked') || lowerStatus.includes('error') || lowerStatus.includes('failed') || lowerStatus.includes('rejected')) {
    return 'bg-red-100 text-red-800 border-red-200';
  } else if (lowerStatus.includes('todo') || lowerStatus.includes('new') || lowerStatus.includes('open')) {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  } else if (lowerStatus.includes('cancelled') || lowerStatus.includes('on hold')) {
    return 'bg-gray-100 text-gray-800 border-gray-200';
  }
  return 'bg-slate-100 text-slate-800 border-slate-200';
};

/**
 * Convert hex color to Tailwind-compatible class or inline style
 */
const getColorClassFromHex = (hexColor: string): string => {
  // For now, return a custom style class that can be styled
  // In production, you might want to generate dynamic classes or use inline styles
  // This is a simplified version - you could enhance it to support inline styles
  return `bg-slate-100 text-slate-800 border-slate-200`;
};

/**
 * Get status color as inline style object (for dynamic colors)
 */
export const getStatusColorStyle = (status: string, column?: Column): React.CSSProperties | undefined => {
  if (column) {
    const settings = column.settings as { 
      options?: Array<{ label: string; color?: string }> | string[];
      statusColors?: Record<string, string>;
    } | undefined;
    
    // Check statusColors mapping
    if (settings?.statusColors && typeof settings.statusColors === 'object') {
      const customColor = settings.statusColors[status];
      if (customColor) {
        // Convert hex to RGB for better opacity support
        const rgb = hexToRgb(customColor);
        if (rgb) {
          return {
            backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
            color: customColor,
            borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`,
          };
        }
      }
    }
    
    // Check options array
    if (settings?.options && Array.isArray(settings.options)) {
      for (const option of settings.options) {
        if (typeof option === 'object' && 'label' in option) {
          if (option.label === status && option.color) {
            const rgb = hexToRgb(option.color);
            if (rgb) {
              return {
                backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
                color: option.color,
                borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`,
              };
            }
          }
        }
      }
    }
  }
  
  return undefined; // Use default CSS classes
};

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Validate status workflow transition
 */
export const validateStatusTransition = (
  currentStatus: string,
  newStatus: string,
  column?: Column
): { valid: boolean; error?: string } => {
  if (!column) {
    return { valid: true }; // No validation if no column
  }
  
  const settings = column.settings as {
    workflowRules?: {
      allowedTransitions?: Record<string, string[]>;
      requiredTransitions?: Array<{ from: string; to: string }>;
      blockedTransitions?: Array<{ from: string; to: string }>;
    };
  } | undefined;
  
  if (!settings?.workflowRules) {
    return { valid: true }; // No workflow rules defined
  }
  
  const { allowedTransitions, blockedTransitions } = settings.workflowRules;
  
  // Check blocked transitions
  if (blockedTransitions) {
    const isBlocked = blockedTransitions.some(
      rule => rule.from === currentStatus && rule.to === newStatus
    );
    if (isBlocked) {
      return {
        valid: false,
        error: `Cannot transition from "${currentStatus}" to "${newStatus}"`,
      };
    }
  }
  
  // Check allowed transitions (if defined, only these are allowed)
  if (allowedTransitions) {
    const allowedStatuses = allowedTransitions[currentStatus];
    if (allowedStatuses && !allowedStatuses.includes(newStatus)) {
      return {
        valid: false,
        error: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowedStatuses.join(', ')}`,
      };
    }
  }
  
  return { valid: true };
};

