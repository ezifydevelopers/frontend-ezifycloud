// Refactored BoardTableView - Orchestrates all extracted components
import React, { useState, useCallback, useEffect } from 'react';
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
import { BulkEditDialog } from './BulkEditDialog';
import { ItemMoveCopyDialog } from './ItemMoveCopyDialog';
import { SubmitForApprovalDialog } from './SubmitForApprovalDialog';
import { itemAPI } from '@/lib/api';
import { useKeyboardShortcuts, commonShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useWebSocket, WebSocketEventType } from '@/hooks/useWebSocket';
import { ConnectionStatus } from '@/components/websocket/ConnectionStatus';
import { PresenceIndicator } from '@/components/websocket/PresenceIndicator';
import { useToast } from '@/hooks/use-toast';
import { Eye, Filter, Search, FileText, Plus, Columns, ArrowUpDown, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableToolbar } from './table/TableToolbar';
import { TableHeader as CustomTableHeader } from './table/TableHeader';
import { TableBody } from './table/TableBody';
import { BulkActionsToolbar } from './table/BulkActionsToolbar';
import { Table, TableHeader as UITableHeader } from '@/components/ui/table';
import {
  useTableData,
  useCellEditing,
  useTableSelection,
  useTableActions,
  useItemApprovals,
  useColumnSettings,
} from './table/hooks';
import { applyAllFilters, getVisibleColumns, sortItems, toggleSort, SortConfig } from './table/utils/tableUtils';
import { TableSorting } from './table/TableSorting';
import { TableFilters, TableFilter } from './table/TableFilters';
import { TableGrouping, GroupConfig, groupItems, GroupHeader } from './table/TableGrouping';
import { GroupTotals } from './table/GroupTotals';
import { QuickFilters } from './table/QuickFilters';
import { SavedFilters } from './table/SavedFilters';
import { SavedSorts } from './table/SavedSorts';
import { ColumnVisibilityDialog } from './table/ColumnVisibilityDialog';
import { RowHeightControl } from './table/RowHeightControl';
import { TableControlsDialog } from './table/TableControlsDialog';

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
  const [columnFilters, setColumnFilters] = useState<TableFilter[]>([]);
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);
  const [groupConfig, setGroupConfig] = useState<GroupConfig>({
    columnId: null,
    expandedGroups: new Set(),
  });
  const [bulkActionDialog, setBulkActionDialog] = useState<'delete' | null>(null);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [moveCopyDialogOpen, setMoveCopyDialogOpen] = useState(false);
  const [moveCopyMode, setMoveCopyMode] = useState<'move' | 'copy'>('move');
  const [moveCopyItems, setMoveCopyItems] = useState<Item[]>([]);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [submitApprovalDialogOpen, setSubmitApprovalDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [columnVisibilityDialogOpen, setColumnVisibilityDialogOpen] = useState(false);
  const [activeViewers, setActiveViewers] = useState<Map<string, Array<{ userId: string; userName: string; userAvatar?: string }>>>(new Map());
  const [activeEditors, setActiveEditors] = useState<Map<string, Array<{ userId: string; userName: string; userAvatar?: string; cellId?: string; columnId?: string }>>>(new Map());
  const [cellEditors, setCellEditors] = useState<Map<string, Array<{ userId: string; userName: string; userAvatar?: string }>>>(new Map());
  const { toast } = useToast();

  // WebSocket for real-time updates
  const { isConnected, subscribeToBoard, unsubscribeFromBoard, on, off } = useWebSocket({
    enabled: true,
  });

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
    validationError,
    startEditing,
    cancelEditing,
    saveCell,
    handleKeyDown,
  } = useCellEditing({ columns: boardColumns, items, onSaveSuccess: fetchItems });

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
    columnOrder,
    hiddenColumns,
    rowHeight,
    handleColumnResize,
    handleColumnPin,
    handleColumnReorder,
    handleToggleColumnVisibility,
    handleRowHeightChange,
    getOrderedColumns,
  } = useColumnSettings(boardColumns, boardId);

  // Subscribe to board for real-time updates
  useEffect(() => {
    if (isConnected && boardId) {
      subscribeToBoard(boardId);
    }

    return () => {
      if (boardId) {
        unsubscribeFromBoard(boardId);
      }
    };
  }, [isConnected, boardId, subscribeToBoard, unsubscribeFromBoard]);

  // Handle real-time item events
  useEffect(() => {
    if (!isConnected) return;

    // Item created
    const unsubscribeCreated = on(WebSocketEventType.ITEM_CREATED, (message) => {
      const payload = message.payload as { item: unknown; boardId: string };
      if (payload.boardId === boardId) {
        fetchItems(); // Refresh items list
      }
    });

    // Item updated
    const unsubscribeUpdated = on(WebSocketEventType.ITEM_UPDATED, (message) => {
      const payload = message.payload as { item: { id: string; name?: string; status?: string }; boardId: string };
      if (payload.boardId === boardId) {
        // Update item in local state
        setItems(prevItems => {
          const index = prevItems.findIndex(item => item.id === payload.item.id);
          if (index !== -1) {
            const updated = [...prevItems];
            updated[index] = { ...updated[index], ...payload.item };
            return updated;
          }
          return prevItems;
        });
      }
    });

    // Item deleted
    const unsubscribeDeleted = on(WebSocketEventType.ITEM_DELETED, (message) => {
      const payload = message.payload as { itemId: string; boardId: string };
      if (payload.boardId === boardId) {
        setItems(prevItems => prevItems.filter(item => item.id !== payload.itemId));
      }
    });

    // Status changed
    const unsubscribeStatusChanged = on(WebSocketEventType.ITEM_STATUS_CHANGED, (message) => {
      const payload = message.payload as { itemId: string; newStatus: string; boardId: string };
      if (payload.boardId === boardId) {
        setItems(prevItems => {
          const index = prevItems.findIndex(item => item.id === payload.itemId);
          if (index !== -1) {
            const updated = [...prevItems];
            updated[index] = { ...updated[index], status: payload.newStatus };
            return updated;
          }
          return prevItems;
        });
      }
    });

    // Presence events
    const unsubscribeViewers = on('presence:viewers_changed', (message) => {
      const payload = message.payload as { itemId: string; viewers: Array<{ userId: string; userName: string; userAvatar?: string }> };
      if (payload.itemId) {
        setActiveViewers(prev => {
          const updated = new Map(prev);
          updated.set(payload.itemId, payload.viewers);
          return updated;
        });
      }
    });

    const unsubscribeEditors = on('presence:editors_changed', (message) => {
      const payload = message.payload as {
        itemId: string;
        cellId?: string;
        itemEditors: Array<{ userId: string; userName: string; userAvatar?: string; cellId?: string; columnId?: string }>;
        cellEditors: Array<{ userId: string; userName: string; userAvatar?: string; cellId?: string; columnId?: string }>;
      };
      if (payload.itemId) {
        setActiveEditors(prev => {
          const updated = new Map(prev);
          updated.set(payload.itemId, payload.itemEditors);
          return updated;
        });
        if (payload.cellId && payload.cellEditors) {
          setCellEditors(prev => {
            const updated = new Map(prev);
            updated.set(payload.cellId!, payload.cellEditors);
            return updated;
          });
        }
      }
    });

    // Show toast for important events
    const unsubscribeItemCreatedToast = on(WebSocketEventType.ITEM_CREATED, (message) => {
      const payload = message.payload as { item: { name: string }; boardId: string };
      if (payload.boardId === boardId && payload.item.name) {
        toast({
          title: 'New item created',
          description: `"${payload.item.name}" was added to this board`,
        });
      }
    });

    const unsubscribeItemDeletedToast = on(WebSocketEventType.ITEM_DELETED, (message) => {
      const payload = message.payload as { itemId: string; boardId: string };
      if (payload.boardId === boardId) {
        toast({
          title: 'Item deleted',
          description: 'An item was removed from this board',
        });
      }
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeStatusChanged();
      unsubscribeViewers();
      unsubscribeEditors();
      unsubscribeItemCreatedToast();
      unsubscribeItemDeletedToast();
    };
  }, [isConnected, boardId, on, off, setItems, fetchItems, toast]);

  // Filter and prepare data
  const orderedColumns = getOrderedColumns(boardColumns);
  // Filter out hidden columns
  const visibleColumns = getVisibleColumns(orderedColumns).filter(
    col => !hiddenColumns.has(col.id)
  );
  
  const filteredItems = applyAllFilters(items, searchTerm, columnFilters, boardColumns);
  
  // Apply sorting
  const sortedItems = sortConfigs.length > 0
    ? sortItems(filteredItems, sortConfigs, boardColumns)
    : filteredItems;
  
  // Group items if grouping is enabled
  const groupedData = groupConfig.columnId
    ? groupItems(sortedItems, groupConfig, boardColumns)
    : null;
  
  // Flatten grouped items for display (respecting expanded/collapsed state)
  const displayItems = groupedData
    ? groupedData.flatMap(group => {
        const isExpanded = groupConfig.expandedGroups.has(group.groupKey);
        return isExpanded ? group.items : [];
      })
    : sortedItems;

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
    <div className="w-full h-full flex flex-col bg-gray-50">
      <div className="flex-shrink-0 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
            {selectedItems.size > 0 && (
              <Badge variant="default" className="font-medium text-xs px-2 py-0.5 bg-blue-600 text-white border-0">
                {selectedItems.size} selected
              </Badge>
            )}
          </div>
          <div className="hidden sm:block">
            <ConnectionStatus showLabel={false} />
          </div>
        </div>
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
        {/* Active filters/sorts indicator bar */}
        {(columnFilters.length > 0 || sortConfigs.length > 0 || groupConfig.columnId) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 overflow-x-auto">
            {columnFilters.length > 0 && (
              <Badge variant="secondary" className="font-medium text-xs px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200">
                <Filter className="h-3 w-3 mr-1.5" />
                {columnFilters.length} filter{columnFilters.length > 1 ? 's' : ''}
              </Badge>
            )}
            {sortConfigs.length > 0 && (
              <Badge variant="secondary" className="font-medium text-xs px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200">
                Sorted
              </Badge>
            )}
            {groupConfig.columnId && (
              <Badge variant="secondary" className="font-medium text-xs px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200">
                Grouped
              </Badge>
            )}
            <div className="ml-auto">
              <TableControlsDialog
                boardId={boardId}
                columns={boardColumns}
                items={items}
                filters={columnFilters}
                onFiltersChange={setColumnFilters}
                sortConfigs={sortConfigs}
                onSortChange={setSortConfigs}
                groupConfig={groupConfig}
                onGroupConfigChange={setGroupConfig}
                rowHeight={rowHeight}
                onRowHeightChange={handleRowHeightChange}
                onColumnVisibilityClick={() => setColumnVisibilityDialogOpen(true)}
              />
            </div>
          </div>
        )}
      </div>
      
      {selectedItems.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedItems.size}
          totalCount={filteredItems.length}
          onBulkDelete={handleBulkDelete}
          onBulkDuplicate={handleBulkDuplicate}
          onBulkEdit={() => setBulkEditDialogOpen(true)}
          onBulkMove={() => {
            const selectedItemsList = items.filter(item => selectedItems.has(item.id));
            setMoveCopyItems(selectedItemsList);
            setMoveCopyMode('move');
            setMoveCopyDialogOpen(true);
          }}
          onBulkCopy={() => {
            const selectedItemsList = items.filter(item => selectedItems.has(item.id));
            setMoveCopyItems(selectedItemsList);
            setMoveCopyMode('copy');
            setMoveCopyDialogOpen(true);
          }}
          onBulkArchive={async () => {
            const itemIds = Array.from(selectedItems);
            try {
              const response = await itemAPI.bulkArchiveItems(itemIds);
              if (response.success) {
                fetchItems();
                clearSelection();
              }
            } catch (error) {
              // Error toast handled in API
            }
          }}
          onClearSelection={clearSelection}
          onSelectAll={() => toggleSelectAll(filteredItems)}
        />
      )}

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-sm text-gray-600">Loading items...</p>
          </div>
        ) : visibleColumns.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Columns className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No columns defined</h3>
              <p className="text-sm text-gray-600 mb-6">Add columns to start organizing your data.</p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" onClick={fetchColumns} className="h-9 px-4">
                  Load Columns
                </Button>
                <Button onClick={createDefaultColumns} className="h-9 px-4 bg-blue-600 hover:bg-blue-700">
                  Create Default Columns
                </Button>
              </div>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {searchTerm ? (
                  <Search className="h-8 w-8 text-gray-400" />
                ) : (
                  <FileText className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No items found' : 'No items yet'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search or filters to find what you\'re looking for.' 
                  : 'Create your first item to get started!'}
              </p>
              {onItemCreate && !searchTerm && (
                <Button onClick={onItemCreate} className="h-9 px-4 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Item
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-auto relative bg-white">
            <div className="min-w-full">
              <Table className="min-w-full">
                <UITableHeader>
                  <CustomTableHeader
                    columns={visibleColumns}
                    columnWidths={columnWidths}
                    pinnedColumns={pinnedColumns}
                    onColumnResize={handleColumnResize}
                    onColumnReorder={handleColumnReorder}
                    onColumnPin={handleColumnPin}
                    selectedCount={selectedItems.size}
                    totalCount={filteredItems.length}
                    onSelectAll={() => toggleSelectAll(filteredItems)}
                    sortConfigs={sortConfigs}
                    onSortClick={(columnId) => {
                      setSortConfigs(toggleSort(columnId, sortConfigs));
                    }}
                  />
                </UITableHeader>
              </Table>
            </div>
            <Table>
              <TableBody
                items={displayItems}
                groupedData={groupedData}
                groupConfig={groupConfig}
                onGroupToggle={(groupKey) => {
                  const newExpanded = new Set(groupConfig.expandedGroups);
                  if (newExpanded.has(groupKey)) {
                    newExpanded.delete(groupKey);
                  } else {
                    newExpanded.add(groupKey);
                  }
                  setGroupConfig({
                    ...groupConfig,
                    expandedGroups: newExpanded,
                  });
                }}
                columns={visibleColumns}
                selectedItems={selectedItems}
                editingCell={editingCell}
                editValue={editValue}
                setEditValue={setEditValue}
                savingCell={savingCell}
                workspaceMembers={workspaceMembers}
                itemApprovals={itemApprovals}
                onSelect={toggleItemSelection}
                onEdit={(itemId, columnId, currentValue) => {
                  const column = boardColumns.find(col => col.id === columnId);
                  if (column) {
                    handleCellClick(itemId, columnId, currentValue, column);
                  }
                }}
                onSave={(itemId, columnId) => saveCell(itemId, columnId)}
                onCancel={cancelEditing}
                onKeyDown={handleKeyDown}
                onItemEdit={onItemEdit}
                onItemDelete={handleDeleteItem}
                onDuplicate={handleDuplicateItem}
                onMove={(item) => {
                  setMoveCopyItems([item]);
                  setMoveCopyMode('move');
                  setMoveCopyDialogOpen(true);
                }}
                onCopy={(item) => {
                  setMoveCopyItems([item]);
                  setMoveCopyMode('copy');
                  setMoveCopyDialogOpen(true);
                }}
                onArchive={async (item) => {
                  try {
                    const response = await itemAPI.archiveItem(item.id);
                    if (response.success) {
                      fetchItems();
                    } else {
                      throw new Error(response.message || 'Failed to archive item');
                    }
                  } catch (error) {
                    // Error toast handled in API
                  }
                }}
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
                showQuickCreate={true}
                onItemCreated={fetchItems}
                expandedRows={expandedRows}
                onToggleRowExpand={(itemId) => {
                  setExpandedRows(prev => {
                    const newExpanded = new Set(prev);
                    if (newExpanded.has(itemId)) {
                      newExpanded.delete(itemId);
                    } else {
                      newExpanded.add(itemId);
                    }
                    return newExpanded;
                  });
                }}
                pinnedColumns={pinnedColumns}
                columnWidths={columnWidths}
                rowHeight={rowHeight}
              />
            </Table>
              </div>
            )}
      </div>

      {/* Column Visibility Dialog */}
      <ColumnVisibilityDialog
        open={columnVisibilityDialogOpen}
        onOpenChange={setColumnVisibilityDialogOpen}
        columns={boardColumns}
        hiddenColumns={hiddenColumns}
        onToggleColumn={handleToggleColumnVisibility}
        onSave={() => {
          fetchColumns(); // Refresh to get updated column visibility
        }}
      />

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
          {selectedItem && (
            <SubmitForApprovalDialog
              open={submitApprovalDialogOpen}
              onOpenChange={(open) => {
                setSubmitApprovalDialogOpen(open);
                if (!open) {
                  setSelectedItem(null);
                }
              }}
              item={selectedItem}
              columns={boardColumns}
              boardId={boardId}
              workspaceId={workspaceId}
              onSuccess={() => {
                fetchItems();
                if (selectedItem) {
                  fetchItemApproval(selectedItem.id);
                }
              }}
            />
          )}
        </>
      )}

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={bulkEditDialogOpen}
        onOpenChange={setBulkEditDialogOpen}
        boardId={boardId}
        columns={boardColumns}
        selectedItems={items.filter(item => selectedItems.has(item.id))}
        onSuccess={() => {
          fetchItems();
          clearSelection();
        }}
      />

      {/* Move/Copy Dialog */}
      <ItemMoveCopyDialog
        open={moveCopyDialogOpen}
        onOpenChange={setMoveCopyDialogOpen}
        items={moveCopyItems}
        currentBoardId={boardId}
        currentWorkspaceId={workspaceId}
        mode={moveCopyMode}
        onSuccess={() => {
          fetchItems();
          setMoveCopyItems([]);
          clearSelection();
        }}
      />

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
    </div>
  );
}