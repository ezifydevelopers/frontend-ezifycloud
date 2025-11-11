// File cell renderer

import React from 'react';
import { Column } from '@/types/workspace';
import { FileIcon } from 'lucide-react';

interface FileCellProps {
  value: unknown;
  column: Column;
  onClick: () => void;
}

export const FileCell: React.FC<FileCellProps> = ({ value, column, onClick }) => {
  const fileSettings = column.settings as { fileType?: 'single' | 'multiple'; allowedFileTypes?: string[]; maxFileSize?: number } | undefined;
  const isMultiple = fileSettings?.fileType === 'multiple';
  const fileIds = Array.isArray(value)
    ? value.map(id => String(id))
    : value
    ? [String(value)]
    : [];

  if (fileIds.length === 0) {
    return (
      <span
        className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
        onClick={onClick}
        title="Click to upload files"
      >
        —
      </span>
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to manage files"
    >
      <div className="flex items-center gap-1 flex-wrap">
        <FileIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {fileIds.length} file{fileIds.length > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

