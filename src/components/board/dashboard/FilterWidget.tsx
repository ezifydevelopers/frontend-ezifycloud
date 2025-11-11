import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter, X } from 'lucide-react';
import { Column } from '@/types/workspace';

interface FilterWidgetProps {
  title?: string;
  columns: Column[];
  filters: Record<string, unknown>;
  onFilterChange: (filters: Record<string, unknown>) => void;
  className?: string;
}

export const FilterWidget: React.FC<FilterWidgetProps> = ({
  title = 'Filters',
  columns,
  filters,
  onFilterChange,
  className,
}) => {
  const [localFilters, setLocalFilters] = React.useState<Record<string, unknown>>(filters);

  const handleFilterChange = (key: string, value: unknown) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border-white/20 shadow-xl ${className || ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            {title}
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {columns
          .filter(col => !col.isHidden && (col.type === 'STATUS' || col.type === 'DROPDOWN' || col.type === 'PEOPLE' || col.type === 'TEXT'))
          .map((column) => {
            const filterValue = localFilters[column.id];

            if (column.type === 'STATUS' || column.type === 'DROPDOWN') {
              const options = (column.settings as { options?: string[] })?.options || [];
              return (
                <div key={column.id} className="space-y-2">
                  <Label className="text-sm font-medium">{column.name}</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={filterValue ? String(filterValue) : ''}
                      onValueChange={(value) => handleFilterChange(column.id, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={`Select ${column.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        {options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {filterValue && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => clearFilter(column.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            }

            if (column.type === 'TEXT') {
              return (
                <div key={column.id} className="space-y-2">
                  <Label className="text-sm font-medium">{column.name}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={filterValue ? String(filterValue) : ''}
                      onChange={(e) => handleFilterChange(column.id, e.target.value || undefined)}
                      placeholder={`Search ${column.name}`}
                      className="flex-1"
                    />
                    {filterValue && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => clearFilter(column.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })}

        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {Object.entries(localFilters).map(([key, value]) => {
                const column = columns.find(c => c.id === key);
                if (!column || !value) return null;
                return (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    {column.name}: {String(value)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => clearFilter(key)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

