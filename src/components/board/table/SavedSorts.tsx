// Saved sorts component - Save and load sort preferences

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
import { Bookmark, Save, Trash2 } from 'lucide-react';
import { SortConfig } from './utils/sortUtils';
import { useToast } from '@/hooks/use-toast';

interface SavedSortsProps {
  boardId: string;
  sortConfigs: SortConfig[];
  onLoadSort: (sorts: SortConfig[]) => void;
}

const STORAGE_KEY_PREFIX = 'ezify_saved_sorts_';

export interface SavedSort {
  id: string;
  name: string;
  sortConfigs: SortConfig[];
}

export const SavedSorts: React.FC<SavedSortsProps> = ({
  boardId,
  sortConfigs,
  onLoadSort,
}) => {
  const { toast } = useToast();
  const [savedSorts, setSavedSorts] = useState<SavedSort[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [sortName, setSortName] = useState('');

  const storageKey = `${STORAGE_KEY_PREFIX}${boardId}`;

  useEffect(() => {
    loadSavedSorts();
  }, [boardId]);

  const loadSavedSorts = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedSort[];
        setSavedSorts(parsed);
      }
    } catch (error) {
      console.error('Error loading saved sorts:', error);
    }
  };

  const saveSort = () => {
    if (!sortName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a sort name',
        variant: 'destructive',
      });
      return;
    }

    if (sortConfigs.length === 0) {
      toast({
        title: 'Error',
        description: 'No sort configuration to save',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newSort: SavedSort = {
        id: `sort-${Date.now()}`,
        name: sortName.trim(),
        sortConfigs: [...sortConfigs],
      };

      const updated = [...savedSorts, newSort];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setSavedSorts(updated);
      setSortName('');
      setSaveDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Sort preferences saved successfully',
      });
    } catch (error) {
      console.error('Error saving sort:', error);
      toast({
        title: 'Error',
        description: 'Failed to save sort preferences',
        variant: 'destructive',
      });
    }
  };

  const loadSort = (savedSort: SavedSort) => {
    onLoadSort(savedSort.sortConfigs);
    toast({
      title: 'Success',
      description: `Loaded sort: ${savedSort.name}`,
    });
  };

  const deleteSort = (sortId: string) => {
    try {
      const updated = savedSorts.filter(s => s.id !== sortId);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setSavedSorts(updated);
      toast({
        title: 'Success',
        description: 'Sort preferences deleted',
      });
    } catch (error) {
      console.error('Error deleting sort:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete sort preferences',
        variant: 'destructive',
      });
    }
  };

  // Load default sort on mount if available
  useEffect(() => {
    if (savedSorts.length > 0 && sortConfigs.length === 0) {
      // Optionally auto-load the first saved sort
      // For now, we'll let users manually load
    }
  }, [savedSorts, sortConfigs.length]);

  if (savedSorts.length === 0 && sortConfigs.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Sorts
            {savedSorts.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                {savedSorts.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {savedSorts.length > 0 ? (
            <>
              {savedSorts.map(sort => (
                <DropdownMenuItem
                  key={sort.id}
                  onSelect={() => loadSort(sort)}
                  className="flex items-center justify-between"
                >
                  <span>{sort.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSort(sort.id);
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
              <span className="text-muted-foreground text-sm">No saved sorts</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() => setSaveDialogOpen(true)}
            disabled={sortConfigs.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Current Sort
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Sort Preferences</DialogTitle>
            <DialogDescription>
              Save your current sort configuration for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sort-name">Sort Name</Label>
              <Input
                id="sort-name"
                placeholder="e.g., Priority High to Low, Date Newest First, etc."
                value={sortName}
                onChange={(e) => setSortName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveSort();
                  }
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Current sort columns: {sortConfigs.length}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSort} disabled={!sortName.trim()}>
              Save Sort
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

