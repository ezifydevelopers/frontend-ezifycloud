import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Filter,
  X,
  User,
  FileText,
  Building2,
  Settings,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type FilterType = 'all' | 'assigned' | 'created' | 'department' | 'custom';

interface RowFilterPanelProps {
  boardId: string;
  onFilterChange: (filter: {
    filterBy: FilterType;
    departmentId?: string;
    customFilters?: Array<{
      columnId: string;
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
      value: unknown;
    }>;
  }) => void;
  columns?: Array<{ id: string; name: string; type: string }>;
  currentFilter?: FilterType;
}

export const RowFilterPanel: React.FC<RowFilterPanelProps> = ({
  boardId,
  onFilterChange,
  columns = [],
  currentFilter = 'all',
}) => {
  const [filterBy, setFilterBy] = useState<FilterType>(currentFilter);
  const [customFilters, setCustomFilters] = useState<Array<{
    columnId: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
    value: string;
  }>>([]);

  const handleFilterChange = (newFilter: FilterType) => {
    setFilterBy(newFilter);
    onFilterChange({
      filterBy: newFilter,
    });
  };

  const addCustomFilter = () => {
    setCustomFilters([...customFilters, {
      columnId: '',
      operator: 'equals',
      value: '',
    }]);
  };

  const removeCustomFilter = (index: number) => {
    setCustomFilters(customFilters.filter((_, i) => i !== index));
  };

  const updateCustomFilter = (index: number, field: string, value: unknown) => {
    const updated = [...customFilters];
    updated[index] = { ...updated[index], [field]: value };
    setCustomFilters(updated);
    
    if (filterBy === 'custom') {
      onFilterChange({
        filterBy: 'custom',
        customFilters: updated.map(f => ({
          ...f,
          value: f.value,
        })),
      });
    }
  };

  const applyCustomFilters = () => {
    onFilterChange({
      filterBy: 'custom',
      customFilters: customFilters.map(f => ({
        ...f,
        value: f.value,
      })),
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Row Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterBy} onValueChange={(v) => handleFilterChange(v as FilterType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  All Items
                </div>
              </SelectItem>
              <SelectItem value="assigned">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned to Me
                </div>
              </SelectItem>
              <SelectItem value="created">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Created by Me
                </div>
              </SelectItem>
              <SelectItem value="department">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  My Department
                </div>
              </SelectItem>
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Custom Filters
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {filterBy !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange('all')}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}

          {filterBy === 'custom' && (
            <Button
              variant="outline"
              size="sm"
              onClick={addCustomFilter}
            >
              Add Filter
            </Button>
          )}
        </div>

        {filterBy === 'custom' && (
          <div className="space-y-3 border-t pt-4">
            {customFilters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No custom filters. Click "Add Filter" to create one.
              </p>
            ) : (
              <>
                {customFilters.map((filter, index) => (
                  <div key={index} className="flex items-end gap-2 p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Column</Label>
                      <Select
                        value={filter.columnId}
                        onValueChange={(v) => updateCustomFilter(index, 'columnId', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                              {col.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-[120px] space-y-2">
                      <Label className="text-xs">Operator</Label>
                      <Select
                        value={filter.operator}
                        onValueChange={(v) => updateCustomFilter(index, 'operator', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                          <SelectItem value="in">In</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Value</Label>
                      <Input
                        value={filter.value}
                        onChange={(e) => updateCustomFilter(index, 'value', e.target.value)}
                        placeholder="Enter value"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomFilter(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button onClick={applyCustomFilters} className="w-full">
                  Apply Filters
                </Button>
              </>
            )}
          </div>
        )}

        {filterBy !== 'all' && filterBy !== 'custom' && (
          <Badge variant="secondary" className="text-xs">
            Showing: {filterBy === 'assigned' && 'Assigned to Me'}
            {filterBy === 'created' && 'Created by Me'}
            {filterBy === 'department' && 'My Department'}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

