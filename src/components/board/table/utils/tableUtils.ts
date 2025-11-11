// Table utility functions

import { Item, Column } from '@/types/workspace';
import { TableFilter } from '../TableFilters';

/**
 * Get cell value from an item
 * Handles both object format { value: ... } and direct value format
 */
export const getCellValue = (item: Item, columnId: string): unknown => {
  // Ensure cells object exists
  if (!item.cells || typeof item.cells !== 'object') {
    return null;
  }
  
  const cell = item.cells[columnId];
  if (cell === undefined || cell === null) {
    return null;
  }
  
  // Handle different cell formats
  // Format 1: Direct value (string, number, etc.)
  if (typeof cell !== 'object') {
    return cell;
  }
  
  // Format 2: Object with 'value' property
  if ('value' in cell) {
    return (cell as { value: unknown }).value;
  }
  
  // Format 3: Already transformed object, return as is
  return cell;
};

/**
 * Get visible columns (non-hidden, sorted by position)
 * Enhanced with permission-based visibility
 */
export const getVisibleColumns = (
  columns: Column[],
  visibleColumnIds?: string[]
): Column[] => {
  let filtered = columns.filter(col => !col.isHidden);
  
  // If visible column IDs provided, further filter by them
  if (visibleColumnIds && visibleColumnIds.length > 0) {
    filtered = filtered.filter(col => visibleColumnIds.includes(col.id));
  }
  
  return filtered.sort((a, b) => a.position - b.position);
};

/**
 * Filter items by search term
 */
export const filterItems = (items: Item[], searchTerm: string): Item[] => {
  if (!searchTerm.trim()) return items;
  
  const term = searchTerm.toLowerCase();
  return items.filter(item =>
    item.name.toLowerCase().includes(term) ||
    item.status?.toLowerCase().includes(term)
  );
};

/**
 * Apply column filters to items with support for AND/OR conditions
 */
export const applyColumnFilters = (items: Item[], filters: TableFilter[], columns: Column[]): Item[] => {
  if (filters.length === 0) return items;

  // Group filters by condition (AND/OR)
  const filterGroups: TableFilter[][] = [];
  let currentGroup: TableFilter[] = [];

  filters.forEach((filter, index) => {
    currentGroup.push(filter);
    
    // If next filter has OR condition, start a new group
    // If this is the last filter, finalize the current group
    const nextFilter = filters[index + 1];
    if (!nextFilter || nextFilter.condition === 'OR') {
      filterGroups.push(currentGroup);
      currentGroup = [];
    }
  });

  // Apply filter groups (each group is ANDed together, groups are ORed)
  if (filterGroups.length === 0) return items;

  // If all filters are AND (default), use simple AND logic
  const allAND = filters.every(f => !f.condition || f.condition === 'AND');
  
  if (allAND || filterGroups.length === 1) {
    // Simple AND logic
    return items.filter(item => {
      return filters.every(filter => {
        return matchesFilter(item, filter, columns);
      });
    });
  } else {
    // Complex OR logic - item passes if it matches any filter group
    return items.filter(item => {
      return filterGroups.some(group => {
        return group.every(filter => matchesFilter(item, filter, columns));
      });
    });
  }
};

/**
 * Check if an item matches a single filter
 */
const matchesFilter = (item: Item, filter: TableFilter, columns: Column[]): boolean => {
  const column = columns.find(c => c.id === filter.columnId);
  if (!column) return true;

  const cellValue = getCellValue(item, filter.columnId);
  const operator = filter.operator || 'equals';

  switch (filter.type) {
    case 'text':
      if (filter.value === null || filter.value === undefined || filter.value === '') return true;
      const searchTerm = String(filter.value).toLowerCase();
      const valueStr = String(cellValue || '').toLowerCase();
      
      switch (operator) {
        case 'contains':
          return valueStr.includes(searchTerm);
        case 'starts_with':
          return valueStr.startsWith(searchTerm);
        case 'ends_with':
          return valueStr.endsWith(searchTerm);
        case 'equals':
        default:
          return valueStr === searchTerm;
      }

    case 'number':
      const filterNum = typeof filter.value === 'number' ? filter.value : parseFloat(String(filter.value));
      const cellNum = typeof cellValue === 'number' ? cellValue : parseFloat(String(cellValue || 0));
      
      if (isNaN(filterNum) || isNaN(cellNum)) return false;
      
      switch (operator) {
        case 'greater_than':
          return cellNum > filterNum;
        case 'less_than':
          return cellNum < filterNum;
        case 'equals':
        default:
          return cellNum === filterNum;
      }

    case 'date':
      if (!filter.value || !cellValue) return true;
      const filterDate = new Date(filter.value as string);
      const cellDate = new Date(cellValue as string);
      
      if (isNaN(filterDate.getTime()) || isNaN(cellDate.getTime())) return true;
      
      switch (operator) {
        case 'greater_than':
          return cellDate > filterDate;
        case 'less_than':
          return cellDate < filterDate;
        case 'equals':
        default:
          return filterDate.toDateString() === cellDate.toDateString();
      }

    case 'select':
      return String(cellValue) === String(filter.value);

    case 'multiselect':
      if (!Array.isArray(filter.value)) return true;
      
      // Handle PEOPLE column special cases
      if (column.type === 'PEOPLE') {
        const cellArray = Array.isArray(cellValue) ? cellValue : cellValue ? [cellValue] : [];
        
        // Check for unassigned filter
        if (filter.value.includes('__unassigned__')) {
          return cellArray.length === 0;
        }
        
        // Check if any filter value matches cell values
        return filter.value.some(fv => {
          if (fv === '__unassigned__') return cellArray.length === 0;
          return cellArray.some(cv => String(cv) === String(fv));
        });
      }
      
      // Regular multiselect
      const cellArray = Array.isArray(cellValue) ? cellValue : cellValue ? [cellValue] : [];
      return filter.value.some(fv => cellArray.some(cv => String(cv) === String(fv)));

    case 'checkbox':
      const filterBool = filter.value === true || filter.value === 'true';
      const cellBool = cellValue === true || cellValue === 'true' || String(cellValue).toLowerCase() === 'yes';
      return filterBool === cellBool;

    case 'status':
      return String(cellValue).toLowerCase() === String(filter.value).toLowerCase();

    default:
      return true;
  }
};

/**
 * Combine search term and column filters
 */
export const applyAllFilters = (
  items: Item[],
  searchTerm: string,
  columnFilters: TableFilter[],
  columns: Column[]
): Item[] => {
  let result = items;
  
  // Apply search term filter
  if (searchTerm.trim()) {
    result = filterItems(result, searchTerm);
  }
  
  // Apply column filters
  if (columnFilters.length > 0) {
    result = applyColumnFilters(result, columnFilters, columns);
  }
  
  return result;
};

// Re-export sort utilities
export { sortItems, toggleSort } from './sortUtils';
export type { SortConfig } from './sortUtils';
