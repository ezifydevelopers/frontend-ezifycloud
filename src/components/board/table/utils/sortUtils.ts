// Sorting utilities for table items

import { Item, Column } from '@/types/workspace';
import { getCellValue } from './tableUtils';

export type SortConfig = {
  columnId: string;
  direction: 'asc' | 'desc';
  priority: number; // For multi-column sorting (lower number = higher priority)
};

/**
 * Sort items by column(s)
 */
export const sortItems = (
  items: Item[],
  sortConfigs: SortConfig[],
  columns: Column[]
): Item[] => {
  if (sortConfigs.length === 0) return items;

  // Sort by priority first
  const sortedConfigs = [...sortConfigs].sort((a, b) => a.priority - b.priority);

  return [...items].sort((a, b) => {
    // Compare items using all sort configurations in priority order
    for (const sortConfig of sortedConfigs) {
      let comparison = 0;

      // Special handling for 'name' column (it's not in cells)
      if (sortConfig.columnId === 'name') {
        const aName = a.name || '';
        const bName = b.name || '';
        const nameComparison = aName.localeCompare(bName, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
        comparison = sortConfig.direction === 'asc' ? nameComparison : -nameComparison;
      } else {
        const column = columns.find(c => c.id === sortConfig.columnId);
        if (!column) continue;

        const aValue = getCellValue(a, sortConfig.columnId);
        const bValue = getCellValue(b, sortConfig.columnId);

        comparison = compareValues(aValue, bValue, column.type);
        
        // Apply direction
        if (comparison !== 0) {
          comparison = sortConfig.direction === 'asc' ? comparison : -comparison;
        }
      }
      
      // If values are equal, continue to next sort criteria
      if (comparison !== 0) {
        return comparison;
      }
    }

    // If all sort criteria are equal, maintain original order
    return 0;
  });
};

/**
 * Compare two values based on column type
 */
const compareValues = (a: unknown, b: unknown, columnType: string): number => {
  // Handle null/undefined values
  if (a === null || a === undefined) {
    return b === null || b === undefined ? 0 : 1; // nulls last
  }
  if (b === null || b === undefined) {
    return -1; // nulls last
  }

  // Handle empty strings
  if (a === '' && b === '') return 0;
  if (a === '') return 1;
  if (b === '') return -1;

  switch (columnType) {
    case 'NUMBER':
    case 'CURRENCY':
    case 'PERCENTAGE':
    case 'RATING':
    case 'PROGRESS': {
      const aNum = typeof a === 'number' ? a : parseFloat(String(a));
      const bNum = typeof b === 'number' ? b : parseFloat(String(b));
      
      if (isNaN(aNum) && isNaN(bNum)) return 0;
      if (isNaN(aNum)) return 1;
      if (isNaN(bNum)) return -1;
      
      return aNum - bNum;
    }

    case 'DATE':
    case 'DATETIME': {
      const aDate = new Date(a as string);
      const bDate = new Date(b as string);
      
      if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
      if (isNaN(aDate.getTime())) return 1;
      if (isNaN(bDate.getTime())) return -1;
      
      return aDate.getTime() - bDate.getTime();
    }

    case 'WEEK': {
      const aDate = new Date(a as string);
      const bDate = new Date(b as string);
      if (isNaN(aDate.getTime()) || isNaN(bDate.getTime())) return 0;
      return aDate.getTime() - bDate.getTime();
    }

    case 'MONTH':
    case 'YEAR': {
      const aDate = new Date(a as string);
      const bDate = new Date(b as string);
      if (isNaN(aDate.getTime()) || isNaN(bDate.getTime())) return 0;
      return aDate.getTime() - bDate.getTime();
    }

    case 'CHECKBOX': {
      const aBool = a === true || a === 'true' || String(a).toLowerCase() === 'yes';
      const bBool = b === true || b === 'true' || String(b).toLowerCase() === 'yes';
      return aBool === bBool ? 0 : aBool ? 1 : -1;
    }

    case 'MULTI_SELECT': {
      const aArr = Array.isArray(a) ? a : [a];
      const bArr = Array.isArray(b) ? b : [b];
      const aStr = aArr.map(v => String(v)).join(', ');
      const bStr = bArr.map(v => String(v)).join(', ');
      return aStr.localeCompare(bStr);
    }

    case 'PEOPLE': {
      // Compare by number of people assigned
      const aArr = Array.isArray(a) ? a : (a ? [a] : []);
      const bArr = Array.isArray(b) ? b : (b ? [b] : []);
      const diff = aArr.length - bArr.length;
      if (diff !== 0) return diff;
      // If same count, compare by first person name
      if (aArr.length > 0 && bArr.length > 0) {
        const aName = typeof aArr[0] === 'string' ? aArr[0] : (aArr[0] as any)?.name || '';
        const bName = typeof bArr[0] === 'string' ? bArr[0] : (bArr[0] as any)?.name || '';
        return aName.localeCompare(bName);
      }
      return 0;
    }

    default:
      // String comparison for TEXT, EMAIL, PHONE, LINK, STATUS, DROPDOWN, etc.
      return String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
  }
};

/**
 * Get sort indicator icon based on sort state
 */
export const getSortIcon = (
  columnId: string,
  sortConfigs: SortConfig[]
): 'asc' | 'desc' | 'none' => {
  const sortConfig = sortConfigs.find(s => s.columnId === columnId);
  if (!sortConfig) return 'none';
  return sortConfig.direction;
};

/**
 * Toggle sort for a column (cycle: none -> asc -> desc -> none)
 */
export const toggleSort = (
  columnId: string,
  currentSorts: SortConfig[]
): SortConfig[] => {
  const existingIndex = currentSorts.findIndex(s => s.columnId === columnId);
  
  if (existingIndex >= 0) {
    const existing = currentSorts[existingIndex];
    
    if (existing.direction === 'asc') {
      // Change to desc
      const newSorts = [...currentSorts];
      newSorts[existingIndex] = { ...existing, direction: 'desc' };
      return newSorts;
    } else {
      // Remove sort (desc -> none)
      return currentSorts.filter((_, i) => i !== existingIndex);
    }
  } else {
    // Add new sort (none -> asc)
    const maxPriority = currentSorts.length > 0
      ? Math.max(...currentSorts.map(s => s.priority))
      : -1;
    
    return [
      ...currentSorts,
      {
        columnId,
        direction: 'asc',
        priority: maxPriority + 1,
      },
    ];
  }
};

/**
 * Set sort priority (for multi-column sorting)
 */
export const setSortPriority = (
  columnId: string,
  newPriority: number,
  currentSorts: SortConfig[]
): SortConfig[] => {
  const existingIndex = currentSorts.findIndex(s => s.columnId === columnId);
  if (existingIndex < 0) return currentSorts;

  // Adjust priorities of other sorts
  const updated = currentSorts.map((sort, index) => {
    if (index === existingIndex) {
      return { ...sort, priority: newPriority };
    }
    
    // Shift other sorts if needed
    if (sort.priority >= newPriority && sort.priority < currentSorts[existingIndex].priority) {
      return { ...sort, priority: sort.priority + 1 };
    }
    if (sort.priority <= newPriority && sort.priority > currentSorts[existingIndex].priority) {
      return { ...sort, priority: sort.priority - 1 };
    }
    
    return sort;
  });

  // Normalize priorities to be sequential
  return updated.map((sort, index) => ({
    ...sort,
    priority: index,
  }));
};

