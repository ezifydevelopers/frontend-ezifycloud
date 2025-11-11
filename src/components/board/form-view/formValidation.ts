// Form validation utilities for different field types

import { Column } from '@/types/workspace';

export interface ValidationError {
  fieldId: string;
  fieldName: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateFormField = (
  column: Column,
  value: unknown
): ValidationError | null => {
  // Check required
  if (column.required) {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return {
        fieldId: column.id,
        fieldName: column.name,
        message: `${column.name} is required`,
      };
    }
  }

  // If value is empty and not required, skip other validations
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const settings = column.settings as Record<string, unknown> | undefined;

  switch (column.type) {
    case 'EMAIL': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value === 'string' && !emailRegex.test(value)) {
        return {
          fieldId: column.id,
          fieldName: column.name,
          message: `${column.name} must be a valid email address`,
        };
      }
      break;
    }

    case 'PHONE': {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (typeof value === 'string' && !phoneRegex.test(value)) {
        return {
          fieldId: column.id,
          fieldName: column.name,
          message: `${column.name} must be a valid phone number`,
        };
      }
      break;
    }

    case 'LINK':
    case 'URL': {
      try {
        const url = typeof value === 'string' ? new URL(value) : null;
        if (!url || (!url.protocol.startsWith('http:') && !url.protocol.startsWith('https:'))) {
          return {
            fieldId: column.id,
            fieldName: column.name,
            message: `${column.name} must be a valid URL (http:// or https://)`,
          };
        }
      } catch {
        return {
          fieldId: column.id,
          fieldName: column.name,
          message: `${column.name} must be a valid URL`,
        };
      }
      break;
    }

    case 'NUMBER':
    case 'CURRENCY': {
      const numValue = typeof value === 'number' ? value : Number(value);
      if (isNaN(numValue)) {
        return {
          fieldId: column.id,
          fieldName: column.name,
          message: `${column.name} must be a valid number`,
        };
      }

      const min = settings?.min !== undefined ? Number(settings.min) : undefined;
      const max = settings?.max !== undefined ? Number(settings.max) : undefined;

      if (min !== undefined && numValue < min) {
        return {
          fieldId: column.id,
          fieldName: column.name,
          message: `${column.name} must be at least ${min}`,
        };
      }

      if (max !== undefined && numValue > max) {
        return {
          fieldId: column.id,
          fieldName: column.name,
          message: `${column.name} must be at most ${max}`,
        };
      }
      break;
    }

    case 'TEXT':
    case 'LONG_TEXT': {
      if (typeof value === 'string') {
        const minLength = settings?.minLength !== undefined ? Number(settings.minLength) : undefined;
        const maxLength = settings?.maxLength !== undefined ? Number(settings.maxLength) : undefined;

        if (minLength !== undefined && value.length < minLength) {
          return {
            fieldId: column.id,
            fieldName: column.name,
            message: `${column.name} must be at least ${minLength} characters`,
          };
        }

        if (maxLength !== undefined && value.length > maxLength) {
          return {
            fieldId: column.id,
            fieldName: column.name,
            message: `${column.name} must be at most ${maxLength} characters`,
          };
        }
      }
      break;
    }

    case 'DATE':
    case 'DATETIME': {
      const dateValue = value instanceof Date ? value : new Date(value as string);
      if (isNaN(dateValue.getTime())) {
        return {
          fieldId: column.id,
          fieldName: column.name,
          message: `${column.name} must be a valid date`,
        };
      }

      const minDate = settings?.minDate ? new Date(settings.minDate as string) : undefined;
      const maxDate = settings?.maxDate ? new Date(settings.maxDate as string) : undefined;

      if (minDate && dateValue < minDate) {
        return {
          fieldId: column.id,
          fieldName: column.name,
          message: `${column.name} must be after ${minDate.toLocaleDateString()}`,
        };
      }

      if (maxDate && dateValue > maxDate) {
        return {
          fieldId: column.id,
          fieldName: column.name,
          message: `${column.name} must be before ${maxDate.toLocaleDateString()}`,
        };
      }
      break;
    }

    case 'DROPDOWN':
    case 'STATUS': {
      const options = (settings?.options as string[]) || [];
      if (options.length > 0 && typeof value === 'string' && !options.includes(value)) {
        return {
          fieldId: column.id,
          fieldName: column.name,
          message: `${column.name} must be one of the allowed options`,
        };
      }
      break;
    }
  }

  return null;
};

export const validateForm = (
  columns: Column[],
  formData: Record<string, unknown>
): ValidationResult => {
  const errors: ValidationError[] = [];

  columns.forEach((column) => {
    const error = validateFormField(column, formData[column.id]);
    if (error) {
      errors.push(error);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

