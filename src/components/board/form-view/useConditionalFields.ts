import { useMemo } from 'react';
import { Column } from '@/types/workspace';

export interface ConditionalRule {
  fieldId: string; // The field to check
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: unknown; // The value to compare against
}

export interface ConditionalFieldConfig {
  showWhen?: ConditionalRule[];
  hideWhen?: ConditionalRule[];
  requiredWhen?: ConditionalRule[];
}

/**
 * Evaluate a conditional rule against form data
 */
const evaluateRule = (rule: ConditionalRule, formData: Record<string, unknown>): boolean => {
  const fieldValue = formData[rule.fieldId];

  switch (rule.operator) {
    case 'equals':
      return fieldValue === rule.value || String(fieldValue) === String(rule.value);
    case 'notEquals':
      return fieldValue !== rule.value && String(fieldValue) !== String(rule.value);
    case 'contains':
      return String(fieldValue || '').includes(String(rule.value || ''));
    case 'notContains':
      return !String(fieldValue || '').includes(String(rule.value || ''));
    case 'greaterThan':
      return Number(fieldValue) > Number(rule.value);
    case 'lessThan':
      return Number(fieldValue) < Number(rule.value);
    case 'isEmpty':
      return fieldValue === null || fieldValue === undefined || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);
    case 'isNotEmpty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);
    default:
      return true;
  }
};

/**
 * Check if a field should be visible based on conditional rules
 */
export const shouldShowField = (
  column: Column,
  formData: Record<string, unknown>
): boolean => {
  const settings = column.settings as Record<string, unknown> | undefined;
  const conditional = settings?.conditional as ConditionalFieldConfig | undefined;

  if (!conditional) return true;

  // Check showWhen rules (all must pass)
  if (conditional.showWhen && conditional.showWhen.length > 0) {
    const allShowRulesPass = conditional.showWhen.every(rule => evaluateRule(rule, formData));
    if (!allShowRulesPass) return false;
  }

  // Check hideWhen rules (if any pass, hide)
  if (conditional.hideWhen && conditional.hideWhen.length > 0) {
    const anyHideRulePasses = conditional.hideWhen.some(rule => evaluateRule(rule, formData));
    if (anyHideRulePasses) return false;
  }

  return true;
};

/**
 * Check if a field should be required based on conditional rules
 */
export const isFieldRequired = (
  column: Column,
  formData: Record<string, unknown>
): boolean => {
  if (column.required) return true;

  const settings = column.settings as Record<string, unknown> | undefined;
  const conditional = settings?.conditional as ConditionalFieldConfig | undefined;

  if (!conditional?.requiredWhen || conditional.requiredWhen.length === 0) {
    return false;
  }

  // All requiredWhen rules must pass
  return conditional.requiredWhen.every(rule => evaluateRule(rule, formData));
};

/**
 * Hook to get visible columns based on conditional logic
 */
export const useConditionalFields = (
  columns: Column[],
  formData: Record<string, unknown>
) => {
  return useMemo(() => {
    return columns.filter(column => shouldShowField(column, formData));
  }, [columns, formData]);
};

