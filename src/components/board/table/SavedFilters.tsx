// Saved filters component - Save and load filter presets

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Bookmark, Save, Trash2, Loader2 } from 'lucide-react';
import { TableFilter, SavedFilter } from './TableFilters';
import { useToast } from '@/hooks/use-toast';

interface SavedFiltersProps {
  boardId: string;
  filters: TableFilter[];
  onLoadFilter: (filters: TableFilter[]) => void;
}

const STORAGE_KEY_PREFIX = 'ezify_saved_filters_';

export const SavedFilters: React.FC<SavedFiltersProps> = ({
  boardId,
  filters,
  onLoadFilter,
}) => {
  const { toast } = useToast();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');

  const storageKey = `${STORAGE_KEY_PREFIX}${boardId}`;

  useEffect(() => {
    loadSavedFilters();
  }, [boardId]);

  const loadSavedFilters = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedFilter[];
        setSavedFilters(parsed);
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  };

  const saveFilter = () => {
    if (!filterName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a filter name',
        variant: 'destructive',
      });
      return;
    }

    if (filters.length === 0) {
      toast({
        title: 'Error',
        description: 'No filters to save',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newFilter: SavedFilter = {
        id: `filter-${Date.now()}`,
        name: filterName.trim(),
        filters: [...filters],
      };

      const updated = [...savedFilters, newFilter];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setSavedFilters(updated);
      setFilterName('');
      setSaveDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Filter saved successfully',
      });
    } catch (error) {
      console.error('Error saving filter:', error);
      toast({
        title: 'Error',
        description: 'Failed to save filter',
        variant: 'destructive',
      });
    }
  };

  const loadFilter = (savedFilter: SavedFilter) => {
    onLoadFilter(savedFilter.filters);
    toast({
      title: 'Success',
      description: `Loaded filter: ${savedFilter.name}`,
    });
  };

  const deleteFilter = (filterId: string) => {
    try {
      const updated = savedFilters.filter(f => f.id !== filterId);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setSavedFilters(updated);
      toast({
        title: 'Success',
        description: 'Filter deleted',
      });
    } catch (error) {
      console.error('Error deleting filter:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete filter',
        variant: 'destructive',
      });
    }
  };

  if (savedFilters.length === 0 && filters.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Filters
            {savedFilters.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                {savedFilters.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {savedFilters.length > 0 ? (
            <>
              {savedFilters.map(filter => (
                <DropdownMenuItem
                  key={filter.id}
                  onSelect={() => loadFilter(filter)}
                  className="flex items-center justify-between"
                >
                  <span>{filter.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFilter(filter.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground text-sm">No saved filters</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() => setSaveDialogOpen(true)}
            disabled={filters.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Current Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Save your current filter configuration for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Filter Name</Label>
              <Input
                id="filter-name"
                placeholder="e.g., Active Tasks, High Priority, etc."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveFilter();
                  }
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Current filters: {filters.length}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveFilter} disabled={!filterName.trim()}>
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
