// Item form validation schema generator

import { z } from 'zod';
import { Column } from '@/types/workspace';

/**
 * Generate validation schema dynamically based on columns
 * @param columns - Array of column definitions
 * @param workspaceMembers - Optional array of workspace members for PEOPLE field validation
 */
export const createItemSchema = (columns: Column[], workspaceMembers?: Array<{ id: string; email: string }>) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {
    name: z.string().min(1, 'Item name is required'),
    status: z.string().optional(),
  };

  columns.forEach((column) => {
    const settings = column.settings as Record<string, unknown> | undefined;
    
    if (column.required && !column.isHidden) {
      switch (column.type) {
        case 'TEXT':
        case 'LONG_TEXT':
        case 'PHONE':
        case 'LINK': {
          let schema = z.string().min(1, `${column.name} is required`);
          
          // Apply length constraints
          if (settings?.validationMinLength !== undefined) {
            schema = schema.min(
              Number(settings.validationMinLength),
              settings.validationCustomMessage as string || `${column.name} must be at least ${settings.validationMinLength} characters`
            );
          }
          if (settings?.validationMaxLength !== undefined) {
            schema = schema.max(
              Number(settings.validationMaxLength),
              settings.validationCustomMessage as string || `${column.name} must be at most ${settings.validationMaxLength} characters`
            );
          }
          
          // Apply regex pattern for custom validation
          if (settings?.validationPattern && typeof settings.validationPattern === 'string') {
            try {
              const regex = new RegExp(settings.validationPattern);
              schema = schema.regex(
                regex,
                settings.validationCustomMessage as string || `${column.name} does not match the required format`
              );
            } catch {
              // Invalid regex - skip pattern validation
            }
          }
          
          schemaFields[`cell_${column.id}`] = schema;
          break;
        }
        case 'EMAIL': {
          let schema = z.string()
            .min(1, `${column.name} is required`)
            .refine(
              (val) => {
                if (!val || val.trim().length === 0) return false;
                // Use a more lenient email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(val);
              },
              `${column.name} must be a valid email address`
            );
          
          // Apply length constraints
          if (settings?.validationMinLength !== undefined) {
            schema = schema.refine(
              (val) => val.length >= Number(settings.validationMinLength),
              `${column.name} must be at least ${settings.validationMinLength} characters`
            );
          }
          if (settings?.validationMaxLength !== undefined) {
            schema = schema.refine(
              (val) => val.length <= Number(settings.validationMaxLength),
              `${column.name} must be at most ${settings.validationMaxLength} characters`
            );
          }
          
          // Apply regex pattern for custom validation
          if (settings?.validationPattern && typeof settings.validationPattern === 'string') {
            try {
              const regex = new RegExp(settings.validationPattern);
              schema = schema.refine(
                (val) => regex.test(val),
                settings.validationCustomMessage as string || `${column.name} does not match the required format`
              );
            } catch {
              // Invalid regex - skip pattern validation
            }
          }
          
          schemaFields[`cell_${column.id}`] = schema;
          break;
        }
        case 'NUMBER':
        case 'CURRENCY':
        case 'PERCENTAGE': {
          let schema = z.union([
            z.number(),
            z.string().transform((val) => {
              if (val === '' || val === null || val === undefined) return undefined;
              const num = Number(val);
              return isNaN(num) ? undefined : num;
            })
          ]).refine((val) => val !== undefined && !isNaN(val), `${column.name} must be a valid number`);
          
          // Apply min/max value constraints
          if (settings?.validationMinValue !== undefined) {
            schema = schema.refine(
              (val) => typeof val === 'number' && val >= Number(settings.validationMinValue),
              settings.validationCustomMessage as string || `${column.name} must be at least ${settings.validationMinValue}`
            );
          }
          if (settings?.validationMaxValue !== undefined) {
            schema = schema.refine(
              (val) => typeof val === 'number' && val <= Number(settings.validationMaxValue),
              settings.validationCustomMessage as string || `${column.name} must be at most ${settings.validationMaxValue}`
            );
          }
          
          schemaFields[`cell_${column.id}`] = schema;
          break;
        }
        case 'DATE':
        case 'DATETIME':
        case 'WEEK':
        case 'MONTH':
        case 'YEAR':
          schemaFields[`cell_${column.id}`] = z.string().min(1, `${column.name} is required`);
          break;
        case 'TIMELINE':
          schemaFields[`cell_${column.id}`] = z.union([
            z.object({ start: z.string().min(1), end: z.string().min(1) }),
            z.string().min(1).transform((val) => {
              try {
                const parsed = JSON.parse(val);
                if (parsed.start && parsed.end) return parsed;
                throw new Error('Invalid timeline format');
              } catch {
                throw new Error('Invalid timeline format');
              }
            })
          ]);
          break;
        case 'CHECKBOX':
          schemaFields[`cell_${column.id}`] = z.boolean();
          break;
        case 'DROPDOWN':
        case 'STATUS':
        case 'RADIO':
        case 'PEOPLE': {
          const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
          if (peopleSettings?.peopleType === 'multiple') {
            schemaFields[`cell_${column.id}`] = z.array(z.string())
              .min(1, `${column.name} is required`)
              .refine(
                (val) => Array.isArray(val) && val.length > 0,
                `${column.name} must have at least one person selected`
              );
          } else {
            // Accept any non-empty string - PeopleField component will handle email-to-user conversion
            // This allows users to type emails, and the component will convert them to user IDs
            let schema = z.string().min(1, `${column.name} is required`);
            
            // Accept any non-empty string
            // If it's an email format, accept it (PeopleField will try to match it)
            // If it's a UUID, accept it as user ID
            // Otherwise accept it as-is
            schema = schema.refine(
              (val) => {
                if (typeof val !== 'string' || val.trim().length === 0) {
                  return false;
                }
                // Accept any non-empty string
                return true;
              },
              `${column.name} is required`
            );
            
            schemaFields[`cell_${column.id}`] = schema;
          }
          break;
        }
        case 'FILE': {
          const fileSettings = column.settings as { fileType?: 'single' | 'multiple' } | undefined;
          if (fileSettings?.fileType === 'multiple') {
            schemaFields[`cell_${column.id}`] = z.array(z.string()).min(1, `${column.name} is required`);
          } else {
            schemaFields[`cell_${column.id}`] = z.string().min(1, `${column.name} is required`);
          }
          break;
        }
        case 'MULTI_SELECT':
          schemaFields[`cell_${column.id}`] = z.array(z.string()).min(1, `${column.name} is required`);
          break;
        case 'VOTE':
          schemaFields[`cell_${column.id}`] = z.enum(['up', 'down']).or(z.null());
          break;
        case 'PROGRESS':
          schemaFields[`cell_${column.id}`] = z.number().min(0).max(100, `${column.name} must be between 0 and 100`);
          break;
        case 'LOCATION':
          schemaFields[`cell_${column.id}`] = z.union([
            z.object({ address: z.string().optional(), lat: z.number().optional(), lng: z.number().optional() }),
            z.string().min(1, `${column.name} is required`),
          ]);
          break;
        default:
          schemaFields[`cell_${column.id}`] = z.string().min(1, `${column.name} is required`);
      }
    } else if (!column.isHidden) {
      // Optional fields
      switch (column.type) {
        case 'TEXT':
        case 'LONG_TEXT':
        case 'PHONE':
        case 'LINK': {
          let schema = z.string().optional();
          
          // Apply length constraints for optional fields
          if (settings?.validationMinLength !== undefined) {
            schema = schema.refine(
              (val) => !val || val.length >= Number(settings.validationMinLength),
              settings.validationCustomMessage as string || `${column.name} must be at least ${settings.validationMinLength} characters`
            );
          }
          if (settings?.validationMaxLength !== undefined) {
            schema = schema.refine(
              (val) => !val || val.length <= Number(settings.validationMaxLength),
              settings.validationCustomMessage as string || `${column.name} must be at most ${settings.validationMaxLength} characters`
            );
          }
          
          // Apply regex pattern
          if (settings?.validationPattern && typeof settings.validationPattern === 'string') {
            try {
              const regex = new RegExp(settings.validationPattern);
              schema = schema.refine(
                (val) => !val || regex.test(val),
                settings.validationCustomMessage as string || `${column.name} does not match the required format`
              );
            } catch {
              // Invalid regex - skip pattern validation
            }
          }
          
          schemaFields[`cell_${column.id}`] = schema;
          break;
        }
        case 'EMAIL': {
          let schema = z.string().email().optional();
          
          if (settings?.validationMinLength !== undefined) {
            schema = schema.refine((val) => !val || val.length >= Number(settings.validationMinLength));
          }
          if (settings?.validationMaxLength !== undefined) {
            schema = schema.refine((val) => !val || val.length <= Number(settings.validationMaxLength));
          }
          
          schemaFields[`cell_${column.id}`] = schema;
          break;
        }
        case 'NUMBER':
        case 'CURRENCY':
        case 'PERCENTAGE': {
          let schema = z.union([
            z.number(),
            z.string(),
          ]).optional();
          
          // Apply min/max value constraints for optional fields
          if (settings?.validationMinValue !== undefined) {
            schema = schema.refine(
              (val) => !val || (typeof val === 'number' ? val : Number(val)) >= Number(settings.validationMinValue),
              settings.validationCustomMessage as string || `${column.name} must be at least ${settings.validationMinValue}`
            );
          }
          if (settings?.validationMaxValue !== undefined) {
            schema = schema.refine(
              (val) => !val || (typeof val === 'number' ? val : Number(val)) <= Number(settings.validationMaxValue),
              settings.validationCustomMessage as string || `${column.name} must be at most ${settings.validationMaxValue}`
            );
          }
          
          schemaFields[`cell_${column.id}`] = schema;
          break;
        }
        case 'CHECKBOX':
          schemaFields[`cell_${column.id}`] = z.boolean().optional();
          break;
        case 'PEOPLE': {
          const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
          if (peopleSettings?.peopleType === 'multiple') {
            schemaFields[`cell_${column.id}`] = z.array(z.string()).optional();
          } else {
            schemaFields[`cell_${column.id}`] = z.string().optional();
          }
          break;
        }
        case 'FILE': {
          const fileSettings = column.settings as { fileType?: 'single' | 'multiple' } | undefined;
          if (fileSettings?.fileType === 'multiple') {
            schemaFields[`cell_${column.id}`] = z.array(z.string()).optional();
          } else {
            schemaFields[`cell_${column.id}`] = z.string().optional();
          }
          break;
        }
        case 'MULTI_SELECT':
          schemaFields[`cell_${column.id}`] = z.array(z.string()).optional();
          break;
        case 'VOTE':
          schemaFields[`cell_${column.id}`] = z.enum(['up', 'down']).or(z.null()).optional();
          break;
        case 'PROGRESS':
          schemaFields[`cell_${column.id}`] = z.number().min(0).max(100).optional();
          break;
        case 'LOCATION':
          schemaFields[`cell_${column.id}`] = z.union([
            z.object({ address: z.string().optional(), lat: z.number().optional(), lng: z.number().optional() }),
            z.string(),
          ]).optional();
          break;
        default:
          schemaFields[`cell_${column.id}`] = z.string().optional();
      }
    }
  });

  return z.object(schemaFields);
};

