// File cell editor

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Column } from '@/types/workspace';
import { FileColumnUpload } from '../../FileColumnUpload';

interface FileCellEditorProps {
  column: Column;
  value: unknown;
  onChange?: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
  itemId: string;
}

export const FileCellEditor: React.FC<FileCellEditorProps> = ({
  column,
  value,
  onChange,
  onSave,
  onCancel,
  disabled = false,
  itemId,
}) => {
  const fileSettings = column.settings as { fileType?: 'single' | 'multiple'; allowedFileTypes?: string[]; maxFileSize?: number } | undefined;
  const isMultiple = fileSettings?.fileType === 'multiple';
  const allowedFileTypes = fileSettings?.allowedFileTypes ?? [];
  const maxFileSize = fileSettings?.maxFileSize ?? 5;

  return (
    <div className="flex items-center gap-1">
      <FileColumnUpload
        itemId={itemId}
        columnId={column.id}
        value={value as string | string[] | null | undefined}
        fileType={isMultiple ? 'multiple' : 'single'}
        allowedFileTypes={allowedFileTypes}
        maxFileSize={maxFileSize}
        onValueChange={(fileIds) => {
          onChange?.(fileIds);
          onSave();
        }}
        className="min-w-[300px]"
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={onCancel}
        disabled={disabled}
      >
        <X className="h-3 w-3 text-red-600" />
      </Button>
    </div>
  );
};

