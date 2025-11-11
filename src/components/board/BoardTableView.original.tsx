import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  X,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Copy,
  CheckSquare,
  Square,
  Star,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FileColumnUpload } from './FileColumnUpload';
import { boardAPI, workspaceAPI } from '@/lib/api';
import { Item, Column, ColumnType, Cell } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ItemCommentsDialog } from './ItemCommentsDialog';
import { ItemFilesDialog } from './ItemFilesDialog';
import { FileIcon } from 'lucide-react';
import { ItemApprovalDialog } from './ItemApprovalDialog';
import { ApprovalStatusBadge } from './ApprovalStatusBadge';
import { ItemImportExport } from './ItemImportExport';
import { SmartSearch } from '@/components/ai/SmartSearch';
import { ItemContextMenu } from '@/components/ui/item-context-menu';
import { BulkActionsToolbar } from '@/components/ui/bulk-actions-toolbar';
import { useKeyboardShortcuts, commonShortcuts } from '@/hooks/useKeyboardShortcuts';

// Helper function to get ISO week number
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Helper to parse week string (YYYY-WNN) to date
const parseWeekString = (weekStr: string): Date | null => {
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
};

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
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [boardColumns, setBoardColumns] = useState<Column[]>(columns);
  const [editingCell, setEditingCell] = useState<{ itemId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState<unknown>('');
  const [savingCell, setSavingCell] = useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemApprovals, setItemApprovals] = useState<Record<string, any>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkActionDialog, setBulkActionDialog] = useState<'delete' | 'edit' | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [pinnedColumns, setPinnedColumns] = useState<Record<string, 'left' | 'right' | null>>({});
  const [workspaceMembers, setWorkspaceMembers] = useState<Array<{ id: string; name: string; email: string; profilePicture?: string }>>([]);

  useEffect(() => {
    setBoardColumns(columns);
  }, [columns]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await boardAPI.getBoardItems(boardId, {
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        type ItemsPayload = { items?: Item[]; data?: Item[] };
        const payload = response.data as unknown as ItemsPayload;
        const itemsData: Item[] = payload.items ?? payload.data ?? [];
        setItems(itemsData);
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
        const columnsData = (response.data as any[]) || [];
        setBoardColumns(columnsData as Column[]);
      }
    } catch (error) {
      console.error('Error fetching columns:', error);
    }
  }, [boardId]);

  const createDefaultColumns = useCallback(async () => {
    try {
      const defaultCols: Array<{ name: string; type: ColumnType; position?: number; settings?: Record<string, unknown> }> = [
        { name: 'Status', type: 'STATUS' as unknown as ColumnType, position: 1, settings: { options: ['Draft', 'Sent', 'Paid', 'Overdue'] } },
        { name: 'Invoice #', type: 'TEXT' as unknown as ColumnType, position: 2 },
        { name: 'Client', type: 'TEXT' as unknown as ColumnType, position: 3 },
        { name: 'Amount', type: 'CURRENCY' as unknown as ColumnType, position: 4 },
        { name: 'Due Date', type: 'DATE' as unknown as ColumnType, position: 5 },
      ];

      for (const col of defaultCols) {
        await boardAPI.createColumn(boardId, col as any);
      }
      await fetchColumns();
      toast({ title: 'Columns created', description: 'Default invoice columns added.' });
    } catch (error) {
      console.error('Error creating default columns:', error);
      toast({ title: 'Error', description: 'Failed to create default columns', variant: 'destructive' });
    }
  }, [boardId, fetchColumns, toast]);

  useEffect(() => {
    fetchItems();
  }, [boardId, fetchItems]);

  const fetchWorkspaceMembers = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const response = await workspaceAPI.getWorkspaceMembers(workspaceId);
      if (response.success && response.data) {
        const membersData = Array.isArray(response.data) ? response.data : [];
        const formattedMembers = membersData.map((member: Record<string, unknown>) => ({
          id: String(
            member.userId || 
            (member.user && typeof member.user === 'object' && 'id' in member.user ? member.user.id : '')
          ),
          name: String(
            member.user && typeof member.user === 'object' && 'name' in member.user
              ? member.user.name
              : member.email || 'Unknown'
          ),
          email: String(
            member.user && typeof member.user === 'object' && 'email' in member.user
              ? member.user.email
              : member.email || ''
          ),
          profilePicture: 
            member.user && typeof member.user === 'object' && 'profilePicture' in member.user
              ? String(member.user.profilePicture || '')
              : undefined,
        }));
        setWorkspaceMembers(formattedMembers);
      }
    } catch (error) {
      console.error('Error fetching workspace members:', error);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!columns || columns.length === 0) {
      fetchColumns();
    }
  }, [boardId, fetchColumns, columns?.length]);

  useEffect(() => {
    fetchWorkspaceMembers();
  }, [fetchWorkspaceMembers]);

  // Fetch approval status for items (optional - can be lazy loaded)
  const fetchItemApproval = async (itemId: string) => {
    try {
      const { approvalAPI } = await import('@/lib/api');
      const response = await approvalAPI.getItemApprovals(itemId);
      if (response.success && response.data) {
        setItemApprovals(prev => ({
          ...prev,
          [itemId]: response.data,
        }));
      }
    } catch (error) {
      // Silently fail - approvals are optional
      console.error('Error fetching approval status:', error);
    }
  };

  const handleDeleteItem = async (item: Item) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }
    
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

  const handleDuplicateItem = async (item: Item) => {
    try {
      // Fetch full item details with cells
      const itemResponse = await boardAPI.getBoardItems(boardId, { page: 1, limit: 100 });
      const allItems = itemResponse.success && itemResponse.data ? ((itemResponse.data as any).data || []) : [];
      const fullItem = allItems.find((i: Item) => i.id === item.id);
      
      if (!fullItem) {
        throw new Error('Item not found');
      }

      const cells: Record<string, unknown> = {};
      if (fullItem.cells) {
        Object.entries(fullItem.cells).forEach(([columnId, cell]) => {
          const cellValue = typeof cell === 'object' && 'value' in cell ? cell.value : cell;
          // Don't copy auto-number or formula values
          const column = boardColumns.find(col => col.id === columnId);
          if (column && column.type !== 'AUTO_NUMBER' && column.type !== 'FORMULA') {
            cells[columnId] = cellValue;
          }
        });
      }

      const response = await boardAPI.createItem(boardId, {
        name: `${item.name} (Copy)`,
        status: item.status,
        cells,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Item duplicated successfully',
        });
        fetchItems();
      } else {
        throw new Error(response.message || 'Failed to duplicate item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to duplicate item',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    try {
      const deletePromises = Array.from(selectedItems).map(itemId => 
        boardAPI.deleteItem(itemId)
      );
      await Promise.all(deletePromises);
      
      toast({
        title: 'Success',
        description: `${selectedItems.size} item(s) deleted successfully`,
      });
      setSelectedItems(new Set());
      setBulkActionDialog(null);
      fetchItems();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete items',
        variant: 'destructive',
      });
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...commonShortcuts.newItem,
      action: () => onItemCreate?.(),
    },
    {
      ...commonShortcuts.selectAll,
      action: () => toggleSelectAll(),
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

  const handleCellClick = (itemId: string, columnId: string, currentValue: unknown, column: Column) => {
    // Don't allow editing of certain column types inline (use dialog instead)
    // FILE can be edited inline, so we allow it
    if (column.type === 'LONG_TEXT' || column.type === 'FORMULA' || column.type === 'AUTO_NUMBER') {
      return;
    }

    setEditingCell({ itemId, columnId });
    
    // Initialize edit value based on column type
    if (column.type === 'CHECKBOX') {
      setEditValue(Boolean(currentValue));
    } else if (column.type === 'DATE') {
      if (currentValue) {
        const date = new Date(currentValue as string);
        setEditValue(date.toISOString().split('T')[0]);
      } else {
        setEditValue('');
      }
    } else if (column.type === 'DATETIME') {
      if (currentValue) {
        const date = new Date(currentValue as string);
        setEditValue(date.toISOString().slice(0, 16));
      } else {
        setEditValue('');
      }
    } else if (column.type === 'WEEK') {
      if (currentValue) {
        const date = new Date(currentValue as string);
        const year = date.getFullYear();
        const week = getWeekNumber(date);
        setEditValue(`${year}-W${String(week).padStart(2, '0')}`);
      } else {
        setEditValue('');
      }
    } else if (column.type === 'MONTH') {
      if (currentValue) {
        const date = new Date(currentValue as string);
        setEditValue(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
      } else {
        setEditValue('');
      }
    } else if (column.type === 'YEAR') {
      if (currentValue) {
        const date = new Date(currentValue as string);
        setEditValue(String(date.getFullYear()));
      } else {
        setEditValue('');
      }
    } else if (column.type === 'TIMELINE') {
      // Timeline stores as { start: string, end: string }
      if (currentValue && typeof currentValue === 'object' && 'start' in currentValue && 'end' in currentValue) {
        setEditValue(JSON.stringify(currentValue));
      } else {
        setEditValue('');
      }
    } else {
      setEditValue(currentValue || '');
    }
  };

  const handleCellSave = async (itemId: string, columnId: string) => {
    if (!editingCell || editingCell.itemId !== itemId || editingCell.columnId !== columnId) {
      return;
    }

    try {
      setSavingCell(true);
      
      // Find the item and column
      const item = items.find(i => i.id === itemId);
      const column = boardColumns.find(c => c.id === columnId);
      
      if (!item || !column) {
        throw new Error('Item or column not found');
      }

      // Get current cells or empty object
      const currentCells = item.cells || {};
      
      // Prepare the new cell value
      let cellValue: unknown = editValue;
      
      // Convert value based on column type
      if (column.type === 'DATE') {
        if (editValue && typeof editValue === 'string' && editValue.trim() !== '') {
          const date = new Date(editValue);
          cellValue = date.toISOString();
        } else {
          cellValue = null;
        }
      } else if (column.type === 'DATETIME') {
        if (editValue && typeof editValue === 'string' && editValue.trim() !== '') {
          const date = new Date(editValue);
          cellValue = date.toISOString();
        } else {
          cellValue = null;
        }
      } else if (column.type === 'WEEK') {
        if (editValue && typeof editValue === 'string' && editValue.trim() !== '') {
          const date = parseWeekString(editValue);
          cellValue = date ? date.toISOString() : null;
        } else {
          cellValue = null;
        }
      } else if (column.type === 'MONTH') {
        if (editValue && typeof editValue === 'string' && editValue.trim() !== '') {
          const [year, month] = editValue.split('-').map(Number);
          const date = new Date(year, month - 1, 1);
          cellValue = date.toISOString();
        } else {
          cellValue = null;
        }
      } else if (column.type === 'YEAR') {
        if (editValue && typeof editValue === 'string' && editValue.trim() !== '') {
          const year = parseInt(editValue, 10);
          const date = new Date(year, 0, 1);
          cellValue = date.toISOString();
        } else {
          cellValue = null;
        }
      } else if (column.type === 'TIMELINE') {
        if (editValue && typeof editValue === 'string' && editValue.trim() !== '') {
          try {
            const timeline = JSON.parse(editValue);
            if (timeline.start && timeline.end) {
              cellValue = { start: new Date(timeline.start).toISOString(), end: new Date(timeline.end).toISOString() };
            } else {
              cellValue = null;
            }
          } catch {
            cellValue = null;
          }
        } else {
          cellValue = null;
        }
      } else if (column.type === 'PEOPLE') {
        // PEOPLE can be single (string) or multiple (array)
        const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
        const isMultiple = peopleSettings?.peopleType === 'multiple';
        if (isMultiple) {
          // For multiple, ensure it's an array
          cellValue = Array.isArray(editValue) ? editValue : editValue ? [editValue] : [];
        } else {
          // For single, ensure it's a string
          cellValue = Array.isArray(editValue) && editValue.length > 0 ? editValue[0] : editValue || null;
        }
      } else if (column.type === 'FILE') {
        // FILE stores file IDs (string for single, array for multiple)
        const fileSettings = column.settings as { fileType?: 'single' | 'multiple' } | undefined;
        const isMultiple = fileSettings?.fileType === 'multiple';
        if (isMultiple) {
          cellValue = Array.isArray(editValue) ? editValue : editValue ? [editValue] : [];
        } else {
          cellValue = Array.isArray(editValue) && editValue.length > 0 ? editValue[0] : editValue || null;
        }
      } else if (column.type === 'NUMBER' || column.type === 'CURRENCY') {
        if (editValue && typeof editValue === 'string' && editValue.trim() !== '') {
          const num = Number(editValue);
          cellValue = isNaN(num) ? editValue : num;
        } else {
          cellValue = null;
        }
      }

      // Build updated cells
      const updatedCells = {
        ...currentCells,
        [columnId]: cellValue !== null && cellValue !== undefined && cellValue !== '' 
          ? cellValue 
          : undefined,
      };

      // Remove undefined/null values
      Object.keys(updatedCells).forEach(key => {
        if (updatedCells[key] === undefined || updatedCells[key] === null) {
          delete updatedCells[key];
        }
      });

      // Update the item
      const response = await boardAPI.updateItem(itemId, {
        cells: updatedCells,
      });

      if (response.success) {
        // Update local state immediately for better UX
        setItems(items.map(i => {
          if (i.id === itemId) {
            const updatedCells = {
              ...(i.cells || {}),
              [columnId]: cellValue,
            };
            return {
              ...i,
              cells: updatedCells as Record<string, Cell>,
            } as Item;
          }
          return i;
        }));
        
        setEditingCell(null);
        setEditValue('');
        
        toast({
          title: 'Success',
          description: 'Cell updated successfully',
        });
      } else {
        throw new Error(response.message || 'Failed to update cell');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update cell',
        variant: 'destructive',
      });
    } finally {
      setSavingCell(false);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, itemId: string, columnId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellSave(itemId, columnId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCellCancel();
    }
  };

  const renderCellValue = (item: Item, column: Column) => {
    const cell = item.cells?.[column.id];
    const isEditing = editingCell?.itemId === item.id && editingCell?.columnId === column.id;
    const value = cell ? (typeof cell === 'object' && 'value' in cell ? cell.value : cell) : null;

    // Render editing input
    if (isEditing) {
      switch (column.type) {
        case 'TEXT':
        case 'EMAIL':
        case 'PHONE':
        case 'LINK':
          return (
            <div className="flex items-center gap-1">
              <Input
                type={column.type === 'EMAIL' ? 'email' : column.type === 'PHONE' ? 'tel' : column.type === 'LINK' ? 'url' : 'text'}
                value={editValue as string}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellSave(item.id, column.id)}
                onKeyDown={(e) => handleCellKeyDown(e, item.id, column.id)}
                autoFocus
                className="h-8 text-sm"
                disabled={savingCell}
                placeholder={column.type === 'EMAIL' ? 'email@example.com' : column.type === 'PHONE' ? '+1 (555) 123-4567' : column.type === 'LINK' ? 'https://example.com' : ''}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleCellSave(item.id, column.id)}
                disabled={savingCell}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );

        case 'NUMBER': {
          const numberSettings = column.settings as { numberType?: 'integer' | 'decimal' } | undefined;
          const isInteger = numberSettings?.numberType === 'integer';
          return (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step={isInteger ? '1' : '0.01'}
                value={editValue as string | number}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellSave(item.id, column.id)}
                onKeyDown={(e) => handleCellKeyDown(e, item.id, column.id)}
                autoFocus
                className="h-8 text-sm"
                disabled={savingCell}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleCellSave(item.id, column.id)}
                disabled={savingCell}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        }

        case 'CURRENCY': {
          const currencySettings = column.settings as { currency?: string } | undefined;
          const currency = currencySettings?.currency || 'USD';
          return (
            <div className="flex items-center gap-1">
              <div className="relative flex items-center">
                <span className="absolute left-2 text-sm text-muted-foreground z-10">{currency}</span>
                <Input
                  type="number"
                  step="0.01"
                  value={editValue as string | number}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleCellSave(item.id, column.id)}
                  onKeyDown={(e) => handleCellKeyDown(e, item.id, column.id)}
                  autoFocus
                  className="h-8 text-sm pl-12"
                  disabled={savingCell}
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleCellSave(item.id, column.id)}
                disabled={savingCell}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        }

        case 'PERCENTAGE':
          return (
            <div className="flex items-center gap-1">
              <div className="relative flex items-center">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editValue as string | number}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleCellSave(item.id, column.id)}
                  onKeyDown={(e) => handleCellKeyDown(e, item.id, column.id)}
                  autoFocus
                  className="h-8 text-sm pr-8"
                  disabled={savingCell}
                />
                <span className="absolute right-2 text-sm text-muted-foreground z-10">%</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleCellSave(item.id, column.id)}
                disabled={savingCell}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );

        case 'RATING': {
          const ratingValue = Math.min(5, Math.max(0, Number(editValue) || 0));
          return (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-5 w-5 cursor-pointer transition-colors',
                      star <= ratingValue
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    )}
                    onClick={() => {
                      setEditValue(star);
                      handleCellSave(item.id, column.id);
                    }}
                  />
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        }

        case 'AUTO_NUMBER':
          // Auto-number is read-only
          return (
            <span className="text-muted-foreground px-2 py-1 text-sm">
              {String(value || '—')}
            </span>
          );

        case 'DATE':
          return (
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={editValue as string}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellSave(item.id, column.id)}
                onKeyDown={(e) => handleCellKeyDown(e, item.id, column.id)}
                autoFocus
                className="h-8 text-sm"
                disabled={savingCell}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleCellSave(item.id, column.id)}
                disabled={savingCell}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );

        case 'DATETIME':
          return (
            <div className="flex items-center gap-1">
              <Input
                type="datetime-local"
                value={editValue as string}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellSave(item.id, column.id)}
                onKeyDown={(e) => handleCellKeyDown(e, item.id, column.id)}
                autoFocus
                className="h-8 text-sm"
                disabled={savingCell}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleCellSave(item.id, column.id)}
                disabled={savingCell}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        case 'WEEK':
          return (
            <div className="flex items-center gap-1">
              <Input
                type="week"
                value={editValue as string}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellSave(item.id, column.id)}
                onKeyDown={(e) => handleCellKeyDown(e, item.id, column.id)}
                autoFocus
                className="h-8 text-sm"
                disabled={savingCell}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleCellSave(item.id, column.id)}
                disabled={savingCell}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        case 'MONTH':
          return (
            <div className="flex items-center gap-1">
              <Input
                type="month"
                value={editValue as string}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellSave(item.id, column.id)}
                onKeyDown={(e) => handleCellKeyDown(e, item.id, column.id)}
                autoFocus
                className="h-8 text-sm"
                disabled={savingCell}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleCellSave(item.id, column.id)}
                disabled={savingCell}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        case 'YEAR':
          return (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="1900"
                max="2100"
                placeholder="YYYY"
                value={editValue as string}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellSave(item.id, column.id)}
                onKeyDown={(e) => handleCellKeyDown(e, item.id, column.id)}
                autoFocus
                className="h-8 text-sm"
                disabled={savingCell}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleCellSave(item.id, column.id)}
                disabled={savingCell}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        case 'TIMELINE': {
          try {
            const timeline = typeof editValue === 'string' ? JSON.parse(editValue) : editValue;
            return (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={timeline?.start ? new Date(timeline.start).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const updated = { ...timeline, start: e.target.value ? new Date(e.target.value).toISOString() : '' };
                      setEditValue(JSON.stringify(updated));
                    }}
                    placeholder="Start date"
                    className="h-8 text-sm w-32"
                    disabled={savingCell}
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={timeline?.end ? new Date(timeline.end).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const updated = { ...timeline, end: e.target.value ? new Date(e.target.value).toISOString() : '' };
                      setEditValue(JSON.stringify(updated));
                    }}
                    placeholder="End date"
                    className="h-8 text-sm w-32"
                    disabled={savingCell}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleCellSave(item.id, column.id)}
                  disabled={savingCell}
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={handleCellCancel}
                  disabled={savingCell}
                >
                  <X className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            );
          } catch {
            return (
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  value={editValue as string}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder='{"start":"YYYY-MM-DD","end":"YYYY-MM-DD"}'
                  onBlur={() => handleCellSave(item.id, column.id)}
                  onKeyDown={(e) => handleCellKeyDown(e, item.id, column.id)}
                  autoFocus
                  className="h-8 text-sm"
                  disabled={savingCell}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleCellSave(item.id, column.id)}
                  disabled={savingCell}
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={handleCellCancel}
                  disabled={savingCell}
                >
                  <X className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            );
          }
        }

        case 'CHECKBOX':
          return (
            <div className="flex items-center gap-1">
              <Checkbox
                checked={editValue as boolean}
                onCheckedChange={(checked) => {
                  setEditValue(checked);
                  handleCellSave(item.id, column.id);
                }}
                disabled={savingCell}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );

        case 'DROPDOWN':
        case 'STATUS': {
          const options = (column.settings as { options?: string[] })?.options || [];
          return (
            <div className="flex items-center gap-1">
              <Select
                value={editValue as string || ''}
                onValueChange={(val) => {
                  setEditValue(val);
                  handleCellSave(item.id, column.id);
                }}
                disabled={savingCell}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        }

        case 'RADIO': {
          const radioOptions = (column.settings as { options?: string[] })?.options || [];
          return (
            <div className="flex items-start gap-2 py-1">
              <RadioGroup
                value={editValue as string || ''}
                onValueChange={(val) => {
                  setEditValue(val);
                  handleCellSave(item.id, column.id);
                }}
                disabled={savingCell}
                className="flex flex-col gap-2"
              >
                {radioOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`radio-${column.id}-${option}`} />
                    <Label 
                      htmlFor={`radio-${column.id}-${option}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        }

        case 'LONG_TEXT':
          return (
            <div className="flex items-start gap-1">
              <Textarea
                value={editValue as string}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellSave(item.id, column.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleCellSave(item.id, column.id);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCellCancel();
                  }
                }}
                autoFocus
                className="h-20 text-sm"
                disabled={savingCell}
              />
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleCellSave(item.id, column.id)}
                  disabled={savingCell}
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={handleCellCancel}
                  disabled={savingCell}
                >
                  <X className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            </div>
          );

        case 'MULTI_SELECT': {
          const multiOptions = (column.settings as { options?: string[] })?.options || [];
          const selectedValues = Array.isArray(editValue) ? editValue : editValue ? [editValue] : [];
          return (
            <div className="flex items-center gap-1">
              <Select
                value=""
                onValueChange={(val) => {
                  const newValues = selectedValues.includes(val)
                    ? selectedValues.filter(v => v !== val)
                    : [...selectedValues, val];
                  setEditValue(newValues);
                  handleCellSave(item.id, column.id);
                }}
                disabled={savingCell}
              >
                <SelectTrigger className="h-8 text-sm min-w-[150px]">
                  <SelectValue placeholder={selectedValues.length > 0 ? `${selectedValues.length} selected` : 'Select options'} />
                </SelectTrigger>
                <SelectContent>
                  {multiOptions.map((option) => (
                    <SelectItem 
                      key={option} 
                      value={option}
                      className={selectedValues.includes(option) ? 'bg-blue-50' : ''}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={selectedValues.includes(option)} />
                        {option}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        }

        case 'PEOPLE': {
          const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
          const isMultiple = peopleSettings?.peopleType === 'multiple';
          const currentUserIds = Array.isArray(editValue) 
            ? editValue.map(id => String(id))
            : editValue 
            ? [String(editValue)]
            : [];

          return (
            <div className="flex items-center gap-1">
              <Select
                value={isMultiple ? '' : (editValue as string || '')}
                onValueChange={(val) => {
                  if (isMultiple) {
                    const newValues = currentUserIds.includes(val)
                      ? currentUserIds.filter(id => id !== val)
                      : [...currentUserIds, val];
                    setEditValue(newValues);
                  } else {
                    setEditValue(val);
                  }
                  handleCellSave(item.id, column.id);
                }}
                disabled={savingCell}
              >
                <SelectTrigger className="h-8 text-sm min-w-[150px]">
                  <SelectValue placeholder={isMultiple ? `${currentUserIds.length} selected` : 'Select person'} />
                </SelectTrigger>
                <SelectContent>
                  {workspaceMembers.map((member) => {
                    const isSelected = isMultiple ? currentUserIds.includes(member.id) : editValue === member.id;
                    return (
                      <SelectItem 
                        key={member.id} 
                        value={member.id}
                        className={isSelected ? 'bg-blue-50' : ''}
                      >
                        <div className="flex items-center gap-2">
                          {isMultiple && <Checkbox checked={isSelected} />}
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={member.profilePicture} />
                            <AvatarFallback className="text-xs">
                              {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        }

        case 'FILE': {
          const fileSettings = column.settings as { fileType?: 'single' | 'multiple'; allowedFileTypes?: string[]; maxFileSize?: number } | undefined;
          const isMultiple = fileSettings?.fileType === 'multiple';
          const allowedFileTypes = fileSettings?.allowedFileTypes ?? [];
          const maxFileSize = fileSettings?.maxFileSize ?? 5;

          return (
            <div className="flex items-center gap-1">
              <FileColumnUpload
                itemId={item.id}
                columnId={column.id}
                value={editValue as string | string[] | null | undefined}
                fileType={isMultiple ? 'multiple' : 'single'}
                allowedFileTypes={allowedFileTypes}
                maxFileSize={maxFileSize}
                onValueChange={(fileIds) => {
                  setEditValue(fileIds);
                  handleCellSave(item.id, column.id);
                }}
                className="min-w-[300px]"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
        }

        default:
          return (
            <div className="flex items-center gap-1">
              <Input
                value={String(editValue || '')}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellSave(item.id, column.id)}
                onKeyDown={(e) => handleCellKeyDown(e, item.id, column.id)}
                autoFocus
                className="h-8 text-sm"
                disabled={savingCell}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleCellSave(item.id, column.id)}
                disabled={savingCell}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCellCancel}
                disabled={savingCell}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          );
      }
    }

    // Render display value
    if (!value && value !== 0 && value !== false) {
      return (
        <span 
          className="text-muted-foreground cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
          onClick={() => handleCellClick(item.id, column.id, value, column)}
          title="Click to edit"
        >
          —
        </span>
      );
    }

    switch (column.type) {
      case 'TEXT':
        return (
          <span 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {String(value || '')}
          </span>
        );
      
      case 'EMAIL':
        const emailValue = String(value || '');
        return (
          <span 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {emailValue ? (
              <a 
                href={`mailto:${emailValue}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {emailValue}
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
        );
      
      case 'PHONE':
        const phoneValue = String(value || '');
        return (
          <span 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {phoneValue ? (
              <a 
                href={`tel:${phoneValue.replace(/[^\d+]/g, '')}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {phoneValue}
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
        );
      
      case 'LINK':
        const linkValue = String(value || '');
        const isValidUrl = linkValue && (linkValue.startsWith('http://') || linkValue.startsWith('https://') || linkValue.startsWith('//'));
        const displayUrl = linkValue;
        const hrefUrl = isValidUrl ? linkValue : linkValue ? `https://${linkValue}` : '';
        return (
          <span 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {linkValue ? (
              <a 
                href={hrefUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {displayUrl}
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
        );
      
      case 'LONG_TEXT':
        return (
          <div 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded max-w-md"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            <p className="text-sm line-clamp-2">{String(value || '')}</p>
          </div>
        );
      
      case 'MULTI_SELECT':
        const selectedVals = Array.isArray(value) ? value : value ? [value] : [];
        return (
          <div 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded flex flex-wrap gap-1"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {selectedVals.length > 0 ? (
              selectedVals.map((val, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {String(val)}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </div>
        );
      
      case 'NUMBER': {
        const numValue = value ? Number(value) : null;
        return (
          <span 
            className="font-medium cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {numValue !== null ? numValue.toLocaleString() : '—'}
          </span>
        );
      }

      case 'CURRENCY': {
        const currencySettings = column.settings as { currency?: string } | undefined;
        const currency = currencySettings?.currency || 'USD';
        const currencyValue = value ? Number(value) : null;
        const currencySymbols: Record<string, string> = {
          USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹',
          AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CHF: 'CHF',
          NZD: 'NZ$', BRL: 'R$', MXN: '$', ZAR: 'R'
        };
        const symbol = currencySymbols[currency] || currency;
        return (
          <span 
            className="font-medium cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {currencyValue !== null ? `${symbol}${currencyValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </span>
        );
      }

      case 'PERCENTAGE': {
        const percentValue = value ? Number(value) : null;
        return (
          <span 
            className="font-medium cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {percentValue !== null ? `${percentValue.toFixed(2)}%` : '—'}
          </span>
        );
      }

      case 'RATING': {
        const rating = value ? Math.min(5, Math.max(0, Number(value))) : 0;
        return (
          <div 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded inline-flex items-center gap-1"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'h-4 w-4',
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            ))}
            {rating > 0 && <span className="text-xs text-muted-foreground ml-1">({rating})</span>}
          </div>
        );
      }

      case 'AUTO_NUMBER':
        // Auto-number is read-only, no editing
        return (
          <span className="text-muted-foreground px-2 py-1 text-sm font-mono">
            {value ? String(value) : '—'}
          </span>
        );
      
      case 'DATE':
        return (
          <span 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {value ? new Date(value as string).toLocaleDateString() : '—'}
          </span>
        );
      case 'DATETIME':
        return (
          <span 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {value ? new Date(value as string).toLocaleString() : '—'}
          </span>
        );
      case 'WEEK': {
        const weekDate = value ? new Date(value as string) : null;
        return (
          <span 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {weekDate ? `${weekDate.getFullYear()}-W${String(getWeekNumber(weekDate)).padStart(2, '0')}` : '—'}
          </span>
        );
      }
      case 'MONTH': {
        const monthDate = value ? new Date(value as string) : null;
        return (
          <span 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {monthDate ? monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'}
          </span>
        );
      }
      case 'YEAR': {
        const yearDate = value ? new Date(value as string) : null;
        return (
          <span 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {yearDate ? String(yearDate.getFullYear()) : '—'}
          </span>
        );
      }
      case 'TIMELINE': {
        try {
          const timeline = typeof value === 'object' && value !== null && 'start' in value && 'end' in value
            ? value as { start: string; end: string }
            : typeof value === 'string' 
              ? JSON.parse(value) 
              : null;
          return (
            <span 
              className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
              onClick={() => handleCellClick(item.id, column.id, value, column)}
              title="Click to edit"
            >
              {timeline && timeline.start && timeline.end 
                ? `${new Date(timeline.start).toLocaleDateString()} - ${new Date(timeline.end).toLocaleDateString()}`
                : '—'}
            </span>
          );
        } catch {
          return (
            <span 
              className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
              onClick={() => handleCellClick(item.id, column.id, value, column)}
              title="Click to edit"
            >
              —
            </span>
          );
        }
      }
      
      case 'CHECKBOX':
        return (
          <div 
            className="cursor-pointer inline-block"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            <Badge variant={value ? 'default' : 'outline'}>
              {value ? 'Yes' : 'No'}
            </Badge>
          </div>
        );
      
      case 'DROPDOWN':
        return (
          <span 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {value ? String(value) : '—'}
          </span>
        );

      case 'RADIO':
        return (
          <span 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {value ? String(value) : '—'}
          </span>
        );

      case 'STATUS': {
        const statusValue = String(value || '');
        // Color mapping for common status values
        const getStatusColor = (status: string) => {
          const lowerStatus = status.toLowerCase();
          if (lowerStatus.includes('done') || lowerStatus.includes('completed') || lowerStatus.includes('success')) {
            return 'bg-green-100 text-green-800 border-green-200';
          } else if (lowerStatus.includes('in progress') || lowerStatus.includes('pending') || lowerStatus.includes('active')) {
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          } else if (lowerStatus.includes('blocked') || lowerStatus.includes('error') || lowerStatus.includes('failed') || lowerStatus.includes('rejected')) {
            return 'bg-red-100 text-red-800 border-red-200';
          } else if (lowerStatus.includes('todo') || lowerStatus.includes('new') || lowerStatus.includes('open')) {
            return 'bg-blue-100 text-blue-800 border-blue-200';
          } else if (lowerStatus.includes('cancelled') || lowerStatus.includes('on hold')) {
            return 'bg-gray-100 text-gray-800 border-gray-200';
          }
          return 'bg-slate-100 text-slate-800 border-slate-200';
        };
        
        return (
          <div 
            className="cursor-pointer inline-block"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            <Badge 
              variant="outline" 
              className={cn('capitalize border', getStatusColor(statusValue))}
            >
              {statusValue}
            </Badge>
          </div>
        );
      }

      case 'PEOPLE': {
        const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
        const isMultiple = peopleSettings?.peopleType === 'multiple';
        const userIds = Array.isArray(value) 
          ? value.map(id => String(id))
          : value 
          ? [String(value)]
          : [];

        if (userIds.length === 0) {
          return (
            <span 
              className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
              onClick={() => handleCellClick(item.id, column.id, value, column)}
              title="Click to edit"
            >
              —
            </span>
          );
        }

        const users = workspaceMembers.filter(m => userIds.includes(m.id));

        return (
          <div 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded flex items-center gap-1 flex-wrap"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {users.map((user, idx) => (
              <div key={user.id} className="flex items-center gap-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.profilePicture} />
                  <AvatarFallback className="text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!isMultiple && idx === 0 && (
                  <span className="text-sm">{user.name}</span>
                )}
              </div>
            ))}
            {isMultiple && users.length > 0 && (
              <span className="text-xs text-muted-foreground">({users.length})</span>
            )}
          </div>
        );
      }

      case 'FILE': {
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
              onClick={() => handleCellClick(item.id, column.id, value, column)}
              title="Click to upload files"
            >
              —
            </span>
          );
        }

        return (
          <div 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
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
      }
      
      default:
        return (
          <span 
            className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
            onClick={() => handleCellClick(item.id, column.id, value, column)}
            title="Click to edit"
          >
            {String(value || '')}
          </span>
        );
    }
  };

  const visibleColumns = boardColumns
    .filter(col => !col.isHidden)
    .sort((a, b) => a.position - b.position);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleColumnResize = (columnId: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [columnId]: width }));
    // Save to localStorage
    localStorage.setItem(`columnWidth_${columnId}`, width.toString());
  };

  const handleColumnPin = (columnId: string, side: 'left' | 'right' | null) => {
    setPinnedColumns(prev => ({ ...prev, [columnId]: side }));
    // Save to localStorage
    localStorage.setItem(`columnPinned_${columnId}`, side || '');
  };

  // Load column widths from localStorage
  useEffect(() => {
    const widths: Record<string, number> = {};
    boardColumns.forEach(col => {
      const saved = localStorage.getItem(`columnWidth_${col.id}`);
      if (saved) {
        widths[col.id] = parseInt(saved, 10);
      }
    });
    if (Object.keys(widths).length > 0) {
      setColumnWidths(widths);
    }
  }, [boardColumns]);

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-xl">📋</span>
            </div>
            <span className="text-xl">Items ({filteredItems.length})</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2 mr-4">
                <Badge variant="secondary">{selectedItems.size} selected</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkActionDialog('delete')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}
            <SmartSearch
              boardId={boardId}
              className="w-64"
            />
            <div className="relative">
              <Input
                placeholder="Quick search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
            </div>
            <ItemImportExport
              boardId={boardId}
              items={filteredItems}
              columns={boardColumns}
              onImportComplete={() => {
                fetchItems();
                fetchColumns();
                onColumnsChange?.();
              }}
            />
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
      {selectedItems.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedItems.size}
          totalCount={filteredItems.length}
          actions={[
            {
              label: 'Delete',
              icon: Trash2,
              onClick: () => setBulkActionDialog('delete'),
              variant: 'destructive',
            },
            {
              label: 'Duplicate',
              icon: Copy,
              onClick: async () => {
                for (const itemId of selectedItems) {
                  const item = items.find(i => i.id === itemId);
                  if (item) await handleDuplicateItem(item);
                }
                setSelectedItems(new Set());
              },
            },
          ]}
          onClearSelection={() => setSelectedItems(new Set())}
          onSelectAll={toggleSelectAll}
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
                <Plus className="h-4 w-4 mr-2" />
                Create First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.size > 0 && selectedItems.size === filteredItems.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  {visibleColumns.map((column) => {
                    const colWidth = columnWidths[column.id] || column.width || 150;
                    const pinned = pinnedColumns[column.id];
                    return (
                      <TableHead
                        key={column.id}
                        className={cn(
                          'relative group',
                          pinned === 'left' && 'sticky left-0 z-10 bg-background',
                          pinned === 'right' && 'sticky right-0 z-10 bg-background'
                        )}
                        style={{ 
                          minWidth: `${colWidth}px`, 
                          width: `${colWidth}px`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span>{column.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {column.type}
                          </Badge>
                        </div>
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startWidth = colWidth;
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const diff = moveEvent.clientX - startX;
                              const newWidth = Math.max(100, Math.min(500, startWidth + diff));
                              handleColumnResize(column.id, newWidth);
                            };
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        />
                      </TableHead>
                    );
                  })}
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <ItemContextMenu
                    key={item.id}
                    onEdit={() => onItemEdit?.(item)}
                    onView={() => {
                      // Navigate to item detail page
                      if (workspaceId) {
                        window.location.href = `/workspaces/${workspaceId}/boards/${boardId}/items/${item.id}`;
                      }
                    }}
                    onDuplicate={() => handleDuplicateItem(item)}
                    onDelete={() => {
                      if (confirm('Are you sure you want to delete this item?')) {
                        handleDeleteItem(item);
                      }
                    }}
                    onComment={() => {
                      setSelectedItemId(item.id);
                      setCommentsDialogOpen(true);
                    }}
                    onAttachFile={() => {
                      setSelectedItemId(item.id);
                      setFilesDialogOpen(true);
                    }}
                  >
                    <TableRow className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setCommentsDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Comments
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setFilesDialogOpen(true);
                            }}
                          >
                            <Paperclip className="h-4 w-4 mr-2" />
                            Files
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setApprovalDialogOpen(true);
                              fetchItemApproval(item.id);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approvals
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateItem(item)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {onItemEdit && (
                            <DropdownMenuItem onClick={() => onItemEdit(item)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onItemDelete && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteItem(item)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {itemApprovals[item.id] && (
                          <ApprovalStatusBadge
                            status={itemApprovals[item.id].overallStatus}
                            size="sm"
                          />
                        )}
                      </div>
                    </TableCell>
                    {visibleColumns.map((column) => (
                      <TableCell key={column.id}>
                        {renderCellValue(item, column)}
                      </TableCell>
                    ))}
                    <TableCell>
                      {item.status ? (
                        <Badge variant="outline" className="capitalize">
                          {item.status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  </ItemContextMenu>
                ))}
              </TableBody>
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
              if (!open && !filesDialogOpen) {
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
                // Refresh approval status when opening
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

      {/* Bulk Delete Confirmation Dialog */}
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

