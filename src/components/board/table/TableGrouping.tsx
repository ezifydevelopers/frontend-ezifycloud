// Table grouping component - Group items by column value with expand/collapse

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, X, Group } from 'lucide-react';
import { Column, Item } from '@/types/workspace';
import { getCellValue } from './utils/tableUtils';
import { cn } from '@/lib/utils';

export interface GroupConfig {
  columnId: string | null;
  expandedGroups: Set<string>;
}

interface TableGroupingProps {
  columns: Column[];
  items: Item[];
  groupConfig: GroupConfig;
  onGroupConfigChange: (config: GroupConfig) => void;
  className?: string;
}

interface GroupedData {
  groupKey: string;
  groupValue: string;
  items: Item[];
}

export const TableGrouping: React.FC<TableGroupingProps> = ({
  columns,
  items,
  groupConfig,
  onGroupConfigChange,
  className,
}) => {
  const groupableColumns = useMemo(() => {
    return columns.filter(col => {
      // Filter out columns that shouldn't be groupable
      if (col.type === 'FORMULA' || col.type === 'FILE' || col.type === 'LONG_TEXT') {
        return false;
      }
      return !col.isHidden;
    });
  }, [columns]);

  const groupedData = useMemo(() => {
    if (!groupConfig.columnId) {
      return null;
    }

    const column = columns.find(c => c.id === groupConfig.columnId);
    if (!column) return null;

    const groups = new Map<string, Item[]>();

    items.forEach(item => {
      const cellValue = getCellValue(item, groupConfig.columnId);
      const groupKey = cellValue === null || cellValue === undefined || cellValue === ''
        ? '__empty__'
        : String(cellValue);

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(item);
    });

    // Convert to array and sort
    const grouped: GroupedData[] = Array.from(groups.entries())
      .map(([key, items]) => ({
        groupKey: key,
        groupValue: key === '__empty__' ? '(Empty)' : key,
        items: items.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
      }))
      .sort((a, b) => {
        // Sort empty group last
        if (a.groupKey === '__empty__') return 1;
        if (b.groupKey === '__empty__') return -1;
        
        // For numbers, sort numerically
        const aNum = parseFloat(a.groupValue);
        const bNum = parseFloat(b.groupValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        
        // For dates, sort chronologically
        const aDate = new Date(a.groupValue);
        const bDate = new Date(b.groupValue);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return aDate.getTime() - bDate.getTime();
        }
        
        // Default: alphabetical
        return a.groupValue.localeCompare(b.groupValue);
      });

    return grouped;
  }, [items, groupConfig.columnId, columns]);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(groupConfig.expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    onGroupConfigChange({
      ...groupConfig,
      expandedGroups: newExpanded,
    });
  };

  const expandAllGroups = () => {
    if (!groupedData) return;
    const allGroupKeys = new Set(groupedData.map(g => g.groupKey));
    onGroupConfigChange({
      ...groupConfig,
      expandedGroups: allGroupKeys,
    });
  };

  const collapseAllGroups = () => {
    onGroupConfigChange({
      ...groupConfig,
      expandedGroups: new Set(),
    });
  };

  const clearGrouping = () => {
    onGroupConfigChange({
      columnId: null,
      expandedGroups: new Set(),
    });
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-2">
        <Group className="h-4 w-4 text-muted-foreground" />
        <Select
          value={groupConfig.columnId || 'none'}
          onValueChange={(value) => {
            if (value === 'none') {
              clearGrouping();
            } else {
              onGroupConfigChange({
                columnId: value,
                expandedGroups: new Set(),
              });
            }
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Group by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Grouping</SelectItem>
            {groupableColumns.map(column => (
              <SelectItem key={column.id} value={column.id}>
                {column.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groupConfig.columnId && groupedData && (
        <>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAllGroups}
              className="h-7 text-xs"
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAllGroups}
              className="h-7 text-xs"
            >
              Collapse All
            </Button>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            {groupedData.length} groups
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearGrouping}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};

/**
 * Group items by column value
 */
export const groupItems = (
  items: Item[],
  groupConfig: GroupConfig,
  columns: Column[]
): GroupedData[] | null => {
  if (!groupConfig.columnId) {
    return null;
  }

  const column = columns.find(c => c.id === groupConfig.columnId);
  if (!column) return null;

  const groups = new Map<string, Item[]>();

  items.forEach(item => {
    const cellValue = getCellValue(item, groupConfig.columnId!);
    const groupKey = cellValue === null || cellValue === undefined || cellValue === ''
      ? '__empty__'
      : String(cellValue);

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(item);
  });

  return Array.from(groups.entries()).map(([key, items]) => ({
    groupKey: key,
    groupValue: key === '__empty__' ? '(Empty)' : key,
    items,
  }));
};

/**
 * Render group header row
 */
export const GroupHeader: React.FC<{
  group: GroupedData;
  isExpanded: boolean;
  onToggle: () => void;
  column?: Column;
}> = ({ group, isExpanded, onToggle, column }) => {
  return (
        <tr className="bg-gray-100/80 hover:bg-gray-100 border-b-2 border-gray-200 transition-colors duration-150">
          <td colSpan={100} className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={onToggle}
                  className="p-1.5 hover:bg-gray-200 rounded transition-colors duration-150 active:scale-95"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-700" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-700" />
                  )}
                </button>
            <span className="font-semibold text-gray-900 text-sm">
              {group.groupValue}
            </span>
            <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5 bg-gray-200 text-gray-700 border border-gray-300">
              {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>
      </td>
    </tr>
  );
};
