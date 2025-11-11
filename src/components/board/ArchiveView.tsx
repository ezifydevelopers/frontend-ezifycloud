// Archive View - Display and manage archived items

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Archive,
  RefreshCw,
  RotateCcw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { itemAPI } from '@/lib/api';
import { Item } from '@/types/workspace';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface ArchiveViewProps {
  boardId: string;
  onItemRestored?: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  boardId,
  onItemRestored,
}) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    itemId?: string;
  }>({ open: false });

  const fetchArchivedItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await itemAPI.getArchivedItems(boardId, {
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        const responseData = response.data as { data?: unknown[]; items?: unknown[] };
        const itemsData = (responseData.data || responseData.items || []) as Item[];
        setItems(itemsData);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching archived items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch archived items',
        variant: 'destructive',
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [boardId, toast]);

  useEffect(() => {
    fetchArchivedItems();
  }, [fetchArchivedItems]);

  const filteredItems = items.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleRestore = async (itemIds: string[]) => {
    try {
      setRestoring(true);
      
      if (itemIds.length === 1) {
        const response = await itemAPI.restoreArchivedItem(itemIds[0]);
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Item restored successfully',
          });
        } else {
          throw new Error(response.message || 'Failed to restore item');
        }
      } else {
        const response = await itemAPI.bulkRestoreArchivedItems(itemIds);
        if (response.success) {
          toast({
            title: 'Success',
            description: `${itemIds.length} item(s) restored successfully`,
          });
        } else {
          throw new Error(response.message || 'Failed to restore items');
        }
      }
      
      setSelectedItems(new Set());
      fetchArchivedItems();
      onItemRestored?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to restore item(s)',
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
      setConfirmDialog({ open: false });
    }
  };

  const openConfirmDialog = (itemId?: string) => {
    const itemIds = itemId ? [itemId] : Array.from(selectedItems);
    if (itemIds.length === 0) return;
    
    setConfirmDialog({ open: true, itemId });
  };

  const confirmAction = () => {
    const itemIds = confirmDialog.itemId 
      ? [confirmDialog.itemId] 
      : Array.from(selectedItems);
    
    handleRestore(itemIds);
  };

  const formatArchivedDate = (archivedAt?: string) => {
    if (!archivedAt) return 'Unknown';
    try {
      return format(new Date(archivedAt), 'MMM dd, yyyy HH:mm');
    } catch {
      return archivedAt;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Archive</CardTitle>
              <Badge variant="secondary">{filteredItems.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search archived items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchArchivedItems}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No archived items found' : 'Archive is empty'}
              </p>
            </div>
          ) : (
            <>
              {selectedItems.size > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedItems.size} item(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfirmDialog()}
                      disabled={restoring}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore Selected
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedItems(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 border-b">
                  <Checkbox
                    checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm font-medium text-muted-foreground">Select All</span>
                </div>

                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{item.name || 'Unnamed Item'}</p>
                        <Badge variant="outline" className="text-xs">
                          Archived
                        </Badge>
                      </div>
                      {item.status && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Status: {item.status}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfirmDialog(item.id)}
                      disabled={restoring}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog({ open })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Restore Item(s)
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to restore {confirmDialog.itemId ? 'this item' : `${selectedItems.size} item(s)`}? 
              The item(s) will be moved back to the board.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={restoring}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {restoring ? 'Restoring...' : 'Restore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
