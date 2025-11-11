// Column type change warning component - shows data migration implications

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ColumnType } from '@/types/workspace';

interface ColumnTypeChangeWarningProps {
  originalType: ColumnType;
  newType: ColumnType;
  itemCount?: number;
}

const TYPE_COMPATIBILITY: Record<ColumnType, ColumnType[]> = {
  TEXT: ['TEXT', 'LONG_TEXT', 'EMAIL', 'PHONE', 'LINK'],
  LONG_TEXT: ['LONG_TEXT', 'TEXT'],
  EMAIL: ['EMAIL', 'TEXT'],
  PHONE: ['PHONE', 'TEXT'],
  LINK: ['LINK', 'TEXT'],
  NUMBER: ['NUMBER', 'CURRENCY', 'PERCENTAGE', 'RATING', 'PROGRESS'],
  CURRENCY: ['CURRENCY', 'NUMBER', 'PERCENTAGE'],
  PERCENTAGE: ['PERCENTAGE', 'NUMBER', 'CURRENCY'],
  DATE: ['DATE', 'DATETIME', 'TIMELINE'],
  DATETIME: ['DATETIME', 'DATE', 'TIMELINE'],
  WEEK: ['WEEK', 'DATE'],
  MONTH: ['MONTH', 'DATE'],
  YEAR: ['YEAR', 'DATE', 'NUMBER'],
  TIMELINE: ['TIMELINE', 'DATE', 'DATETIME'],
  CHECKBOX: ['CHECKBOX'],
  DROPDOWN: ['DROPDOWN', 'RADIO', 'STATUS'],
  MULTI_SELECT: ['MULTI_SELECT', 'PEOPLE'],
  RADIO: ['RADIO', 'DROPDOWN', 'STATUS'],
  STATUS: ['STATUS', 'DROPDOWN', 'RADIO'],
  PEOPLE: ['PEOPLE', 'MULTI_SELECT'],
  FILE: ['FILE'],
  FORMULA: ['FORMULA'],
  AUTO_NUMBER: ['AUTO_NUMBER', 'NUMBER'],
  RATING: ['RATING', 'NUMBER', 'PROGRESS'],
  VOTE: ['VOTE'],
  PROGRESS: ['PROGRESS', 'NUMBER', 'PERCENTAGE', 'RATING'],
  LOCATION: ['LOCATION', 'TEXT', 'LONG_TEXT'],
  MIRROR: ['MIRROR'],
};

const getCompatibilityWarning = (originalType: ColumnType, newType: ColumnType): string => {
  if (originalType === newType) return '';
  
  const compatibleTypes = TYPE_COMPATIBILITY[originalType] || [];
  
  if (compatibleTypes.includes(newType)) {
    return `Type change is compatible. Data will be converted automatically where possible.`;
  }
  
  // Get warnings based on type combinations
  const incompatibleWarnings: Record<string, string> = {
    'TEXT->NUMBER': 'Text values will be converted to numbers. Invalid values will become null.',
    'NUMBER->TEXT': 'Numbers will be converted to text strings.',
    'DATE->TEXT': 'Dates will be converted to ISO string format.',
    'TEXT->DATE': 'Only valid date strings can be converted. Others will become null.',
    'CHECKBOX->TEXT': 'Boolean values will be converted to "true" or "false" strings.',
    'FILE->TEXT': 'File references cannot be converted to text. Data will be lost.',
    'FORMULA->ANY': 'Formula columns cannot be converted. The formula will be removed.',
    'AUTO_NUMBER->ANY': 'Auto-number columns cannot be converted. Sequential numbers will be lost.',
  };
  
  const warningKey = `${originalType}->${newType}`;
  if (incompatibleWarnings[warningKey]) {
    return incompatibleWarnings[warningKey];
  }
  
  return `Type change may result in data loss or conversion errors. Review existing data after migration.`;
};

export const ColumnTypeChangeWarning: React.FC<ColumnTypeChangeWarningProps> = ({
  originalType,
  newType,
  itemCount = 0,
}) => {
  if (originalType === newType) {
    return null;
  }

  const warning = getCompatibilityWarning(originalType, newType);
  const isIncompatible = !TYPE_COMPATIBILITY[originalType]?.includes(newType);

  return (
    <div className={`mt-4 rounded-md border p-4 ${
      isIncompatible 
        ? 'border-red-200 bg-red-50' 
        : 'border-yellow-200 bg-yellow-50'
    }`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className={`h-4 w-4 mt-0.5 ${
          isIncompatible ? 'text-red-600' : 'text-yellow-600'
        }`} />
        <div className="flex-1 space-y-2">
          <h4 className={`font-medium ${
            isIncompatible ? 'text-red-800' : 'text-yellow-800'
          }`}>
            Column Type Change Warning
          </h4>
          <p className={`text-sm ${
            isIncompatible ? 'text-red-700' : 'text-yellow-700'
          }`}>
            {warning}
          </p>
          {itemCount > 0 && (
            <p className={`text-sm font-medium ${
              isIncompatible ? 'text-red-700' : 'text-yellow-700'
            }`}>
              This will affect {itemCount} existing item{itemCount !== 1 ? 's' : ''} with data in this column.
            </p>
          )}
          <p className={`text-xs mt-1 ${
            isIncompatible ? 'text-red-600' : 'text-yellow-600'
          }`}>
            We recommend backing up your data before changing column types.
          </p>
        </div>
      </div>
    </div>
  );
};

