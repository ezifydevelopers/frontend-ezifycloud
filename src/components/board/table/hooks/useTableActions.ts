// Hook for managing table actions (delete, duplicate, etc.)

import { useCallback } from 'react';
import { Item, Column } from '@/types/workspace';
import { boardAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UseTableActionsProps {
  boardId: string;
  boardColumns: Column[];
  onSuccess?: () => void;
  onItemDelete?: (item: Item) => void;
}

export const useTableActions = ({
  boardId,
  boardColumns,
  onSuccess,
  onItemDelete,
}: UseTableActionsProps) => {
  const { toast } = useToast();

  const handleDeleteItem = useCallback(async (item: Item) => {
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
        onSuccess?.();
        onItemDelete?.(item);
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
  }, [boardId, toast, onSuccess, onItemDelete]);

  const handleDuplicateItem = useCallback(async (item: Item) => {
    try {
      const itemResponse = await boardAPI.getBoardItems(boardId, { page: 1, limit: 100 });
      const allItems = itemResponse.success && itemResponse.data 
        ? ((itemResponse.data as any).data || []) 
        : [];
      const fullItem = allItems.find((i: Item) => i.id === item.id);
      
      if (!fullItem) {
        throw new Error('Item not found');
      }

      const cells: Record<string, unknown> = {};
      if (fullItem.cells) {
        Object.entries(fullItem.cells).forEach(([columnId, cell]) => {
          const cellValue = typeof cell === 'object' && 'value' in cell ? cell.value : cell;
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
        onSuccess?.();
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
  }, [boardId, boardColumns, toast, onSuccess]);

  const handleBulkDelete = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    try {
      const deletePromises = itemIds.map(itemId => boardAPI.deleteItem(itemId));
      await Promise.all(deletePromises);
      
      toast({
        title: 'Success',
        description: `${itemIds.length} item(s) deleted successfully`,
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete items',
        variant: 'destructive',
      });
    }
  }, [toast, onSuccess]);

  return {
    handleDeleteItem,
    handleDuplicateItem,
    handleBulkDelete,
  };
};

