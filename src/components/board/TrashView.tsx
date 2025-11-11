// Trash View - Display and manage deleted items

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  RefreshCw,
  RotateCcw,
  Search,
  Trash,
  AlertTriangle,
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

interface TrashViewProps {
  boardId: string;
  onItemRestored?: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({
  boardId,
  onItemRestored,
}) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'restore' | 'delete' | null;
    itemId?: string;
  }>({ open: false, type: null });

  const fetchDeletedItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await itemAPI.getDeletedItems(boardId, {
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
      console.error('Error fetching deleted items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch deleted items',
        variant: 'destructive',
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [boardId, toast]);

  useEffect(() => {
    fetchDeletedItems();
  }, [fetchDeletedItems]);

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
        const response = await itemAPI.restoreItem(itemIds[0]);
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Item restored successfully',
          });
        } else {
          throw new Error(response.message || 'Failed to restore item');
        }
      } else {
        const response = await itemAPI.bulkRestoreItems(itemIds);
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
      fetchDeletedItems();
      onItemRestored?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to restore item(s)',
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
      setConfirmDialog({ open: false, type: null });
    }
  };

  const handlePermanentDelete = async (itemIds: string[]) => {
    try {
      setDeleting(true);
      
      if (itemIds.length === 1) {
        const response = await itemAPI.permanentlyDeleteItem(itemIds[0]);
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Item permanently deleted',
          });
        } else {
          throw new Error(response.message || 'Failed to delete item');
        }
      } else {
        const response = await itemAPI.bulkPermanentlyDeleteItems(itemIds);
        if (response.success) {
          toast({
            title: 'Success',
            description: `${itemIds.length} item(s) permanently deleted`,
          });
        } else {
          throw new Error(response.message || 'Failed to delete items');
        }
      }
      
      setSelectedItems(new Set());
      fetchDeletedItems();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete item(s)',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setConfirmDialog({ open: false, type: null });
    }
  };

  const openConfirmDialog = (type: 'restore' | 'delete', itemId?: string) => {
    const itemIds = itemId ? [itemId] : Array.from(selectedItems);
    if (itemIds.length === 0) return;
    
    setConfirmDialog({ open: true, type, itemId });
  };

  const confirmAction = () => {
    const itemIds = confirmDialog.itemId 
      ? [confirmDialog.itemId] 
      : Array.from(selectedItems);
    
    if (confirmDialog.type === 'restore') {
      handleRestore(itemIds);
    } else if (confirmDialog.type === 'delete') {
      handlePermanentDelete(itemIds);
    }
  };

  const formatDeletedDate = (deletedAt?: string) => {
    if (!deletedAt) return 'Unknown';
    try {
      return format(new Date(deletedAt), 'MMM dd, yyyy HH:mm');
    } catch {
      return deletedAt;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Trash</CardTitle>
              <Badge variant="secondary">{filteredItems.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deleted items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDeletedItems}
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
              <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No deleted items found' : 'Trash is empty'}
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
                      onClick={() => openConfirmDialog('restore')}
                      disabled={restoring}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore Selected
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openConfirmDialog('delete')}
                      disabled={deleting}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete Permanently
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
                        {item.deletedAt && (
                          <Badge variant="outline" className="text-xs">
                            Deleted {formatDeletedDate(item.deletedAt)}
                          </Badge>
                        )}
                      </div>
                      {item.status && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Status: {item.status}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfirmDialog('restore', item.id)}
                        disabled={restoring}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openConfirmDialog('delete', item.id)}
                        disabled={deleting}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog({ open, type: null })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.type === 'restore' ? (
                <>
                  <RotateCcw className="h-5 w-5" />
                  Restore Item(s)
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Permanently Delete Item(s)
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'restore' ? (
                `Are you sure you want to restore ${confirmDialog.itemId ? 'this item' : `${selectedItems.size} item(s)`}? The item(s) will be moved back to the board.`
              ) : (
                `Are you sure you want to permanently delete ${confirmDialog.itemId ? 'this item' : `${selectedItems.size} item(s)`}? This action cannot be undone.`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, type: null })}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
              onClick={confirmAction}
              disabled={restoring || deleting}
            >
              {confirmDialog.type === 'restore' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {restoring ? 'Restoring...' : 'Restore'}
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
