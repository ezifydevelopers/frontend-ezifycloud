// Main cell editor dispatcher
// Routes to appropriate cell editor based on column type

import React from 'react';
import { Column, Item } from '@/types/workspace';
import { TextCellEditor } from './TextCellEditor';
import { NumberCellEditor } from './NumberCellEditor';
import { DateCellEditor } from './DateCellEditor';
import { CheckboxCellEditor } from './CheckboxCellEditor';
import { DropdownCellEditor } from './DropdownCellEditor';
import { MultiSelectCellEditor } from './MultiSelectCellEditor';
import { StatusCellEditor } from './StatusCellEditor';
import { PeopleCellEditor } from './PeopleCellEditor';
import { FileCellEditor } from './FileCellEditor';
import { RatingCellEditor } from './RatingCellEditor';
import { CurrencyCellEditor } from './CurrencyCellEditor';
import { PercentageCellEditor } from './PercentageCellEditor';
import { LinkCellEditor } from './LinkCellEditor';
import { RadioCellEditor } from './RadioCellEditor';
import { TimelineCellEditor } from './TimelineCellEditor';
import { LongTextCellEditor } from './LongTextCellEditor';
import { AutoNumberCellEditor } from './AutoNumberCellEditor';
import { VoteCellEditor } from './VoteCellEditor';
import { ProgressCellEditor } from './ProgressCellEditor';
import { LocationCellEditor } from './LocationCellEditor';
import { LineItemsCellEditor } from './LineItemsCellEditor';
import { PaymentTrackingCellEditor } from './PaymentTrackingCellEditor';
import { DueDateCellEditor } from './DueDateCellEditor';

interface CellEditorProps {
  column: Column;
  value: unknown;
  onChange?: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  workspaceMembers?: Array<{ id: string; name: string; email: string; profilePicture?: string }>;
  itemId: string;
  item?: Item; // Full item data for accessing other cells
  columns?: Column[]; // All columns for finding related data
  disableBlurSave?: boolean; // Option to disable auto-save on blur (for quick create)
}

export const CellEditor: React.FC<CellEditorProps> = ({
  column,
  value,
  onChange,
  onSave,
  onCancel,
  onKeyDown,
  disabled = false,
  workspaceMembers = [],
  itemId,
  item,
  columns = [],
  disableBlurSave = false,
}) => {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Get column settings once at the top
  const settings = column.settings as any;
  const colName = column.name.toLowerCase();

  const commonProps = {
    value: localValue,
    onChange: (newValue: unknown) => {
      setLocalValue(newValue);
      onChange?.(newValue);
    },
    onSave,
    onCancel,
    onKeyDown,
    disabled,
    disableBlurSave,
  };

  // Route to appropriate cell editor
  switch (column.type) {
    case 'TEXT':
      return <TextCellEditor {...commonProps} disableBlurSave={disableBlurSave} />;
    
    case 'EMAIL':
    case 'PHONE':
    case 'LINK':
      return <LinkCellEditor type={column.type} {...commonProps} disableBlurSave={disableBlurSave} />;
    
    case 'LONG_TEXT':
      return <LongTextCellEditor {...commonProps} disableBlurSave={disableBlurSave} />;
    
    case 'NUMBER':
      return <NumberCellEditor column={column} {...commonProps} disableBlurSave={disableBlurSave} />;
    
    case 'CURRENCY':
      return <CurrencyCellEditor column={column} {...commonProps} disableBlurSave={disableBlurSave} />;
    
    case 'PERCENTAGE':
      return <PercentageCellEditor {...commonProps} disableBlurSave={disableBlurSave} />;
    
    case 'RATING':
      return <RatingCellEditor {...commonProps} />;
    
    case 'AUTO_NUMBER':
      return <AutoNumberCellEditor value={value} />;
    
    case 'DATE':
    case 'DATETIME':
    case 'WEEK':
    case 'MONTH':
    case 'YEAR':
      // Check if this is a due date column
      const isDueDate = settings?.isDueDate || colName.includes('due date') || colName.includes('duedate');
      
      if (isDueDate && column.type === 'DATE') {
        return (
          <DueDateCellEditor
            value={localValue}
            onChange={(newValue) => {
              setLocalValue(newValue);
              onChange?.(newValue);
            }}
            onSave={onSave}
            onCancel={onCancel}
            onKeyDown={onKeyDown}
            disabled={disabled}
            item={item}
            columns={columns}
            column={column}
          />
        );
      }
      return <DateCellEditor type={column.type} {...commonProps} disableBlurSave={disableBlurSave} />;
    
    case 'TIMELINE':
      return <TimelineCellEditor {...commonProps} />;
    
    case 'CHECKBOX':
      return <CheckboxCellEditor {...commonProps} />;
    
    case 'DROPDOWN':
    case 'STATUS':
      return <DropdownCellEditor column={column} {...commonProps} />;
    
    case 'RADIO':
      return <RadioCellEditor column={column} {...commonProps} />;
    
    case 'MULTI_SELECT':
      return <MultiSelectCellEditor column={column} {...commonProps} />;
    
    case 'PEOPLE':
      return (
        <PeopleCellEditor
          column={column}
          {...commonProps}
          workspaceMembers={workspaceMembers}
        />
      );
    
    case 'FILE':
      return (
        <FileCellEditor
          column={column}
          {...commonProps}
          itemId={itemId}
        />
      );
    
    case 'VOTE':
      return <VoteCellEditor {...commonProps} />;
    
    case 'PROGRESS':
      return <ProgressCellEditor {...commonProps} />;
    
    case 'LOCATION':
      return <LocationCellEditor {...commonProps} />;
    
    default:
      // Check if this is a line items column (by column settings or name)
      if (settings?.isLineItems || colName.includes('line items') || colName.includes('lineitems')) {
        const currency = settings?.currency || 'USD';
        return (
          <LineItemsCellEditor
            value={localValue}
            onChange={(newValue) => {
              setLocalValue(newValue);
              onChange?.(newValue);
            }}
            onClose={() => {
              onSave(); // Save when closing
              onCancel();
            }}
            currency={currency}
            columnId={column.id}
          />
        );
      }
      // Check if this is a payment tracking column
      if (settings?.isPaymentTracking || colName.includes('payment') || colName.includes('payments')) {
        const currency = settings?.currency || 'USD';
        
        // Try to find total amount from payment tracking data, line items, or invoice calculations
        let totalAmount: number | undefined;
        if (typeof localValue === 'object' && localValue !== null && 'totalAmount' in localValue) {
          totalAmount = (localValue as any).totalAmount;
        } else if (item && columns.length > 0) {
          // Try to find invoice total from line items or calculations
          const lineItemsColumn = columns.find(c => {
            const settings = c.settings as any;
            const name = c.name.toLowerCase();
            return settings?.isLineItems || name.includes('line items') || name.includes('lineitems');
          });
          
          if (lineItemsColumn && item.cells?.[lineItemsColumn.id]) {
            const lineItems = item.cells[lineItemsColumn.id] as any[];
            if (Array.isArray(lineItems)) {
              totalAmount = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
            }
          }
          
          // Or try to find from invoice calculations/total column
          if (!totalAmount) {
            const totalColumn = columns.find(c => {
              const name = c.name.toLowerCase();
              return name.includes('total') || name.includes('amount');
            });
            if (totalColumn && item.cells?.[totalColumn.id]) {
              const total = item.cells[totalColumn.id];
              if (typeof total === 'number') {
                totalAmount = total;
              }
            }
          }
        }
        
        return (
          <PaymentTrackingCellEditor
            value={localValue}
            onChange={(newValue) => {
              setLocalValue(newValue);
              onChange?.(newValue);
            }}
            onClose={() => {
              onSave(); // Save when closing
              onCancel();
            }}
            currency={currency}
            totalAmount={totalAmount}
          />
        );
      }
      return <TextCellEditor {...commonProps} />;
  }
};

