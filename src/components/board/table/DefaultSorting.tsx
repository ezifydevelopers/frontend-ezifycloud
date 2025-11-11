import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, Save, X } from 'lucide-react';
import { Column } from '@/types/workspace';
import { SortConfig } from './utils/sortUtils';
import { useToast } from '@/hooks/use-toast';

interface DefaultSortingProps {
  boardId: string;
  columns: Column[];
  currentSorts: SortConfig[];
  onSortChange: (sorts: SortConfig[]) => void;
}

const STORAGE_KEY_PREFIX = 'ezify_default_sort_';

export const DefaultSorting: React.FC<DefaultSortingProps> = ({
  boardId,
  columns,
  currentSorts,
  onSortChange,
}) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultSorts, setDefaultSorts] = useState<SortConfig[]>([]);
  const [useDefault, setUseDefault] = useState(false);

  const storageKey = `${STORAGE_KEY_PREFIX}${boardId}`;

  // Load default sort on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDefaultSorts(parsed.sorts || []);
        setUseDefault(parsed.enabled || false);
        
        // Apply default sort if enabled and no current sorts
        if (parsed.enabled && parsed.sorts && parsed.sorts.length > 0 && currentSorts.length === 0) {
          onSortChange(parsed.sorts);
        }
      }
    } catch (error) {
      console.error('Error loading default sort:', error);
    }
  }, [boardId, storageKey]);

  // Apply default sort when enabled and current sorts are cleared
  useEffect(() => {
    if (useDefault && defaultSorts.length > 0 && currentSorts.length === 0) {
      onSortChange(defaultSorts);
    }
  }, [useDefault, defaultSorts, currentSorts.length, onSortChange]);

  const saveDefaultSort = () => {
    if (currentSorts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please configure a sort first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const config = {
        enabled: useDefault,
        sorts: currentSorts,
      };
      localStorage.setItem(storageKey, JSON.stringify(config));
      setDefaultSorts(currentSorts);
      
      toast({
        title: 'Success',
        description: 'Default sort saved',
      });
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving default sort:', error);
      toast({
        title: 'Error',
        description: 'Failed to save default sort',
        variant: 'destructive',
      });
    }
  };

  const clearDefaultSort = () => {
    try {
      localStorage.removeItem(storageKey);
      setDefaultSorts([]);
      setUseDefault(false);
      
      toast({
        title: 'Success',
        description: 'Default sort cleared',
      });
    } catch (error) {
      console.error('Error clearing default sort:', error);
    }
  };

  const getColumnName = (columnId: string) => {
    return columns.find(c => c.id === columnId)?.name || columnId;
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="relative"
      >
        <ArrowUpDown className="h-4 w-4 mr-2" />
        Default Sort
        {useDefault && defaultSorts.length > 0 && (
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Default Sorting</DialogTitle>
            <DialogDescription>
              Set a default sort that will be applied automatically when viewing this board
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-default"
                checked={useDefault}
                onCheckedChange={(checked) => setUseDefault(checked === true)}
              />
              <Label htmlFor="use-default" className="cursor-pointer">
                Enable default sorting
              </Label>
            </div>

            {defaultSorts.length > 0 && (
              <div className="space-y-2">
                <Label>Current Default Sort</Label>
                <div className="border rounded-lg p-3 space-y-2">
                  {defaultSorts.map((sort, index) => (
                    <div key={sort.columnId} className="flex items-center justify-between text-sm">
                      <span>
                        {index + 1}. {getColumnName(sort.columnId)} ({sort.direction})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentSorts.length > 0 && (
              <div className="space-y-2">
                <Label>Current Sort Configuration</Label>
                <div className="border rounded-lg p-3 space-y-2">
                  {currentSorts.map((sort, index) => (
                    <div key={sort.columnId} className="flex items-center justify-between text-sm">
                      <span>
                        {index + 1}. {getColumnName(sort.columnId)} ({sort.direction})
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Save this configuration as the default sort
                </p>
              </div>
            )}

            {currentSorts.length === 0 && defaultSorts.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                Configure a sort first, then save it as default
              </div>
            )}
          </div>

          <DialogFooter>
            {defaultSorts.length > 0 && (
              <Button variant="outline" onClick={clearDefaultSort}>
                <X className="h-4 w-4 mr-2" />
                Clear Default
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDefaultSort} disabled={currentSorts.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              Save as Default
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

