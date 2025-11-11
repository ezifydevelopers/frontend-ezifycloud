// Bulk actions toolbar component

import React from 'react';
import { BulkActionsToolbar as UIBulkActionsToolbar } from '@/components/ui/bulk-actions-toolbar';
import { Trash2, Copy, Edit2, Move, Archive, Tag, UserPlus } from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onBulkDelete: () => void;
  onBulkDuplicate: () => void;
  onBulkEdit?: () => void;
  onBulkMove?: () => void;
  onBulkCopy?: () => void;
  onBulkArchive?: () => void;
  onBulkStatusChange?: () => void;
  onBulkAssign?: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  totalCount,
  onBulkDelete,
  onBulkDuplicate,
  onBulkEdit,
  onBulkMove,
  onBulkCopy,
  onBulkArchive,
  onBulkStatusChange,
  onBulkAssign,
  onClearSelection,
  onSelectAll,
}) => {
  if (selectedCount === 0) return null;

  const actions = [
    {
      label: 'Edit',
      icon: Edit2,
      onClick: onBulkEdit,
    },
    {
      label: 'Status',
      icon: Tag,
      onClick: onBulkStatusChange,
    },
    {
      label: 'Assign',
      icon: UserPlus,
      onClick: onBulkAssign,
    },
    {
      label: 'Duplicate',
      icon: Copy,
      onClick: onBulkDuplicate,
    },
    {
      label: 'Move',
      icon: Move,
      onClick: onBulkMove,
    },
    {
      label: 'Copy',
      icon: Copy,
      onClick: onBulkCopy,
    },
    {
      label: 'Archive',
      icon: Archive,
      onClick: onBulkArchive,
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: onBulkDelete,
      variant: 'destructive' as const,
    },
  ].filter(action => action.onClick !== undefined); // Filter out undefined actions

  return (
    <UIBulkActionsToolbar
      selectedCount={selectedCount}
      totalCount={totalCount}
      actions={actions}
      onClearSelection={onClearSelection}
      onSelectAll={onSelectAll}
    />
  );
};

