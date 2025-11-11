// Table toolbar component - simplified and cleaner UI

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Plus, Trash2, Search, Filter, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Column } from '@/types/workspace';

interface TableToolbarProps {
  boardId: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  totalCount: number;
  onBulkDelete: () => void;
  onRefresh: () => void;
  onCreateItem?: () => void;
  columns: Column[];
  onImportComplete?: () => void;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  boardId,
  searchTerm,
  onSearchChange,
  selectedCount,
  totalCount,
  onBulkDelete,
  onRefresh,
  onCreateItem,
  columns,
  filteredItems = [],
  onImportComplete,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
      {/* Left: Search */}
      <div className="flex-1 w-full sm:max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`pl-9 h-9 sm:h-9 text-sm bg-white border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-150 ${searchFocused ? 'ring-1 ring-blue-500 border-blue-500 shadow-sm' : ''}`}
              />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {selectedCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkDelete}
                  className="h-9 sm:h-9 px-2 sm:px-3 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 touch-manipulation"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white text-xs">
                <p>Delete {selectedCount} selected item{selectedCount > 1 ? 's' : ''}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-9 w-9 p-0 hover:bg-gray-100 touch-manipulation"
              >
                <RefreshCw className="h-4 w-4 text-gray-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white text-xs">
              <p>Refresh data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

            {onCreateItem && (
              <Button 
                onClick={onCreateItem} 
                size="sm" 
                className="h-9 sm:h-9 px-3 sm:px-4 font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-150 touch-manipulation"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Item</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}

        {/* More options dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100">
              <MoreVertical className="h-4 w-4 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onImportComplete && (
              <>
                <DropdownMenuItem onClick={() => {/* Open import dialog */}}>
                  Import
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {/* Open export dialog */}}>
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

