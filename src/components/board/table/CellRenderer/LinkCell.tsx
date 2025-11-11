// Link cell renderer (for EMAIL, PHONE, LINK types)

import React from 'react';
import { ColumnType } from '@/types/workspace';

interface LinkCellProps {
  type: ColumnType;
  value: string;
  onClick: () => void;
}

export const LinkCell: React.FC<LinkCellProps> = ({ type, value, onClick }) => {
  if (!value) {
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

  if (type === 'EMAIL') {
    return (
      <span 
        className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
        onClick={onClick}
        title="Click to edit"
      >
        <a 
          href={`mailto:${value}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      </span>
    );
  }

  if (type === 'PHONE') {
    return (
      <span 
        className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
        onClick={onClick}
        title="Click to edit"
      >
        <a 
          href={`tel:${value.replace(/[^\d+]/g, '')}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      </span>
    );
  }

  // LINK type
  const isValidUrl = value && (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//'));
  const hrefUrl = isValidUrl ? value : value ? `https://${value}` : '';

  return (
    <span 
      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
      onClick={onClick}
      title="Click to edit"
    >
      <a 
        href={hrefUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {value}
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </span>
  );
};

