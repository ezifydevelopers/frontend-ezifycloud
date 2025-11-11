import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Save } from 'lucide-react';
import { DashboardFilters as DashboardFiltersType } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';

interface DashboardFiltersProps {
  filters?: DashboardFiltersType;
  onFiltersChange: (filters: DashboardFiltersType) => void;
  onSaveFilters?: (filters: DashboardFiltersType) => void;
  availableStatuses?: string[];
  availableBoards?: Array<{ id: string; name: string }>;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters = {},
  onFiltersChange,
  onSaveFilters,
  availableStatuses = [],
  availableBoards = [],
}) => {
  const { toast } = useToast();
  const [localFilters, setLocalFilters] = useState<DashboardFiltersType>(filters);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(filters.status || []);

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    const updated = {
      ...localFilters,
      dateRange: {
        ...localFilters.dateRange,
        [field]: value,
      } as { from: string; to: string },
    };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const handleStatusToggle = (status: string) => {
    const updated = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    
    setSelectedStatuses(updated);
    const newFilters = {
      ...localFilters,
      status: updated.length > 0 ? updated : undefined,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleBoardChange = (boardId: string) => {
    const newFilters = {
      ...localFilters,
      boardId: boardId || undefined,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const cleared: DashboardFiltersType = {};
    setLocalFilters(cleared);
    setSelectedStatuses([]);
    onFiltersChange(cleared);
  };

  const handleSaveFilters = () => {
    if (onSaveFilters) {
      onSaveFilters(localFilters);
      toast({
        title: 'Success',
        description: 'Filter settings saved',
      });
    }
  };

  const hasActiveFilters = 
    localFilters.dateRange?.from ||
    localFilters.dateRange?.to ||
    (localFilters.status && localFilters.status.length > 0) ||
    localFilters.boardId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filters</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={localFilters.dateRange?.from || ''}
                onChange={(e) => handleDateRangeChange('from', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={localFilters.dateRange?.to || ''}
                onChange={(e) => handleDateRangeChange('to', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Status Filter */}
        {availableStatuses.length > 0 && (
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {availableStatuses.map((status) => (
                <Badge
                  key={status}
                  variant={selectedStatuses.includes(status) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleStatusToggle(status)}
                >
                  {status}
                  {selectedStatuses.includes(status) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Board Filter */}
        {availableBoards.length > 0 && (
          <div className="space-y-2">
            <Label>Board</Label>
            <Select
              value={localFilters.boardId || ''}
              onValueChange={handleBoardChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Boards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Boards</SelectItem>
                {availableBoards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Save Filters Button */}
        {onSaveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveFilters}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Filter Settings
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

