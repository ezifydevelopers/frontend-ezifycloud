import { useState, useEffect, useMemo } from 'react';
import { permissionAPI } from '@/lib/api';
import { Column } from '@/types/workspace';
import { useAuth } from '@/contexts/AuthContext';

interface ColumnWithVisibility extends Column {
  canView: boolean;
  isSensitive: boolean;
  isHidden: boolean;
}

interface UseColumnVisibilityOptions {
  boardId: string;
  columns: Column[];
  itemId?: string;
  enabled?: boolean;
}

/**
 * Hook to get visible columns based on permissions and visibility rules
 */
export const useColumnVisibility = (options: UseColumnVisibilityOptions) => {
  const { boardId, columns, itemId, enabled = true } = options;
  const { user } = useAuth();
  const [visibleColumns, setVisibleColumns] = useState<ColumnWithVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !boardId || !user) {
      setLoading(false);
      return;
    }

    const fetchVisibleColumns = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await permissionAPI.getVisibleColumns(boardId, itemId);

        if (response.success && response.data) {
          setVisibleColumns(response.data as ColumnWithVisibility[]);
        } else {
          // Fallback: filter by isHidden
          const filtered = columns
            .filter(col => !col.isHidden)
            .map(col => ({
              ...col,
              canView: true,
              isSensitive: false,
              isHidden: false,
            }));
          setVisibleColumns(filtered);
        }
      } catch (err) {
        console.error('Error fetching visible columns:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch visible columns'));
        
        // Fallback: filter by isHidden
        const filtered = columns
          .filter(col => !col.isHidden)
          .map(col => ({
            ...col,
            canView: true,
            isSensitive: false,
            isHidden: false,
          }));
        setVisibleColumns(filtered);
      } finally {
        setLoading(false);
      }
    };

    fetchVisibleColumns();
  }, [boardId, itemId, enabled, user, columns]);

  // Filter to only visible columns
  const visible = useMemo(() => {
    return visibleColumns.filter(col => col.canView && !col.isHidden);
  }, [visibleColumns]);

  // Filter to only sensitive columns
  const sensitive = useMemo(() => {
    return visibleColumns.filter(col => col.isSensitive);
  }, [visibleColumns]);

  return {
    columns: visible,
    allColumns: visibleColumns,
    sensitiveColumns: sensitive,
    loading,
    error,
  };
};

/**
 * Hook to check if a specific column is visible
 */
export const useCanViewColumn = (
  columnId: string | null | undefined,
  itemId?: string,
  enabled = true
): boolean => {
  const { user } = useAuth();
  const [canView, setCanView] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !columnId || !user) {
      setLoading(false);
      return;
    }

    const checkVisibility = async () => {
      try {
        setLoading(true);
        const response = await permissionAPI.canViewColumn(columnId, itemId);
        setCanView(response.success && response.data?.canView === true);
      } catch (error) {
        console.error('Error checking column visibility:', error);
        setCanView(false);
      } finally {
        setLoading(false);
      }
    };

    checkVisibility();
  }, [columnId, itemId, enabled, user]);

  return canView && !loading;
};

