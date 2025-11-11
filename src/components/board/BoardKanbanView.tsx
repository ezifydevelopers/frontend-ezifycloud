import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { boardAPI } from '@/lib/api';
import { Item, Column } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { KanbanCard } from './kanban/KanbanCard';
import { KanbanSettingsDialog, KanbanSettings } from './kanban/KanbanSettings';
import { getCellValue } from './table/utils/tableUtils';

interface BoardKanbanViewProps {
  boardId: string;
  columns?: Column[];
  onItemCreate?: () => void;
  onItemEdit?: (item: Item) => void;
  onItemDelete?: (item: Item) => void;
  onColumnsChange?: () => void;
}

interface KanbanColumn {
  id: string;
  name: string;
  status: string;
  items: Item[];
  wipLimit?: number;
}

interface Swimlane {
  id: string;
  name: string;
  columns: KanbanColumn[];
}

export const BoardKanbanView: React.FC<BoardKanbanViewProps> = ({
  boardId,
  columns = [],
  onItemCreate,
  onItemEdit,
  onItemDelete,
  onColumnsChange,
}) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [boardColumns, setBoardColumns] = useState<Column[]>(columns);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);
  const [statusColumn, setStatusColumn] = useState<Column | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedItemData, setDraggedItemData] = useState<{ item: Item; currentColumn: string } | null>(null);
  const [swimlanes, setSwimlanes] = useState<Swimlane[]>([]);
  const [settings, setSettings] = useState<KanbanSettings>(() => {
    const saved = localStorage.getItem(`kanbanSettings_${boardId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());
  const columnsFetchedRef = useRef(false);

  useEffect(() => {
    setBoardColumns(columns);
    
    // Find grouping column (custom or default STATUS)
    const groupByColumnId = settings.groupBy;
    let groupColumn: Column | null = null;
    
    if (groupByColumnId) {
      groupColumn = columns.find(col => col.id === groupByColumnId && !col.isHidden) || null;
    } else {
      // Default: Find STATUS column
      groupColumn = columns.find(col => col.type === 'STATUS' && !col.isHidden) || null;
    }
    
    setStatusColumn(groupColumn);
  }, [columns, settings.groupBy]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(`kanbanSettings_${boardId}`, JSON.stringify(settings));
  }, [settings, boardId]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await boardAPI.getBoardItems(boardId, {
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        const responseData = response.data as { data?: unknown[]; items?: unknown[] };
        const itemsData = responseData.data || responseData.items || [];
        setItems(itemsData as Item[]);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch items',
        variant: 'destructive',
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [boardId, toast]);

  const fetchColumns = useCallback(async () => {
    try {
      const response = await boardAPI.getBoardColumns(boardId);
      if (response.success && response.data) {
        const columnsData = Array.isArray(response.data) ? response.data : [];
        setBoardColumns(columnsData as Column[]);
        const statusCol = columnsData.find((col) => {
          const column = col as Column;
          return column.type === 'STATUS' && !column.isHidden;
        }) as Column | undefined;
        setStatusColumn(statusCol || null);
        // Don't call onColumnsChange here to avoid circular updates
        // The parent component already manages columns
      }
    } catch (error) {
      console.error('Error fetching columns:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  useEffect(() => {
    fetchItems();
  }, [boardId, fetchItems]);

  // Only fetch columns if they weren't provided as props (fallback for standalone usage)
  useEffect(() => {
    // Reset fetch flag when boardId changes
    columnsFetchedRef.current = false;
  }, [boardId]);

  useEffect(() => {
    // If columns are provided as props, don't fetch them
    if (columns && columns.length > 0) {
      return; // Columns are provided, no need to fetch
    }
    
    // Only fetch once when we don't have columns
    if (!columnsFetchedRef.current && boardColumns.length === 0 && boardId) {
      columnsFetchedRef.current = true;
      fetchColumns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, columns]);

  // Organize items into kanban columns with swimlanes support
  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!statusColumn) {
      // If no status column, create default columns
      const defaultColumns: KanbanColumn[] = [
        { id: 'pending', name: 'Pending', status: 'pending', items: [], wipLimit: settings.wipLimits?.['pending'] },
        { id: 'in-progress', name: 'In Progress', status: 'in-progress', items: [], wipLimit: settings.wipLimits?.['in-progress'] },
        { id: 'done', name: 'Done', status: 'done', items: [], wipLimit: settings.wipLimits?.['done'] },
      ];
      
      defaultColumns.forEach(col => {
        col.items = filtered.filter(item => 
          (item.status || 'pending').toLowerCase() === col.status
        );
      });
      
      // Add items with no status to pending
      const itemsWithoutStatus = filtered.filter(item => !item.status);
      defaultColumns[0].items.push(...itemsWithoutStatus);
      
      // Handle swimlanes
      if (settings.swimlaneBy) {
        const swimlaneColumn = boardColumns.find(col => col.id === settings.swimlaneBy);
        if (swimlaneColumn) {
          const lanes: Swimlane[] = [];
          const laneValues = new Set<string>();
          
          filtered.forEach(item => {
            const laneValue = getCellValue(item, swimlaneColumn.id);
            const laneName = laneValue ? String(laneValue) : 'Unassigned';
            laneValues.add(laneName);
          });
          
        laneValues.forEach(laneName => {
          const laneColumns = defaultColumns.map(col => ({
            ...col,
            items: col.items.filter(item => {
              const itemLaneValue = getCellValue(item, swimlaneColumn.id);
              const itemLaneName = itemLaneValue ? String(itemLaneValue) : 'Unassigned';
              return itemLaneName === laneName;
            }),
          }));
          
          // Apply sorting if configured
          if (settings.cardOrder) {
            const sortColumn = boardColumns.find(col => col.id === settings.cardOrder);
            const direction = settings.cardOrderDirection || 'asc';
            
            laneColumns.forEach(col => {
              col.items.sort((a, b) => {
                const aValue = sortColumn ? getCellValue(a, sortColumn.id) : null;
                const bValue = sortColumn ? getCellValue(b, sortColumn.id) : null;
                
                if (aValue === null || aValue === undefined) return direction === 'asc' ? 1 : -1;
                if (bValue === null || bValue === undefined) return direction === 'asc' ? -1 : 1;
                
                if (sortColumn?.type === 'DATE' || sortColumn?.type === 'DATETIME') {
                  const aDate = new Date(aValue as string).getTime();
                  const bDate = new Date(bValue as string).getTime();
                  return direction === 'asc' ? aDate - bDate : bDate - aDate;
                }
                
                if (sortColumn?.type === 'NUMBER' || sortColumn?.type === 'CURRENCY') {
                  const aNum = Number(aValue) || 0;
                  const bNum = Number(bValue) || 0;
                  return direction === 'asc' ? aNum - bNum : bNum - aNum;
                }
                
                const aStr = String(aValue).toLowerCase();
                const bStr = String(bValue).toLowerCase();
                if (aStr < bStr) return direction === 'asc' ? -1 : 1;
                if (aStr > bStr) return direction === 'asc' ? 1 : -1;
                return 0;
              });
            });
          }
          
          lanes.push({
            id: laneName.toLowerCase().replace(/\s+/g, '-'),
            name: laneName,
            columns: laneColumns,
          });
        });
          
          setSwimlanes(lanes);
          setKanbanColumns([]);
          return;
        }
      }
      
      setSwimlanes([]);
      setKanbanColumns(defaultColumns);
      return;
    }

    // Get status options from column settings
    const statusOptions = (statusColumn.settings as { options?: string[] })?.options || [];
    
    // Create columns based on status options with consistent IDs and WIP limits
    const cols: KanbanColumn[] = statusOptions.map((status) => {
      const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
      const columnId = `status-${normalizedStatus}`;
      return {
        id: columnId,
        name: status,
        status: normalizedStatus,
        items: [],
        wipLimit: settings.wipLimits?.[columnId] || settings.wipLimits?.[status],
      };
    });

    // Add a column for items without status
    cols.unshift({
      id: 'no-status',
      name: 'No Status',
      status: '',
      items: [],
      wipLimit: settings.wipLimits?.['no-status'],
    });

    // Group items by status
    filtered.forEach(item => {
      const cellValue = item.cells?.[statusColumn.id];
      const value = cellValue ? (typeof cellValue === 'object' && 'value' in cellValue ? cellValue.value : cellValue) : null;
      const status = value ? String(value).toLowerCase().replace(/\s+/g, '-') : '';
      
      const col = cols.find(c => {
        if (c.status === status) return true;
        if (!status && c.id === 'no-status') return true;
        if (status && c.name.toLowerCase().replace(/\s+/g, '-') === status) return true;
        return false;
      });
      
      if (col) {
        col.items.push(item);
      } else {
        cols[0].items.push(item);
      }
    });

    // Sort items within each column if sorting is configured
    if (settings.cardOrder) {
      const sortColumn = boardColumns.find(col => col.id === settings.cardOrder);
      const direction = settings.cardOrderDirection || 'asc';
      
      cols.forEach(col => {
        col.items.sort((a, b) => {
          const aValue = sortColumn ? getCellValue(a, sortColumn.id) : null;
          const bValue = sortColumn ? getCellValue(b, sortColumn.id) : null;
          
          // Handle null/undefined values
          if (aValue === null || aValue === undefined) return direction === 'asc' ? 1 : -1;
          if (bValue === null || bValue === undefined) return direction === 'asc' ? -1 : 1;
          
          // Handle different types
          if (sortColumn?.type === 'DATE' || sortColumn?.type === 'DATETIME') {
            const aDate = new Date(aValue as string).getTime();
            const bDate = new Date(bValue as string).getTime();
            return direction === 'asc' ? aDate - bDate : bDate - aDate;
          }
          
          if (sortColumn?.type === 'NUMBER' || sortColumn?.type === 'CURRENCY') {
            const aNum = Number(aValue) || 0;
            const bNum = Number(bValue) || 0;
            return direction === 'asc' ? aNum - bNum : bNum - aNum;
          }
          
          // String comparison
          const aStr = String(aValue).toLowerCase();
          const bStr = String(bValue).toLowerCase();
          if (aStr < bStr) return direction === 'asc' ? -1 : 1;
          if (aStr > bStr) return direction === 'asc' ? 1 : -1;
          return 0;
        });
      });
    }

    // Handle swimlanes
    if (settings.swimlaneBy) {
      const swimlaneColumn = boardColumns.find(col => col.id === settings.swimlaneBy);
      if (swimlaneColumn) {
        const lanes: Swimlane[] = [];
        const laneValues = new Set<string>();
        
        filtered.forEach(item => {
          const laneValue = getCellValue(item, swimlaneColumn.id);
          const laneName = laneValue ? String(laneValue) : 'Unassigned';
          laneValues.add(laneName);
        });
        
        laneValues.forEach(laneName => {
          const laneColumns = cols.map(col => ({
            ...col,
            items: col.items.filter(item => {
              const itemLaneValue = getCellValue(item, swimlaneColumn.id);
              const itemLaneName = itemLaneValue ? String(itemLaneValue) : 'Unassigned';
              return itemLaneName === laneName;
            }),
          }));
          
          // Apply sorting if configured
          if (settings.cardOrder) {
            const sortColumn = boardColumns.find(col => col.id === settings.cardOrder);
            const direction = settings.cardOrderDirection || 'asc';
            
            laneColumns.forEach(col => {
              col.items.sort((a, b) => {
                const aValue = sortColumn ? getCellValue(a, sortColumn.id) : null;
                const bValue = sortColumn ? getCellValue(b, sortColumn.id) : null;
                
                if (aValue === null || aValue === undefined) return direction === 'asc' ? 1 : -1;
                if (bValue === null || bValue === undefined) return direction === 'asc' ? -1 : 1;
                
                if (sortColumn?.type === 'DATE' || sortColumn?.type === 'DATETIME') {
                  const aDate = new Date(aValue as string).getTime();
                  const bDate = new Date(bValue as string).getTime();
                  return direction === 'asc' ? aDate - bDate : bDate - aDate;
                }
                
                if (sortColumn?.type === 'NUMBER' || sortColumn?.type === 'CURRENCY') {
                  const aNum = Number(aValue) || 0;
                  const bNum = Number(bValue) || 0;
                  return direction === 'asc' ? aNum - bNum : bNum - aNum;
                }
                
                const aStr = String(aValue).toLowerCase();
                const bStr = String(bValue).toLowerCase();
                if (aStr < bStr) return direction === 'asc' ? -1 : 1;
                if (aStr > bStr) return direction === 'asc' ? 1 : -1;
                return 0;
              });
            });
          }
          
          lanes.push({
            id: laneName.toLowerCase().replace(/\s+/g, '-'),
            name: laneName,
            columns: laneColumns,
          });
        });
        
        setSwimlanes(lanes);
        setKanbanColumns([]);
        return;
      }
    }

    setSwimlanes([]);
    setKanbanColumns(cols);
  }, [items, statusColumn, searchTerm, settings.swimlaneBy, settings.wipLimits, settings.cardOrder, settings.cardOrderDirection, boardColumns]);

  const handleMoveItem = async (item: Item, newStatus: string, targetColumnName: string) => {
    try {
      // Determine the actual status value to set
      let statusValueToSet = newStatus;
      
      if (statusColumn) {
        // Get status options from column settings
        const statusOptions = (statusColumn.settings as { options?: string[] })?.options || [];
        
        // Normalize for comparison
        const normalizedNewStatus = newStatus.toLowerCase().replace(/\s+/g, '-');
        const normalizedTargetName = targetColumnName.toLowerCase().replace(/\s+/g, '-');
        
        // Find the matching status option (case-insensitive, space-agnostic)
        const matchingOption = statusOptions.find(opt => {
          const normalizedOpt = opt.toLowerCase().replace(/\s+/g, '-');
          return normalizedOpt === normalizedNewStatus || 
                 normalizedOpt === normalizedTargetName ||
                 opt.toLowerCase() === normalizedNewStatus ||
                 opt.toLowerCase() === normalizedTargetName;
        });
        
        if (matchingOption) {
          statusValueToSet = matchingOption; // Use the exact option value from settings
        } else if (newStatus === '' || newStatus === 'no-status' || targetColumnName === 'No Status') {
          statusValueToSet = ''; // Empty for "No Status"
        } else {
          // Fallback: try to match by column name directly
          statusValueToSet = targetColumnName;
        }
        
        // Optimistically update UI
        setItems(prevItems => 
          prevItems.map(i => 
            i.id === item.id 
              ? { 
                  ...i, 
                  cells: {
                    ...(i.cells || {}),
                    [statusColumn.id]: statusValueToSet,
                  }
                }
              : i
          )
        );
        
        // Update status column cell
        const currentCells = item.cells || {};
        const updatedCells = {
          ...currentCells,
          [statusColumn.id]: statusValueToSet,
        };

        const response = await boardAPI.updateItem(item.id, {
          cells: updatedCells,
        });

        if (response.success) {
          // Refetch items to get updated data from server
          await fetchItems();
        } else {
          // Revert optimistic update on error
          setItems(prevItems => 
            prevItems.map(i => 
              i.id === item.id ? item : i
            )
          );
          throw new Error(response.message || 'Failed to move item');
        }
      } else {
        // Update item.status field (fallback when no status column)
        statusValueToSet = newStatus || targetColumnName;
        
        // Optimistically update UI
        setItems(prevItems => 
          prevItems.map(i => 
            i.id === item.id ? { ...i, status: statusValueToSet } : i
          )
        );
        
        const response = await boardAPI.updateItem(item.id, {
          status: statusValueToSet,
        });

        if (!response.success) {
          // Revert optimistic update on error
          setItems(prevItems => 
            prevItems.map(i => 
              i.id === item.id ? item : i
            )
          );
          throw new Error(response.message || 'Failed to move item');
        }
      }
    } catch (error) {
      console.error('Error moving item:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to move item',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (item: Item) => {
    try {
      const response = await boardAPI.deleteItem(item.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Item deleted successfully',
        });
        fetchItems();
        if (onItemDelete) {
          onItemDelete(item);
        }
      } else {
        throw new Error(response.message || 'Failed to delete item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const renderItemCard = (item: Item, column: KanbanColumn) => {
    const isDragging = draggedItem === item.id;
    
    return (
      <KanbanCard
        key={item.id}
        item={item}
        columns={boardColumns}
        statusColumn={statusColumn}
        isDragging={isDragging}
        onDragStart={(e) => {
          setDraggedItem(item.id);
          setDraggedItemData({ item, currentColumn: column.id });
          try {
            if (e.dataTransfer) {
              e.dataTransfer.setData('text/plain', item.id);
              e.dataTransfer.setData('application/json', JSON.stringify({ itemId: item.id, currentColumn: column.id }));
              e.dataTransfer.effectAllowed = 'move';
              // Set drag image to be the card itself
              if (e.currentTarget instanceof HTMLElement) {
                e.dataTransfer.setDragImage(e.currentTarget, e.currentTarget.offsetWidth / 2, e.currentTarget.offsetHeight / 2);
              }
            }
          } catch (err) {
            console.warn('Error setting drag data:', err);
          }
        }}
        onDragEnd={() => {
          setDraggedItem(null);
          setDragOverColumn(null);
          setDraggedItemData(null);
        }}
        onEdit={onItemEdit}
        onDelete={handleDeleteItem}
        showKeyFields={settings.showKeyFields}
        showFields={settings.showFields}
        cardSize={settings.cardSize || 'normal'}
      />
    );
  };

  const toggleColumnCollapse = (columnId: string) => {
    setCollapsedColumns(prev => {
      const updated = new Set(prev);
      if (updated.has(columnId)) {
        updated.delete(columnId);
      } else {
        updated.add(columnId);
      }
      return updated;
    });
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-xl">📋</span>
            </div>
            <span className="text-xl">Kanban Board</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchItems();
                fetchColumns();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {onItemCreate && (
              <Button onClick={onItemCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New Item
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : kanbanColumns.length === 0 && swimlanes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {!statusColumn 
                ? 'No STATUS column found. Create a STATUS column to group items in the Kanban view.'
                : statusColumn && items.length === 0
                ? 'No items to display. Create your first item to get started.'
                : 'Loading columns...'}
            </p>
            {onItemCreate && (
              <Button onClick={onItemCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Item
              </Button>
            )}
          </div>
        ) : swimlanes.length > 0 ? (
          // Render swimlanes
          <div className="space-y-4 overflow-x-auto pb-4">
            {swimlanes.map((lane) => (
              <div key={lane.id} className="border rounded-lg p-4 bg-slate-50/30">
                <h3 className="text-sm font-semibold mb-3 text-slate-700">{lane.name}</h3>
                <div className="flex gap-4">
                  {lane.columns.map((column) => (
                    <div
                      key={column.id}
                      className="flex-shrink-0 w-80"
                    >
                      <Card className="bg-slate-50/50 border-slate-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleColumnCollapse(column.id)}
                              >
                                {collapsedColumns.has(column.id) ? (
                                  <ChevronRight className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              <span>{column.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {column.wipLimit && (
                                <Badge 
                                  variant={column.items.length >= column.wipLimit ? "destructive" : "outline"}
                                  className={cn(
                                    column.items.length >= column.wipLimit && "bg-red-100 text-red-800 border-red-200"
                                  )}
                                >
                                  {column.items.length}/{column.wipLimit}
                                </Badge>
                              )}
                              {!column.wipLimit && (
                                <Badge variant="outline">
                                  {column.items.length}
                                </Badge>
                              )}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        {!collapsedColumns.has(column.id) && (
                          <CardContent className="p-3">
                            <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (e.dataTransfer) {
                                e.dataTransfer.dropEffect = 'move';
                              }
                              // Always allow drop if we have a dragged item
                              if (draggedItem || draggedItemData) {
                                const currentColumnId = draggedItemData?.currentColumn;
                                if (currentColumnId !== column.id) {
                                  setDragOverColumn(column.id);
                                }
                              }
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (e.dataTransfer) {
                                e.dataTransfer.dropEffect = 'move';
                              }
                              const currentColumnId = draggedItemData?.currentColumn;
                              if (currentColumnId !== column.id) {
                                setDragOverColumn(column.id);
                              }
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = e.clientX;
                              const y = e.clientY;
                              if (x < rect.left - 10 || x > rect.right + 10 || y < rect.top - 10 || y > rect.bottom + 10) {
                                setDragOverColumn(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              let movedItem: Item | undefined;
                              
                              // Try to get item from state first (most reliable)
                              if (draggedItemData && draggedItemData.item) {
                                movedItem = draggedItemData.item;
                              } else if (draggedItem) {
                                // Fallback: find item by draggedItem ID
                                movedItem = items.find(i => i.id === draggedItem);
                              }
                              
                              // Additional fallback: try to get from dataTransfer
                              if (!movedItem) {
                                try {
                                  const jsonData = e.dataTransfer.getData('application/json');
                                  if (jsonData) {
                                    const data = JSON.parse(jsonData);
                                    movedItem = items.find(i => i.id === data.itemId);
                                  }
                                } catch (err) {
                                  console.warn('Error parsing drag data:', err);
                                }
                              }
                              
                              // Last fallback: try text/plain
                              if (!movedItem) {
                                try {
                                  const itemId = e.dataTransfer.getData('text/plain');
                                  if (itemId) {
                                    movedItem = items.find(i => i.id === itemId);
                                  }
                                } catch (err) {
                                  console.warn('Error getting drag data:', err);
                                }
                              }
                              
                              if (movedItem && movedItem.id) {
                                const currentColumnId = draggedItemData?.currentColumn;
                                if (currentColumnId === column.id) {
                                  setDragOverColumn(null);
                                  setDraggedItem(null);
                                  setDraggedItemData(null);
                                  return;
                                }
                                
                                // Always move the item (let handleMoveItem handle the logic)
                                handleMoveItem(movedItem, column.status, column.name);
                              } else {
                                console.warn('Could not find item to move');
                              }
                              
                              setDragOverColumn(null);
                              setDraggedItem(null);
                              setDraggedItemData(null);
                            }}
                            className={cn(
                              "min-h-[100px] rounded transition-all border-2 border-dashed h-[400px] overflow-y-auto pr-2",
                              dragOverColumn === column.id
                                ? "bg-blue-50 border-blue-400 border-solid shadow-lg"
                                : "border-transparent hover:border-slate-200"
                            )}
                            style={{
                              pointerEvents: 'auto',
                            }}
                          >
                            <div className="p-2">
                              {column.items.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                  Drop items here
                                </div>
                              ) : (
                                column.items.map((item) => renderItemCard(item, column))
                              )}
                            </div>
                          </div>
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanColumns.map((column) => (
              <div
                key={column.id}
                className="flex-shrink-0 w-80"
              >
                <Card className="bg-slate-50/50 border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleColumnCollapse(column.id)}
                        >
                          {collapsedColumns.has(column.id) ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <span>{column.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {column.wipLimit && (
                          <Badge 
                            variant={column.items.length >= column.wipLimit ? "destructive" : "outline"}
                            className={cn(
                              column.items.length >= column.wipLimit && "bg-red-100 text-red-800 border-red-200"
                            )}
                          >
                            {column.items.length}/{column.wipLimit}
                          </Badge>
                        )}
                        {!column.wipLimit && (
                          <Badge variant="outline">
                            {column.items.length}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  {!collapsedColumns.has(column.id) && (
                    <CardContent className="p-3">
                      <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer) {
                          e.dataTransfer.dropEffect = 'move';
                        }
                        // Always allow drop if we have a dragged item
                        if (draggedItem || draggedItemData) {
                          const currentColumnId = draggedItemData?.currentColumn;
                          if (currentColumnId !== column.id) {
                            setDragOverColumn(column.id);
                          }
                        }
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer) {
                          e.dataTransfer.dropEffect = 'move';
                        }
                        const currentColumnId = draggedItemData?.currentColumn;
                        if (currentColumnId !== column.id) {
                          setDragOverColumn(column.id);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Only clear if we're actually leaving the drop zone
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX;
                        const y = e.clientY;
                        // Check if we're really leaving (with some tolerance)
                        if (x < rect.left - 10 || x > rect.right + 10 || y < rect.top - 10 || y > rect.bottom + 10) {
                          setDragOverColumn(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        let movedItem: Item | undefined;
                        
                        // Try to get item from state first (most reliable)
                        if (draggedItemData && draggedItemData.item) {
                          movedItem = draggedItemData.item;
                        } else if (draggedItem) {
                          // Fallback: find item by draggedItem ID
                          movedItem = items.find(i => i.id === draggedItem);
                        }
                        
                        // Additional fallback: try to get from dataTransfer
                        if (!movedItem) {
                          try {
                            const jsonData = e.dataTransfer.getData('application/json');
                            if (jsonData) {
                              const data = JSON.parse(jsonData);
                              movedItem = items.find(i => i.id === data.itemId);
                            }
                          } catch (err) {
                            console.warn('Error parsing drag data:', err);
                          }
                        }
                        
                        // Last fallback: try text/plain
                        if (!movedItem) {
                          try {
                            const itemId = e.dataTransfer.getData('text/plain');
                            if (itemId) {
                              movedItem = items.find(i => i.id === itemId);
                            }
                          } catch (err) {
                            console.warn('Error getting drag data:', err);
                          }
                        }
                        
                        if (movedItem && movedItem.id) {
                          // Don't move if it's the same column
                          const currentColumnId = draggedItemData?.currentColumn;
                          if (currentColumnId === column.id) {
                            setDragOverColumn(null);
                            setDraggedItem(null);
                            setDraggedItemData(null);
                            return;
                          }
                          
                          // Always move the item (let handleMoveItem handle the logic)
                          handleMoveItem(movedItem, column.status, column.name);
                        } else {
                          console.warn('Could not find item to move');
                        }
                        
                        setDragOverColumn(null);
                        setDraggedItem(null);
                        setDraggedItemData(null);
                      }}
                      className={cn(
                        "min-h-[100px] rounded transition-all border-2 border-dashed h-[600px] overflow-y-auto pr-2",
                        dragOverColumn === column.id
                          ? "bg-blue-50 border-blue-400 border-solid shadow-lg"
                          : "border-transparent hover:border-slate-200"
                      )}
                      style={{
                        pointerEvents: 'auto',
                      }}
                    >
                      <div className="p-2">
                        {column.items.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            Drop items here
                          </div>
                        ) : (
                          column.items.map((item) => renderItemCard(item, column))
                        )}
                      </div>
                    </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Kanban Settings Dialog */}
      <KanbanSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        columns={boardColumns}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </Card>
  );
};

