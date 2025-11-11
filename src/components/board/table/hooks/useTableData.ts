// Hook for managing table data (items, columns, loading state)

import { useState, useEffect, useCallback } from 'react';
import { Item, Column } from '@/types/workspace';
import { boardAPI, workspaceAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { offlineCache } from '@/services/offlineCache';

interface UseTableDataProps {
  boardId: string;
  workspaceId?: string;
  initialColumns?: Column[];
}

export const useTableData = ({ boardId, workspaceId, initialColumns = [] }: UseTableDataProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [loading, setLoading] = useState(true);
  const [workspaceMembers, setWorkspaceMembers] = useState<Array<{ id: string; name: string; email: string; profilePicture?: string }>>([]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try cache first if offline
      const cacheKey = `board:${boardId}:items`;
      if (!navigator.onLine) {
        const cached = await offlineCache.get<{ items: Item[]; total: number }>(cacheKey);
        if (cached) {
          console.log('[useTableData] Using cached items');
          setItems(cached.items || []);
          setLoading(false);
          return;
        }
      }
      
      const response = await boardAPI.getBoardItems(boardId, {
        page: 1,
        limit: 100,
      });

      if (import.meta.env.DEV) {
        console.log('[useTableData] API Response:', {
          success: response.success,
          hasData: !!response.data,
          dataType: typeof response.data,
          dataKeys: response.data ? Object.keys(response.data as object) : [],
        });
      }

      if (response.success && response.data) {
        type ItemsPayload = { items?: Item[]; data?: Item[] };
        const payload = response.data as unknown as ItemsPayload;
        let itemsData: Item[] = payload.items ?? payload.data ?? [];
        
        if (import.meta.env.DEV) {
          console.log('[useTableData] Extracted items:', {
            count: itemsData.length,
            hasItems: payload.items !== undefined,
            hasData: payload.data !== undefined,
          });
        }
        
        // Transform items: convert cells array to cells object
        itemsData = itemsData.map(item => {
          // Backend returns cells as array: [{ columnId: '...', value: '...', column: {...} }, ...]
          // Frontend expects cells as object: { [columnId]: value }
          let cellsObject: Record<string, unknown> = {};
          
          if (item.cells && Array.isArray(item.cells)) {
            // Transform array to object
            item.cells.forEach((cell: any) => {
              if (cell && cell.columnId) {
                // Extract value from cell object
                const cellValue = cell.value !== undefined ? cell.value : cell;
                cellsObject[cell.columnId] = cellValue;
              }
            });
          } else if (item.cells && typeof item.cells === 'object' && !Array.isArray(item.cells)) {
            // Already an object, use as is
            cellsObject = item.cells as Record<string, unknown>;
          }
          
          return {
            ...item,
            cells: cellsObject,
          };
        });
        
        // Debug: Log first item structure to verify cells are present
        if (import.meta.env.DEV && itemsData.length > 0) {
          console.log('[useTableData] First item structure:', {
            id: itemsData[0].id,
            name: itemsData[0].name,
            hasCells: !!itemsData[0].cells,
            cellsKeys: itemsData[0].cells ? Object.keys(itemsData[0].cells) : [],
            cellsSample: itemsData[0].cells ? Object.entries(itemsData[0].cells).slice(0, 3) : [],
            rawCellsType: payload.items?.[0]?.cells ? (Array.isArray(payload.items[0].cells) ? 'array' : typeof payload.items[0].cells) : 'none',
          });
        }
        
        setItems(itemsData);
        
        // Cache items for offline use
        try {
          await offlineCache.set(cacheKey, {
            items: itemsData,
            total: itemsData.length,
          }, 5 * 60 * 1000); // 5 minutes
        } catch (error) {
          console.warn('Failed to cache items:', error);
        }
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
        setColumns(columnsData);
      }
    } catch (error) {
      console.error('Error fetching columns:', error);
    }
  }, [boardId]);

  const fetchWorkspaceMembers = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const response = await workspaceAPI.getWorkspaceMembers(workspaceId);
      if (response.success && response.data) {
        const members = Array.isArray(response.data) ? response.data : [];
        setWorkspaceMembers(members.map((m: any) => ({
          id: m.id || m.userId,
          name: m.name || m.user?.name || m.userName || '',
          email: m.email || m.user?.email || m.userEmail || '',
          profilePicture: m.profilePicture || m.user?.profilePicture || m.avatar || undefined,
        })));
      }
    } catch (error) {
      console.error('Error fetching workspace members:', error);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (initialColumns.length > 0) {
      setColumns(initialColumns);
    } else {
      fetchColumns();
    }
  }, [initialColumns, fetchColumns]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchWorkspaceMembers();
  }, [fetchWorkspaceMembers]);

  return {
    items,
    setItems,
    columns,
    setColumns,
    loading,
    workspaceMembers,
    fetchItems,
    fetchColumns,
    fetchWorkspaceMembers,
  };
};

