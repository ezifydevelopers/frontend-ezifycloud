// Unified dialog for filters, sorting, grouping, and other table controls

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter, ArrowUpDown, Layers, Eye } from 'lucide-react';
import { TableFilters, TableFilter } from './TableFilters';
import { TableSorting, SortConfig } from './TableSorting';
import { TableGrouping, GroupConfig } from './TableGrouping';
import { SavedFilters } from './SavedFilters';
import { SavedSorts } from './SavedSorts';
import { RowHeightControl } from './RowHeightControl';
import { Column, Item } from '@/types/workspace';

interface TableControlsDialogProps {
  boardId: string;
  columns: Column[];
  items: Item[];
  filters: TableFilter[];
  onFiltersChange: (filters: TableFilter[]) => void;
  sortConfigs: SortConfig[];
  onSortChange: (sorts: SortConfig[]) => void;
  groupConfig: GroupConfig;
  onGroupConfigChange: (config: GroupConfig) => void;
  rowHeight: number;
  onRowHeightChange: (height: number) => void;
  onColumnVisibilityClick?: () => void;
}

export const TableControlsDialog: React.FC<TableControlsDialogProps> = ({
  boardId,
  columns,
  items,
  filters,
  onFiltersChange,
  sortConfigs,
  onSortChange,
  groupConfig,
  onGroupConfigChange,
  rowHeight,
  onRowHeightChange,
  onColumnVisibilityClick,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium border-gray-300 hover:bg-gray-50">
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          View Options
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-lg font-semibold text-gray-900">Table View Options</DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-1">
            Customize how your table is displayed, filtered, and sorted
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="filters" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1">
            <TabsTrigger value="filters" className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filters
            </TabsTrigger>
            <TabsTrigger value="sort" className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              Sort
            </TabsTrigger>
            <TabsTrigger value="group" className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900">
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Group
            </TabsTrigger>
            <TabsTrigger value="display" className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Display
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="filters" className="space-y-4 mt-4">
            <TableFilters
              columns={columns}
              items={items}
              filters={filters}
              onFiltersChange={onFiltersChange}
            />
            <SavedFilters
              boardId={boardId}
              filters={filters}
              onLoadFilter={onFiltersChange}
            />
          </TabsContent>
          
          <TabsContent value="sort" className="space-y-4 mt-4">
            <TableSorting
              columns={columns}
              sortConfigs={sortConfigs}
              onSortChange={onSortChange}
            />
            <SavedSorts
              boardId={boardId}
              sortConfigs={sortConfigs}
              onLoadSort={onSortChange}
            />
          </TabsContent>
          
          <TabsContent value="group" className="space-y-4 mt-4">
            <TableGrouping
              columns={columns}
              items={items}
              groupConfig={groupConfig}
              onGroupConfigChange={onGroupConfigChange}
            />
          </TabsContent>
          
          <TabsContent value="display" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Row Height</label>
                <RowHeightControl
                  rowHeight={rowHeight}
                  onRowHeightChange={onRowHeightChange}
                />
              </div>
              {onColumnVisibilityClick && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Column Visibility</label>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onColumnVisibilityClick();
                      setOpen(false);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Manage Columns
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

