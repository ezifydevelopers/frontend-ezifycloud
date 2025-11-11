// Quick filters component - Pre-defined common filters

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, User, Calendar, CheckCircle2, UserCheck } from 'lucide-react';
import { Column, Item } from '@/types/workspace';
import { TableFilter } from './TableFilters';
import { useAuth } from '@/contexts/AuthContext';

interface QuickFiltersProps {
  columns: Column[];
  items: Item[];
  filters: TableFilter[];
  onFilterAdd: (filter: TableFilter) => void;
  onFilterRemove: (filterId: string) => void;
  className?: string;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  columns,
  items,
  filters,
  onFilterAdd,
  onFilterRemove,
  className,
}) => {
  const { user } = useAuth();
  
  // Find status column
  const statusColumn = columns.find(col => col.type === 'STATUS' && !col.isHidden);
  
  // Find people/assignee column
  const peopleColumn = columns.find(col => col.type === 'PEOPLE' && !col.isHidden);
  
  // Find date column
  const dateColumn = columns.find(
    col => (col.type === 'DATE' || col.type === 'DATETIME') && !col.isHidden
  );

  const getQuickFilter = (type: 'status' | 'assignee' | 'date', value: string): TableFilter | null => {
    let column: Column | undefined;
    
    switch (type) {
      case 'status':
        column = statusColumn;
        break;
      case 'assignee':
        column = peopleColumn;
        break;
      case 'date':
        column = dateColumn;
        break;
    }

    if (!column) return null;

    return {
      id: `quick-${type}-${value}`,
      columnId: column.id,
      type: type === 'assignee' ? 'multiselect' : type === 'date' ? 'date' : 'status',
      value: type === 'assignee' ? [value] : value,
      condition: 'AND',
    };
  };

  const isQuickFilterActive = (type: 'status' | 'assignee' | 'date', value: string): boolean => {
    // Check if any filter matches this quick filter type and value
    let column: Column | undefined;
    switch (type) {
      case 'status':
        column = statusColumn;
        break;
      case 'assignee':
        column = peopleColumn;
        break;
      case 'date':
        column = dateColumn;
        break;
    }
    
    if (!column) return false;
    
    return filters.some(f => {
      if (f.columnId !== column!.id) return false;
      
      if (type === 'date') {
        // For date quick filters, check if value matches the pattern
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (value === 'today') {
          const filterDate = new Date(f.value as string);
          return filterDate.toDateString() === today.toDateString();
        } else if (value === 'this-week') {
          const dayOfWeek = today.getDay();
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - dayOfWeek);
          const filterDate = new Date(f.value as string);
          return filterDate >= weekStart && f.operator === 'greater_than';
        } else if (value === 'this-month') {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const filterDate = new Date(f.value as string);
          return filterDate >= monthStart && f.operator === 'greater_than';
        }
      }
      
      return String(f.value) === value || 
             (Array.isArray(f.value) && f.value.includes(value));
    });
  };

  const handleQuickFilter = (type: 'status' | 'assignee' | 'date', value: string) => {
    // Check if this quick filter is already active
    let column: Column | undefined;
    switch (type) {
      case 'status':
        column = statusColumn;
        break;
      case 'assignee':
        column = peopleColumn;
        break;
      case 'date':
        column = dateColumn;
        break;
    }
    
    if (!column) return;
    
    // Find existing filter for this column and value
    const existing = filters.find(f => {
      if (f.columnId !== column!.id) return false;
      
      if (type === 'date') {
        // For date filters, check if the filter matches the quick filter pattern
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (value === 'today') {
          const filterDate = new Date(f.value as string);
          return filterDate.toDateString() === today.toDateString();
        } else if (value === 'this-week' || value === 'this-month') {
          return f.operator === 'greater_than';
        }
      }
      
      if (type === 'assignee') {
        return Array.isArray(f.value) && f.value.includes(value);
      }
      
      return String(f.value) === value;
    });
    
    if (existing) {
      onFilterRemove(existing.id);
    } else {
      const filter = getQuickFilter(type, value);
      if (filter) {
        onFilterAdd(filter);
      }
    }
  };

  // Get unique status values
  const statusValues = statusColumn ? Array.from(
    new Set(
      items
        .map(item => item.status)
        .filter((s): s is string => !!s)
    )
  ).slice(0, 5) : [];

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className || ''}`}>
      <Filter className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Quick:</span>
      
      {/* Status Quick Filters */}
      {statusColumn && statusValues.length > 0 && (
        <>
          {statusValues.map(status => (
            <Button
              key={status}
              variant={isQuickFilterActive('status', status) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickFilter('status', status)}
              className="h-7 text-xs"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {status}
            </Button>
          ))}
        </>
      )}

      {/* Date Quick Filters */}
      {dateColumn && (
        <>
          <Button
            variant={isQuickFilterActive('date', 'today') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickFilter('date', 'today')}
            className="h-7 text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Today
          </Button>
          <Button
            variant={isQuickFilterActive('date', 'this-week') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickFilter('date', 'this-week')}
            className="h-7 text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            This Week
          </Button>
          <Button
            variant={isQuickFilterActive('date', 'this-month') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickFilter('date', 'this-month')}
            className="h-7 text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            This Month
          </Button>
        </>
      )}

      {/* Assignee Quick Filters */}
      {peopleColumn && (
        <>
          {/* My Assignments */}
          {user && (
            <Button
              variant={isQuickFilterActive('assignee', user.id) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickFilter('assignee', user.id)}
              className="h-7 text-xs"
            >
              <UserCheck className="h-3 w-3 mr-1" />
              My Assignments
            </Button>
          )}
          
          {/* Unassigned */}
          <Button
            variant={isQuickFilterActive('assignee', '__unassigned__') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickFilter('assignee', '__unassigned__')}
            className="h-7 text-xs"
          >
            <User className="h-3 w-3 mr-1" />
            Unassigned
          </Button>
        </>
      )}
    </div>
  );
};
