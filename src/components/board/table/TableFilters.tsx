// Table filters component - column-specific filters, date ranges, multi-select filters

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, Filter, Calendar } from 'lucide-react';
import { Column, Item } from '@/types/workspace';
import { cn } from '@/lib/utils';

export interface TableFilter {
  id: string;
  columnId: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'status';
  operator?: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between';
  value: unknown;
  condition?: 'AND' | 'OR'; // For multiple filters
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: TableFilter[];
}

interface TableFiltersProps {
  columns: Column[];
  items: Item[];
  filters: TableFilter[];
  onFiltersChange: (filters: TableFilter[]) => void;
  className?: string;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  columns,
  items,
  filters,
  onFiltersChange,
  className,
}) => {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const addFilter = (columnId: string, type: TableFilter['type'], value: unknown, operator?: TableFilter['operator']) => {
    const existingIndex = filters.findIndex(f => f.columnId === columnId);
    const newFilter: TableFilter = {
      id: `filter-${Date.now()}-${Math.random()}`,
      columnId,
      type,
      value,
      operator: operator || 'equals',
      condition: filters.length > 0 ? 'AND' : undefined,
    };

    if (existingIndex >= 0) {
      const newFilters = [...filters];
      newFilters[existingIndex] = newFilter;
      onFiltersChange(newFilters);
    } else {
      onFiltersChange([...filters, newFilter]);
    }
    setOpenPopover(null);
  };

  const removeFilter = (filterIdOrColumnId: string) => {
    onFiltersChange(filters.filter(f => f.id !== filterIdOrColumnId && f.columnId !== filterIdOrColumnId));
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  const getFilterableColumns = () => {
    return columns.filter(col => {
      // Filter out columns that shouldn't be filterable
      if (col.type === 'FORMULA' || col.type === 'AUTO_NUMBER' || col.type === 'FILE') {
        return false;
      }
      return true;
    });
  };

  const getColumnUniqueValues = (columnId: string, limit = 50): unknown[] => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return [];

    const values = new Set<unknown>();
    items.forEach(item => {
      const cell = item.cells?.[columnId];
      if (cell !== null && cell !== undefined) {
        const cellValue = typeof cell === 'object' && 'value' in cell ? cell.value : cell;
        if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
          if (column.type === 'MULTI_SELECT' && Array.isArray(cellValue)) {
            cellValue.forEach(v => values.add(String(v)));
          } else {
            values.add(String(cellValue));
          }
        }
      }
    });
    return Array.from(values).slice(0, limit);
  };

  const renderFilterPopover = (column: Column) => {
    const existingFilter = filters.find(f => f.columnId === column.id);
    const uniqueValues = getColumnUniqueValues(column.id);

    switch (column.type) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'LINK':
      case 'LONG_TEXT':
        return (
          <Input
            placeholder={`Filter ${column.name}...`}
            defaultValue={existingFilter?.value as string || ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value;
                if (value.trim()) {
                  addFilter(column.id, 'text', value, 'contains');
                } else {
                  removeFilter(existingFilter?.id || column.id);
                }
              }
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value.trim()) {
                addFilter(column.id, 'text', value, 'contains');
              } else if (existingFilter) {
                removeFilter(existingFilter.id);
              }
            }}
          />
        );

      case 'NUMBER':
      case 'CURRENCY':
      case 'PERCENTAGE':
      case 'RATING':
        return (
          <div className="space-y-2">
            <Label>Filter by {column.name}</Label>
            <Input
              type="number"
              placeholder="Enter value..."
              defaultValue={existingFilter?.value as number || ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseFloat((e.target as HTMLInputElement).value);
                  if (!isNaN(value)) {
                    addFilter(column.id, 'number', value);
                  } else {
                    removeFilter(column.id);
                  }
                }
              }}
            />
          </div>
        );

      case 'DATE':
      case 'DATETIME':
      case 'WEEK':
      case 'MONTH':
      case 'YEAR':
        return (
          <div className="space-y-2">
            <Label>Filter by {column.name}</Label>
            <Input
              type={column.type === 'DATETIME' ? 'datetime-local' : 'date'}
              defaultValue={existingFilter?.value as string || ''}
              onChange={(e) => {
                if (e.target.value) {
                  addFilter(column.id, 'date', e.target.value);
                } else {
                  removeFilter(column.id);
                }
              }}
            />
          </div>
        );

      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            <Label>Filter by {column.name}</Label>
            <Select
              value={existingFilter?.value !== undefined ? String(existingFilter.value) : ''}
              onValueChange={(value) => {
                if (value === 'all') {
                  removeFilter(column.id);
                } else {
                  addFilter(column.id, 'checkbox', value === 'true');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'DROPDOWN':
      case 'RADIO':
      case 'STATUS':
        if (uniqueValues.length === 0) {
          return (
            <div className="text-sm text-muted-foreground p-2">
              No values available
            </div>
          );
        }
        return (
          <div className="space-y-2">
            <Label>Filter by {column.name}</Label>
            <Select
              value={existingFilter?.value !== undefined ? String(existingFilter.value) : ''}
              onValueChange={(value) => {
                if (value === 'all') {
                  removeFilter(column.id);
                } else {
                  addFilter(column.id, 'select', value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {uniqueValues.map((val, idx) => (
                  <SelectItem key={idx} value={String(val)}>
                    {String(val)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'MULTI_SELECT':
        // Multi-select filter - show checkboxes for unique values
        if (uniqueValues.length === 0) {
          return (
            <div className="text-sm text-muted-foreground p-2">
              No values available
            </div>
          );
        }
        const selectedValues = existingFilter?.value as string[] || [];
        return (
          <div className="space-y-2">
            <Label>Filter by {column.name}</Label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {uniqueValues.map((val, idx) => {
                const valueStr = String(val);
                const isSelected = selectedValues.includes(valueStr);
                return (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 p-1 rounded"
                    onClick={() => {
                      const newSelected = isSelected
                        ? selectedValues.filter(v => v !== valueStr)
                        : [...selectedValues, valueStr];
                      if (newSelected.length > 0) {
                        addFilter(column.id, 'multiselect', newSelected);
                      } else {
                        removeFilter(column.id);
                      }
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => {}} // Handled by parent onClick
                    />
                    <span className="text-sm">{valueStr}</span>
                  </div>
                );
              })}
            </div>
            {selectedValues.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeFilter(column.id)}
                className="w-full"
              >
                Clear
              </Button>
            )}
          </div>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground p-2">
            Filtering not available for this column type
          </div>
        );
    }
  };

  const getFilterDisplayValue = (filter: TableFilter): string => {
    const column = columns.find(c => c.id === filter.columnId);
    if (!column) return '';

    if (filter.type === 'multiselect' && Array.isArray(filter.value)) {
      return `${column.name}: ${filter.value.length} selected`;
    }
    if (filter.type === 'checkbox') {
      return `${column.name}: ${filter.value ? 'Yes' : 'No'}`;
    }
    return `${column.name}: ${String(filter.value)}`;
  };

  const filterableColumns = getFilterableColumns();

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <Popover open={openPopover === 'main'} onOpenChange={(open) => setOpenPopover(open ? 'main' : null)}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium border-gray-300 hover:bg-gray-50">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filters
            {filters.length > 0 && (
              <Badge variant="default" className="ml-1.5 h-4 px-1.5 text-xs font-medium bg-blue-600 text-white border-0">
                {filters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <Label className="text-sm font-semibold text-gray-900">Column Filters</Label>
              {filters.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-xs text-gray-600 hover:text-gray-900">
                  Clear All
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filterableColumns.map(column => (
                <Popover key={column.id} open={openPopover === column.id} onOpenChange={(open) => setOpenPopover(open ? column.id : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs font-medium border-gray-300 hover:bg-gray-50">
                      <span className="text-gray-700">{column.name}</span>
                      {filters.find(f => f.columnId === column.id) && (
                        <Badge variant="default" className="ml-2 h-4 px-1.5 text-xs font-medium bg-blue-600 text-white border-0">
                          Active
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    {renderFilterPopover(column)}
                  </PopoverContent>
                </Popover>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filters as badges */}
      {filters.map((filter) => {
        const column = columns.find(c => c.id === filter.columnId);
        if (!column) return null;
        return (
          <Badge
            key={filter.columnId}
            variant="secondary"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
          >
            <span>{getFilterDisplayValue(filter)}</span>
            <button
              onClick={() => removeFilter(filter.id)}
              className="ml-0.5 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
    </div>
  );
};

