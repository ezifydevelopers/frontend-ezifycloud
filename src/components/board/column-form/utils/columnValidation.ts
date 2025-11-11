// Column validation utility
// Validates cell values based on column settings and validation rules

import { Column } from '@/types/workspace';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a cell value against column rules
 */
export const validateCellValue = (column: Column, value: unknown): ValidationResult => {
  const settings = column.settings as Record<string, unknown> | undefined;

  // Required field validation
  if (column.required) {
    if (value === null || value === undefined || value === '') {
      return {
        valid: false,
        error: `${column.name} is required`,
      };
    }
    
    // For arrays, check if empty
    if (Array.isArray(value) && value.length === 0) {
      return {
        valid: false,
        error: `${column.name} is required`,
      };
    }
  }

  // Skip further validation if value is empty and not required
  if (value === null || value === undefined || value === '') {
    return { valid: true };
  }

  // Format validation for specific column types
  const formatValidation = validateFormat(column, value);
  if (!formatValidation.valid) {
    return formatValidation;
  }

  // Min/max value constraints
  const minMaxValidation = validateMinMax(column, value, settings);
  if (!minMaxValidation.valid) {
    return minMaxValidation;
  }

  // Custom validation rules (regex pattern, etc.)
  const customValidation = validateCustomRules(column, value, settings);
  if (!customValidation.valid) {
    return customValidation;
  }

  return { valid: true };
};

/**
 * Validate format based on column type
 */
const validateFormat = (column: Column, value: unknown): ValidationResult => {
  const stringValue = typeof value === 'string' ? value : String(value);

  switch (column.type) {
    case 'EMAIL':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return {
          valid: false,
          error: `${column.name} must be a valid email address`,
        };
      }
      break;

    case 'LINK':
      try {
        // Try to create a URL object
        new URL(stringValue);
      } catch {
        // If not a valid URL, check if it's at least a valid format
        if (!stringValue.match(/^https?:\/\//)) {
          return {
            valid: false,
            error: `${column.name} must be a valid URL (e.g., https://example.com)`,
          };
        }
      }
      break;

    case 'PHONE':
      // Basic phone validation - allow digits, spaces, dashes, parentheses, +
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(stringValue)) {
        return {
          valid: false,
          error: `${column.name} must be a valid phone number`,
        };
      }
      break;

    case 'NUMBER':
    case 'CURRENCY':
    case 'PERCENTAGE':
    case 'RATING':
    case 'PROGRESS':
      if (typeof value !== 'number' && !isNaN(Number(value))) {
        // Value can be converted to number, that's fine
        break;
      }
      if (typeof value !== 'number') {
        return {
          valid: false,
          error: `${column.name} must be a number`,
        };
      }
      break;

    case 'DATE':
    case 'DATETIME':
    case 'WEEK':
    case 'MONTH':
    case 'YEAR':
      if (typeof value !== 'string') {
        return {
          valid: false,
          error: `${column.name} must be a valid date`,
        };
      }
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return {
          valid: false,
          error: `${column.name} must be a valid date`,
        };
      }
      break;
  }

  return { valid: true };
};

/**
 * Validate min/max constraints
 */
const validateMinMax = (column: Column, value: unknown, settings?: Record<string, unknown>): ValidationResult => {
  if (!settings) return { valid: true };

  const isTextType = ['TEXT', 'LONG_TEXT', 'EMAIL', 'PHONE', 'LINK'].includes(column.type);
  const isNumberType = ['NUMBER', 'CURRENCY', 'PERCENTAGE', 'RATING', 'PROGRESS'].includes(column.type);

  // Text length validation
  if (isTextType && typeof value === 'string') {
    const minLength = settings.validationMinLength as number | undefined;
    const maxLength = settings.validationMaxLength as number | undefined;

    if (minLength !== undefined && value.length < minLength) {
      return {
        valid: false,
        error: settings.validationCustomMessage as string || `${column.name} must be at least ${minLength} characters`,
      };
    }

    if (maxLength !== undefined && value.length > maxLength) {
      return {
        valid: false,
        error: settings.validationCustomMessage as string || `${column.name} must be at most ${maxLength} characters`,
      };
    }
  }

  // Number value validation
  if (isNumberType) {
    const numValue = typeof value === 'number' ? value : Number(value);
    if (isNaN(numValue)) {
      return { valid: true }; // Format validation already handled this
    }

    const minValue = settings.validationMinValue as number | undefined;
    const maxValue = settings.validationMaxValue as number | undefined;

    if (minValue !== undefined && numValue < minValue) {
      return {
        valid: false,
        error: settings.validationCustomMessage as string || `${column.name} must be at least ${minValue}`,
      };
    }

    if (maxValue !== undefined && numValue > maxValue) {
      return {
        valid: false,
        error: settings.validationCustomMessage as string || `${column.name} must be at most ${maxValue}`,
      };
    }
  }

  return { valid: true };
};

/**
 * Validate custom rules (regex pattern, etc.)
 */
const validateCustomRules = (column: Column, value: unknown, settings?: Record<string, unknown>): ValidationResult => {
  if (!settings) return { valid: true };

  const pattern = settings.validationPattern as string | undefined;
  if (!pattern || !pattern.trim()) {
    return { valid: true };
  }

  const stringValue = typeof value === 'string' ? value : String(value);
  
  try {
    const regex = new RegExp(pattern);
    if (!regex.test(stringValue)) {
      return {
        valid: false,
        error: settings.validationCustomMessage as string || `${column.name} does not match the required format`,
      };
    }
  } catch (error) {
    // Invalid regex pattern - should not happen if validation in settings is correct
    console.error('Invalid regex pattern in column validation:', pattern, error);
    return { valid: true }; // Don't block validation due to invalid pattern
  }

  return { valid: true };
};

/**
 * Validate multiple cell values at once (for item form)
 */
export const validateItemCells = (
  columns: Column[],
  cells: Record<string, unknown>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  columns.forEach((column) => {
    const cellValue = cells[column.id];
    const validation = validateCellValue(column, cellValue);
    
    if (!validation.valid && validation.error) {
      errors[`cell_${column.id}`] = validation.error;
    }
  });

  return errors;
};

