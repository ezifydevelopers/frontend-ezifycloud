import { useState, useCallback } from 'react';
import { permissionAPI } from '@/lib/api';
import { Item } from '@/types/workspace';

type FilterType = 'all' | 'assigned' | 'created' | 'department' | 'custom';

interface RowFilterOptions {
  filterBy?: FilterType;
  departmentId?: string;
  customFilters?: Array<{
    columnId: string;
    operator?: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
    value?: unknown;
  }>;
}

interface UseRowFiltersOptions {
  boardId: string;
  onFilterChange?: (items: Item[]) => void;
}

/**
 * Hook for row-level filtering
 */
export const useRowFilters = (options: UseRowFiltersOptions) => {
  const { boardId, onFilterChange } = options;
  const [filterBy, setFilterBy] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const applyFilter = useCallback(async (filterOptions: RowFilterOptions) => {
    try {
      setLoading(true);
      setError(null);

      const response = await permissionAPI.getFilteredItems(boardId, {
        filterBy: filterOptions.filterBy || 'all',
        departmentId: filterOptions.departmentId,
        customFilters: filterOptions.customFilters,
      });

      if (response.success && response.data) {
        const filteredItems = (response.data.items || []) as Item[];
        setItems(filteredItems);
        setFilterBy(filterOptions.filterBy || 'all');
        onFilterChange?.(filteredItems);
      } else {
        throw new Error(response.message || 'Failed to filter items');
      }
    } catch (err) {
      console.error('Error applying row filter:', err);
      setError(err instanceof Error ? err : new Error('Failed to filter items'));
    } finally {
      setLoading(false);
    }
  }, [boardId, onFilterChange]);

  const clearFilter = useCallback(() => {
    setFilterBy('all');
    applyFilter({ filterBy: 'all' });
  }, [applyFilter]);

  const filterAssigned = useCallback(() => {
    applyFilter({ filterBy: 'assigned' });
  }, [applyFilter]);

  const filterCreated = useCallback(() => {
    applyFilter({ filterBy: 'created' });
  }, [applyFilter]);

  const filterDepartment = useCallback((departmentId?: string) => {
    applyFilter({ filterBy: 'department', departmentId });
  }, [applyFilter]);

  const filterCustom = useCallback((customFilters: RowFilterOptions['customFilters']) => {
    applyFilter({ filterBy: 'custom', customFilters });
  }, [applyFilter]);

  return {
    filterBy,
    items,
    loading,
    error,
    applyFilter,
    clearFilter,
    filterAssigned,
    filterCreated,
    filterDepartment,
    filterCustom,
  };
};

