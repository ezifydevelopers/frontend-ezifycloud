// Main cell renderer dispatcher
// Routes to appropriate cell renderer based on column type

import React from 'react';
import { Item, Column } from '@/types/workspace';
import { TextCell } from './TextCell';
import { NumberCell } from './NumberCell';
import { DateCell } from './DateCell';
import { CheckboxCell } from './CheckboxCell';
import { DropdownCell } from './DropdownCell';
import { MultiSelectCell } from './MultiSelectCell';
import { StatusCell } from './StatusCell';
import { PeopleCell } from './PeopleCell';
import { FileCell } from './FileCell';
import { RatingCell } from './RatingCell';
import { CurrencyCell } from './CurrencyCell';
import { PercentageCell } from './PercentageCell';
import { LinkCell } from './LinkCell';
import { RadioCell } from './RadioCell';
import { TimelineCell } from './TimelineCell';
import { AutoNumberCell } from './AutoNumberCell';
import { LongTextCell } from './LongTextCell';
import { VoteCell } from './VoteCell';
import { ProgressCell } from './ProgressCell';
import { LocationCell } from './LocationCell';
import { LineItemsCell } from './LineItemsCell';
import { PaymentTrackingCell } from './PaymentTrackingCell';
import { DueDateCell } from './DueDateCell';
import { getCellValue } from '../utils/tableUtils';

interface CellRendererProps {
  item: Item;
  column: Column;
  value: unknown;
  onClick: () => void;
  workspaceMembers?: Array<{ id: string; name: string; email: string; profilePicture?: string }>;
}

export const CellRenderer: React.FC<CellRendererProps> = ({
  item,
  column,
  value,
  onClick,
  workspaceMembers = [],
}) => {
  // Get column settings once at the top
  const settings = column.settings as any;
  const colName = column.name.toLowerCase();

  // Handle empty values
  if (value === null || value === undefined || (value === '' && column.type !== 'CHECKBOX')) {
    return (
      <span 
        className="text-muted-foreground cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
        onClick={onClick}
        title="Click to edit"
      >
        —
      </span>
    );
  }

  // Route to appropriate cell renderer
  switch (column.type) {
    case 'TEXT':
      return <TextCell value={String(value)} onClick={onClick} />;
    
    case 'EMAIL':
    case 'PHONE':
    case 'LINK':
      return <LinkCell type={column.type} value={String(value)} onClick={onClick} />;
    
    case 'LONG_TEXT':
      return <LongTextCell value={String(value)} onClick={onClick} />;
    
    case 'NUMBER':
      return <NumberCell value={value} onClick={onClick} />;
    
    case 'CURRENCY':
      return <CurrencyCell value={value} column={column} onClick={onClick} />;
    
    case 'PERCENTAGE':
      return <PercentageCell value={value} onClick={onClick} />;
    
    case 'RATING':
      return <RatingCell value={value} onClick={onClick} />;
    
    case 'AUTO_NUMBER':
      return <AutoNumberCell value={value} />;
    
    case 'DATE':
    case 'DATETIME':
    case 'WEEK':
    case 'MONTH':
    case 'YEAR':
      // Check if this is a due date column
      const isDueDate = settings?.isDueDate || colName.includes('due date') || colName.includes('duedate');
      
      if (isDueDate && column.type === 'DATE') {
        return <DueDateCell value={value} onClick={onClick} isDueDate={true} />;
      }
      return <DateCell type={column.type} value={value} onClick={onClick} />;
    
    case 'TIMELINE':
      return <TimelineCell value={value} onClick={onClick} />;
    
    case 'CHECKBOX':
      return <CheckboxCell value={value as boolean} onClick={onClick} />;
    
    case 'DROPDOWN':
    case 'RADIO':
      return <DropdownCell value={String(value)} onClick={onClick} />;
    
    case 'STATUS':
      return <StatusCell value={String(value)} onClick={onClick} column={column} />;
    
    case 'MULTI_SELECT':
      return <MultiSelectCell value={value} onClick={onClick} />;
    
    case 'PEOPLE':
      return (
        <PeopleCell
          value={value}
          column={column}
          onClick={onClick}
          workspaceMembers={workspaceMembers}
        />
      );
    
    case 'FILE':
      return <FileCell value={value} column={column} onClick={onClick} />;
    
    case 'VOTE':
      return <VoteCell value={value} onClick={onClick} />;
    
    case 'PROGRESS':
      return <ProgressCell value={value} onClick={onClick} />;
    
    case 'LOCATION':
      return <LocationCell value={value} onClick={onClick} />;
    
    default:
      // Check if this is a line items column (by column settings or name)
      if (settings?.isLineItems || colName.includes('line items') || colName.includes('lineitems')) {
        const currency = settings?.currency || (column.settings as any)?.currency || 'USD';
        return <LineItemsCell value={value} onClick={onClick} currency={currency} />;
      }
      // Check if this is a payment tracking column
      if (settings?.isPaymentTracking || colName.includes('payment') || colName.includes('payments')) {
        const currency = settings?.currency || (column.settings as any)?.currency || 'USD';
        return <PaymentTrackingCell value={value} onClick={onClick} currency={currency} />;
      }
      return <TextCell value={String(value)} onClick={onClick} />;
  }
};

