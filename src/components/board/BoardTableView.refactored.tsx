// Refactored BoardTableView - Orchestrates all extracted components
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Item, Column } from '@/types/workspace';
import { ItemCommentsDialog } from './ItemCommentsDialog';
import { ItemFilesDialog } from './ItemFilesDialog';
import { ItemApprovalDialog } from './ItemApprovalDialog';
import { useKeyboardShortcuts, commonShortcuts } from '@/hooks/useKeyboardShortcuts';
import { TableToolbar } from './table/TableToolbar';
import { TableHeader } from './table/TableHeader';
import { TableBody } from './table/TableBody';
import { BulkActionsToolbar } from './table/BulkActionsToolbar';
import {
  useTableData,
  useCellEditing,
  useTableSelection,
  useTableActions,
  useItemApprovals,
  useColumnSettings,
} from './table/hooks';
import { filterItems, getVisibleColumns } from './table/utils/tableUtils';

interface BoardTableViewProps {
  boardId: string;
  workspaceId?: string;
  columns?: Column[];
  onItemCreate?: () => void;
  onItemEdit?: (item: Item) => void;
  onItemDelete?: (item: Item) => void;
  onColumnsChange?: () => void;
}

export const BoardTableView: React.FC<BoardTableViewProps> = ({
  boardId,
  workspaceId,
  columns = [],
  onItemCreate,
  onItemEdit,
  onItemDelete,
  onColumnsChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkActionDialog, setBulkActionDialog] = useState<'delete' | null>(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Custom hooks
  const {
    items,
    setItems,
    columns: boardColumns,
    loading,
    workspaceMembers,
    fetchItems,
    fetchColumns,
  } = useTableData({ boardId, workspaceId, initialColumns: columns });

  const {
    editingCell,
    editValue,
    setEditValue,
    savingCell,
    startEditing,
    cancelEditing,
    saveCell,
    handleKeyDown,
  } = useCellEditing({ onSaveSuccess: fetchItems });

  const {
    selectedItems,
    toggleItemSelection,
    toggleSelectAll,
    clearSelection,
  } = useTableSelection({ items });

  const {
    handleDeleteItem,
    handleDuplicateItem,
    handleBulkDelete: handleBulkDeleteAction,
  } = useTableActions({
    boardId,
    boardColumns,
    onSuccess: fetchItems,
    onItemDelete,
  });

  const { itemApprovals, fetchItemApproval } = useItemApprovals();

  const {
    columnWidths,
    pinnedColumns,
    handleColumnResize,
  } = useColumnSettings(boardColumns);

  // Filter and prepare data
  const visibleColumns = getVisibleColumns(boardColumns);
  const filteredItems = filterItems(items, searchTerm);

  // Handlers
  const handleCellClick = useCallback((itemId: string, columnId: string, currentValue: unknown, column: Column) => {
    if (column.type === 'LONG_TEXT' || column.type === 'FORMULA' || column.type === 'AUTO_NUMBER') {
      return;
    }
    startEditing(itemId, columnId, currentValue);
  }, [startEditing]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;
    await handleBulkDeleteAction(Array.from(selectedItems));
    clearSelection();
    setBulkActionDialog(null);
  }, [selectedItems, handleBulkDeleteAction, clearSelection]);

  const handleBulkDuplicate = useCallback(async () => {
    for (const itemId of selectedItems) {
      const item = items.find(i => i.id === itemId);
      if (item) await handleDuplicateItem(item);
    }
    clearSelection();
  }, [selectedItems, items, handleDuplicateItem, clearSelection]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...commonShortcuts.newItem,
      action: () => onItemCreate?.(),
    },
    {
      ...commonShortcuts.selectAll,
      action: () => toggleSelectAll(filteredItems),
    },
    {
      ...commonShortcuts.duplicate,
      action: () => {
        if (selectedItems.size === 1) {
          const itemId = Array.from(selectedItems)[0];
          const item = items.find(i => i.id === itemId);
          if (item) handleDuplicateItem(item);
        }
      },
    },
    {
      ...commonShortcuts.delete,
      action: () => {
        if (selectedItems.size > 0) {
          setBulkActionDialog('delete');
        }
      },
    },
  ]);

  const createDefaultColumns = useCallback(async () => {
    // This will be moved to a utility or hook
  }, []);

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="pb-4">
        <TableToolbar
          boardId={boardId}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCount={selectedItems.size}
          totalCount={filteredItems.length}
          onBulkDelete={() => setBulkActionDialog('delete')}
          onRefresh={() => {
            fetchItems();
            fetchColumns();
          }}
          onCreateItem={onItemCreate}
          columns={boardColumns}
          onImportComplete={() => {
            fetchItems();
            fetchColumns();
            onColumnsChange?.();
          }}
        />
      </CardHeader>
      
      {selectedItems.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedItems.size}
          totalCount={filteredItems.length}
          onBulkDelete={handleBulkDelete}
          onBulkDuplicate={handleBulkDuplicate}
          onClearSelection={clearSelection}
          onSelectAll={() => toggleSelectAll(filteredItems)}
        />
      )}

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : visibleColumns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No columns defined for this board.</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={fetchColumns}>
                Load Columns
              </Button>
              <Button onClick={createDefaultColumns}>
                Create Default Columns
              </Button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No items found matching your search.' : 'No items yet. Create your first item to get started!'}
            </p>
            {onItemCreate && !searchTerm && (
              <Button onClick={onItemCreate}>
                Create First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <UITableHeader>
                <TableHeader
                  columns={visibleColumns}
                  columnWidths={columnWidths}
                  pinnedColumns={pinnedColumns}
                  onColumnResize={handleColumnResize}
                  selectedCount={selectedItems.size}
                  totalCount={filteredItems.length}
                  onSelectAll={() => toggleSelectAll(filteredItems)}
                />
              </UITableHeader>
              <TableBody
                items={filteredItems}
                columns={visibleColumns}
                selectedItems={selectedItems}
                editingCell={editingCell}
                editValue={editValue}
                setEditValue={setEditValue}
                savingCell={savingCell}
                workspaceMembers={workspaceMembers}
                itemApprovals={itemApprovals}
                onSelect={toggleItemSelection}
                onEdit={handleCellClick}
                onSave={(itemId, columnId) => saveCell(itemId, columnId)}
                onCancel={cancelEditing}
                onKeyDown={handleKeyDown}
                onItemEdit={onItemEdit}
                onItemDelete={handleDeleteItem}
                onDuplicate={handleDuplicateItem}
                onComment={(itemId) => {
                  setSelectedItemId(itemId);
                  setCommentsDialogOpen(true);
                }}
                onAttachFile={(itemId) => {
                  setSelectedItemId(itemId);
                  setFilesDialogOpen(true);
                }}
                onApproval={(itemId) => {
                  setSelectedItemId(itemId);
                  setApprovalDialogOpen(true);
                  fetchItemApproval(itemId);
                }}
                workspaceId={workspaceId}
                boardId={boardId}
              />
            </Table>
          </div>
        )}
      </CardContent>

      {selectedItemId && (
        <>
          <ItemCommentsDialog
            open={commentsDialogOpen}
            onOpenChange={(open) => {
              setCommentsDialogOpen(open);
              if (!open && !filesDialogOpen && !approvalDialogOpen) {
                setSelectedItemId(null);
              }
            }}
            itemId={selectedItemId}
            itemName={items.find(i => i.id === selectedItemId)?.name}
            workspaceId={workspaceId}
          />
          <ItemFilesDialog
            open={filesDialogOpen}
            onOpenChange={(open) => {
              setFilesDialogOpen(open);
              if (!open && !commentsDialogOpen && !approvalDialogOpen) {
                setSelectedItemId(null);
              }
            }}
            itemId={selectedItemId}
            itemName={items.find(i => i.id === selectedItemId)?.name}
          />
          <ItemApprovalDialog
            open={approvalDialogOpen}
            onOpenChange={(open) => {
              setApprovalDialogOpen(open);
              if (!open && !commentsDialogOpen && !filesDialogOpen) {
                setSelectedItemId(null);
              } else if (open) {
                if (selectedItemId) {
                  fetchItemApproval(selectedItemId);
                }
              }
            }}
            itemId={selectedItemId!}
            itemName={items.find(i => i.id === selectedItemId)?.name}
          />
        </>
      )}

      {bulkActionDialog === 'delete' && (
        <Dialog open={true} onOpenChange={(open) => !open && setBulkActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Selected Items</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedItems.size} item(s)? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkActionDialog(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete}>
                Delete {selectedItems.size} Item(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

