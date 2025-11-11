// Table body component - renders all table rows

import React from 'react';
import { TableBody as UITableBody } from '@/components/ui/table';
import { Item, Column } from '@/types/workspace';
import { TableRow } from './TableRow';
import { QuickCreateRow } from './QuickCreateRow';
import { GroupHeader, GroupedData, GroupConfig } from './TableGrouping';
import { GroupTotals } from './GroupTotals';

interface TableBodyProps {
  items: Item[];
  columns: Column[];
  selectedItems: Set<string>;
  editingCell: { itemId: string; columnId: string } | null;
  editValue: unknown;
  setEditValue: (value: unknown) => void;
  savingCell: boolean;
  workspaceMembers: Array<{ id: string; name: string; email: string; profilePicture?: string }>;
  itemApprovals: Record<string, any>;
  onSelect: (itemId: string) => void;
  onEdit: (itemId: string, columnId: string, currentValue: unknown) => void;
  onSave: (itemId: string, columnId: string, value?: unknown) => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent, itemId: string, columnId: string) => void;
  onItemEdit?: (item: Item) => void;
  onItemDelete?: (item: Item) => void;
  onDuplicate?: (item: Item) => void;
  onMove?: (item: Item) => void;
  onCopy?: (item: Item) => void;
  onArchive?: (item: Item) => void;
  onComment?: (itemId: string) => void;
  onAttachFile?: (itemId: string) => void;
  onApproval?: (itemId: string) => void;
  onSubmitForApproval?: (item: Item) => void;
  workspaceId?: string;
  boardId: string;
  showQuickCreate?: boolean;
  onItemCreated?: () => void;
  groupedData?: GroupedData[] | null;
  groupConfig?: GroupConfig;
  onGroupToggle?: (groupKey: string) => void;
  expandedRows?: Set<string>;
  onToggleRowExpand?: (itemId: string) => void;
  pinnedColumns?: Record<string, 'left' | 'right' | null>;
  columnWidths?: Record<string, number>;
  rowHeight?: number;
}

export const TableBody: React.FC<TableBodyProps> = ({
  items,
  columns,
  selectedItems,
  editingCell,
  editValue,
  setEditValue,
  savingCell,
  workspaceMembers,
  itemApprovals,
  onSelect,
  onEdit,
  onSave,
  onCancel,
  onKeyDown,
  onItemEdit,
  onItemDelete,
  onDuplicate,
  onMove,
  onCopy,
  onArchive,
  onComment,
  onAttachFile,
  onApproval,
  onSubmitForApproval,
  workspaceId,
  boardId,
  showQuickCreate = true,
  onItemCreated,
  groupedData,
  groupConfig,
  onGroupToggle,
  expandedRows = new Set(),
  onToggleRowExpand,
  pinnedColumns = {},
  columnWidths = {},
  rowHeight = 40,
}) => {
  // Get column for grouping display
  const groupColumn = groupConfig?.columnId
    ? columns.find(c => c.id === groupConfig.columnId)
    : undefined;

  return (
    <UITableBody>
      {/* Quick create row at the top */}
      {showQuickCreate && !groupConfig?.columnId && (
        <QuickCreateRow
          columns={columns}
          workspaceMembers={workspaceMembers}
          onSuccess={onItemCreated}
          boardId={boardId}
        />
      )}
      
      {groupedData && groupConfig ? (
        // Render grouped items
        groupedData.map((group) => {
          const isExpanded = groupConfig.expandedGroups.has(group.groupKey);
          
          return (
            <React.Fragment key={group.groupKey}>
              <GroupHeader
                group={group}
                isExpanded={isExpanded}
                onToggle={() => onGroupToggle?.(group.groupKey)}
                column={groupColumn}
              />
              {isExpanded && (
                <>
                  {group.items.map((item) => (
                    <TableRow
                      key={item.id}
                      item={item}
                      columns={columns}
                      isSelected={selectedItems.has(item.id)}
                      isEditing={editingCell}
                      editValue={editValue}
                      setEditValue={setEditValue}
                      savingCell={savingCell}
                      workspaceMembers={workspaceMembers}
                      itemApprovals={itemApprovals}
                      onSelect={onSelect}
                      onEdit={onEdit}
                      onSave={onSave}
                      onCancel={onCancel}
                      onKeyDown={onKeyDown}
                      onItemEdit={onItemEdit}
                      onItemDelete={onItemDelete}
                      onDuplicate={onDuplicate}
                      onMove={onMove}
                      onCopy={onCopy}
                      onArchive={onArchive}
                      onComment={onComment}
                      onAttachFile={onAttachFile}
                      onApproval={onApproval}
                      workspaceId={workspaceId}
                      boardId={boardId}
                      isExpanded={expandedRows.has(item.id)}
                      onToggleExpand={() => onToggleRowExpand?.(item.id)}
                      pinnedColumns={pinnedColumns}
                      columnWidths={columnWidths}
                      rowHeight={rowHeight}
                    />
                  ))}
                  <GroupTotals
                    items={group.items}
                    columns={columns}
                    groupValue={group.groupValue}
                  />
                </>
              )}
            </React.Fragment>
          );
        })
      ) : (
        // Render ungrouped items
        items.map((item) => (
          <TableRow
            key={item.id}
            item={item}
            columns={columns}
            isSelected={selectedItems.has(item.id)}
            isEditing={editingCell}
            editValue={editValue}
            setEditValue={setEditValue}
            savingCell={savingCell}
            workspaceMembers={workspaceMembers}
            itemApprovals={itemApprovals}
            onSelect={onSelect}
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
            onKeyDown={onKeyDown}
            onItemEdit={onItemEdit}
            onItemDelete={onItemDelete}
            onDuplicate={onDuplicate}
            onMove={onMove}
            onCopy={onCopy}
            onArchive={onArchive}
            onComment={onComment}
            onAttachFile={onAttachFile}
            onApproval={onApproval}
            workspaceId={workspaceId}
            boardId={boardId}
            isExpanded={expandedRows.has(item.id)}
            onToggleExpand={() => onToggleRowExpand?.(item.id)}
            pinnedColumns={pinnedColumns}
            columnWidths={columnWidths}
            rowHeight={rowHeight}
          />
        ))
      )}
    </UITableBody>
  );
};

