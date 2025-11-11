// Table row component - single row with cells

import React from 'react';
import { TableRow as UITableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Copy,
  Edit,
  Trash2,
  Move,
  Archive,
  Send,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Item, Column } from '@/types/workspace';
import { ItemContextMenu } from '@/components/ui/item-context-menu';
import { ApprovalStatusBadge } from '../ApprovalStatusBadge';
import { ApprovalStatusIndicator } from '../ApprovalStatusIndicator';
import { StatusBadge } from './StatusBadge';
import { CellRenderer } from './CellRenderer';
import { CellEditor } from './CellEditor';
import { getCellValue } from './utils/tableUtils';
import { isOverdue, getOverdueStatus } from '@/utils/dueDateUtils';
import { cn } from '@/lib/utils';

interface TableRowProps {
  item: Item;
  columns: Column[];
  isSelected: boolean;
  isEditing: { itemId: string; columnId: string } | null;
  editValue: unknown;
  savingCell: boolean;
  workspaceMembers: Array<{ id: string; name: string; email: string; profilePicture?: string }>;
  itemApprovals: Record<string, any>;
  onSelect: (itemId: string) => void;
  onEdit: (itemId: string, columnId: string, currentValue: unknown) => void;
  onSave: (itemId: string, columnId: string, value: unknown) => void;
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
  workspaceId?: string;
  boardId: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  pinnedColumns?: Record<string, 'left' | 'right' | null>;
  columnWidths?: Record<string, number>;
  rowHeight?: number;
}

export const TableRow: React.FC<TableRowProps> = ({
  item,
  columns,
  isSelected,
  isEditing,
  editValue,
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
  workspaceId,
  boardId,
  isExpanded = false,
  onToggleExpand,
  pinnedColumns = {},
  columnWidths = {},
  rowHeight = 40,
}) => {
  const handleCellClick = (columnId: string) => {
    const value = getCellValue(item, columnId);
    onEdit(item.id, columnId, value);
  };

  // Check for overdue due date
  const dueDateColumn = columns.find(c => {
    const settings = c.settings as any;
    const name = c.name.toLowerCase();
    return settings?.isDueDate || name.includes('due date') || name.includes('duedate');
  });
  
  const dueDate = dueDateColumn ? getCellValue(item, dueDateColumn.id) : null;
  const isOverdueInvoice = dueDate ? isOverdue(String(dueDate)) : false;
  const dueStatus = dueDate ? getOverdueStatus(String(dueDate)) : null;

  return (
    <>
      <ItemContextMenu
        onEdit={() => onItemEdit?.(item)}
        onView={() => {
          if (workspaceId) {
            window.location.href = `/workspaces/${workspaceId}/boards/${boardId}/items/${item.id}`;
          }
        }}
        onDuplicate={() => onDuplicate?.(item)}
        onDelete={() => {
          if (confirm('Are you sure you want to delete this item?')) {
            onItemDelete?.(item);
          }
        }}
        onComment={() => onComment?.(item.id)}
        onAttachFile={() => onAttachFile?.(item.id)}
      >
            <UITableRow
              className={cn(
                "hover:bg-gray-50/50 border-b border-gray-200 transition-all duration-150 cursor-pointer group",
                isSelected && 'bg-blue-50 hover:bg-blue-100',
                isOverdueInvoice && 'bg-red-50/90 border-l-[3px] border-red-500 hover:bg-red-100/90',
                dueStatus?.status === 'due_soon' && !isOverdueInvoice && 'bg-yellow-50/90 border-l-[3px] border-yellow-500 hover:bg-yellow-100/90',
              )}
              style={{ height: `${rowHeight || 48}px` }}
            >
        <TableCell className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            {onToggleExpand && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(item.id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onComment?.(item.id)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Comments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAttachFile?.(item.id)}>
                <Paperclip className="h-4 w-4 mr-2" />
                Files
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onApproval?.(item.id)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                View Approvals
              </DropdownMenuItem>
              {onApproval && (
                <DropdownMenuItem onClick={() => onApproval(item.id)}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Approval
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate?.(item)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {onMove && (
                <DropdownMenuItem onClick={() => onMove(item)}>
                  <Move className="h-4 w-4 mr-2" />
                  Move to Board
                </DropdownMenuItem>
              )}
              {onCopy && (
                <DropdownMenuItem onClick={() => onCopy(item)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Board
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(item)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              {onItemEdit && (
                <DropdownMenuItem onClick={() => onItemEdit(item)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onItemDelete && (
                <DropdownMenuItem 
                  onClick={() => onItemDelete(item)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
            <TableCell className="px-2 sm:px-4 py-2 sm:py-2.5">
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <span className="font-semibold text-gray-900 text-sm truncate">{item.name || 'Untitled'}</span>
            {itemApprovals[item.id] && (
              <>
                <ApprovalStatusBadge
                  status={itemApprovals[item.id].overallStatus}
                  size="sm"
                />
                <ApprovalStatusIndicator
                  approvalStatus={itemApprovals[item.id]}
                  variant="minimal"
                  showApprover={false}
                  showDate={false}
                />
              </>
            )}
          </div>
        </TableCell>
        {columns.map((column) => {
          const value = getCellValue(item, column.id);
          const isCellEditing = isEditing?.itemId === item.id && isEditing?.columnId === column.id;
          const pinned = pinnedColumns[column.id];
          const colWidth = columnWidths[column.id] || column.width || 150;

          return (
                <TableCell
                  key={column.id}
                  className={cn(
                    'px-2 sm:px-4 py-2 sm:py-2.5',
                    pinned === 'left' && 'sticky left-0 z-10 bg-white',
                    pinned === 'right' && 'sticky right-0 z-10 bg-white',
                  )}
                  style={{
                    minWidth: `${Math.max(80, colWidth)}px`,
                    width: `${Math.max(80, colWidth)}px`,
                  }}
                >
              {isCellEditing ? (
                <CellEditor
                  column={column}
                  value={editValue}
                  onChange={() => {}} // Handled internally
                  onSave={() => onSave(item.id, column.id, editValue)}
                  onCancel={onCancel}
                  onKeyDown={(e) => onKeyDown(e, item.id, column.id)}
                  disabled={savingCell}
                  workspaceMembers={workspaceMembers}
                  itemId={item.id}
                  item={item}
                  columns={columns}
                />
              ) : (
                <CellRenderer
                  item={item}
                  column={column}
                  value={value}
                  onClick={() => handleCellClick(column.id)}
                  workspaceMembers={workspaceMembers}
                />
              )}
            </TableCell>
          );
        })}
        <TableCell className="px-2 sm:px-4 py-2 sm:py-2.5">
          {item.status ? (
            <StatusBadge status={item.status} size="sm" showIcon={item.status.toLowerCase().includes('overdue')} />
          ) : (
            <span className="text-gray-400 text-sm font-normal">—</span>
          )}
        </TableCell>
        <TableCell className="px-2 sm:px-4 py-2 sm:py-2.5"></TableCell>
        </UITableRow>
      </ItemContextMenu>
      {isExpanded && (
        <UITableRow className="bg-slate-50/50">
          <TableCell colSpan={columns.length + 4}>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Item ID</p>
                  <p className="text-sm">{item.id}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Created</p>
                  <p className="text-sm">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm">{new Date(item.updatedAt).toLocaleDateString()}</p>
                </div>
                {item.status && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                    <Badge variant="outline" className="capitalize">
                      {item.status}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                {onComment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onComment(item.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments
                  </Button>
                )}
                {onAttachFile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAttachFile(item.id)}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Files
                  </Button>
                )}
                {onApproval && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApproval(item.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approvals
                  </Button>
                )}
                {onItemEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onItemEdit(item)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Item
                  </Button>
                )}
              </div>
            </div>
          </TableCell>
        </UITableRow>
      )}
    </>
  );
};

