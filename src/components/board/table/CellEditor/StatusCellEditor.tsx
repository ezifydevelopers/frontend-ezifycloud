// Status cell editor (same as dropdown)

import React from 'react';
import { DropdownCellEditor } from './DropdownCellEditor';
import { Column } from '@/types/workspace';

interface StatusCellEditorProps {
  column: Column;
  value: unknown;
  onChange: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const StatusCellEditor: React.FC<StatusCellEditorProps> = (props) => {
  return <DropdownCellEditor {...props} />;
};

