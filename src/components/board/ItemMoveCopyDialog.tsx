// Move/Copy Item Dialog - Move or copy items to another board

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { itemAPI, boardAPI, workspaceAPI } from '@/lib/api';
import { Item, Board, Workspace } from '@/types/workspace';
import { ArrowRight, Copy, Move } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ItemMoveCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  currentBoardId: string;
  currentWorkspaceId?: string;
  mode: 'move' | 'copy';
  onSuccess?: () => void;
}

export const ItemMoveCopyDialog: React.FC<ItemMoveCopyDialogProps> = ({
  open,
  onOpenChange,
  items,
  currentBoardId,
  currentWorkspaceId,
  mode,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [loadingBoards, setLoadingBoards] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoadingWorkspaces(true);
      const response = await workspaceAPI.getUserWorkspaces();
      if (response.success && response.data) {
        const responseData = response.data as { data?: unknown[] } | unknown[];
        const workspacesData = Array.isArray(responseData)
          ? responseData
          : (responseData as { data?: unknown[] })?.data || [];
        setWorkspaces(workspacesData as Workspace[]);
        
        // Pre-select current workspace if provided
        if (currentWorkspaceId) {
          setSelectedWorkspaceId(currentWorkspaceId);
        } else if (workspacesData.length > 0) {
          setSelectedWorkspaceId((workspacesData[0] as Workspace).id);
        }
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workspaces',
        variant: 'destructive',
      });
    } finally {
      setLoadingWorkspaces(false);
    }
  }, [currentWorkspaceId, toast]);

  const fetchBoards = useCallback(async (workspaceId: string) => {
    if (!workspaceId) return;
    
    try {
      setLoadingBoards(true);
      const response = await boardAPI.getWorkspaceBoards(workspaceId);
      if (response.success && response.data) {
        const responseData = response.data as any;
        const boardsData = Array.isArray(responseData)
          ? responseData
          : responseData.data || [];
        // Filter out current board and archived boards
        const filteredBoards = (boardsData as Board[]).filter(
          board => board.id !== currentBoardId && !board.isArchived
        );
        setBoards(filteredBoards);
        
        // Clear selection if no boards available
        if (filteredBoards.length === 0) {
          setSelectedBoardId('');
        }
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load boards',
        variant: 'destructive',
      });
    } finally {
      setLoadingBoards(false);
    }
  }, [currentBoardId, toast]);

  useEffect(() => {
    if (open) {
      fetchWorkspaces();
      setSelectedBoardId('');
    }
  }, [open, fetchWorkspaces]);

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchBoards(selectedWorkspaceId);
    } else {
      setBoards([]);
      setSelectedBoardId('');
    }
  }, [selectedWorkspaceId, fetchBoards]);

  const handleSubmit = async () => {
    if (!selectedBoardId) {
      toast({
        title: 'Error',
        description: 'Please select a target board',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const itemIds = items.map(item => item.id);

      if (mode === 'move') {
        if (itemIds.length === 1) {
          const response = await itemAPI.moveItem(itemIds[0], selectedBoardId);
          if (response.success) {
            toast({
              title: 'Success',
              description: 'Item moved successfully',
            });
          } else {
            throw new Error(response.message || 'Failed to move item');
          }
        } else {
          const response = await itemAPI.bulkMoveItems(itemIds, selectedBoardId);
          if (response.success) {
            toast({
              title: 'Success',
              description: `${itemIds.length} item(s) moved successfully`,
            });
          } else {
            throw new Error(response.message || 'Failed to move items');
          }
        }
      } else {
        // Copy mode
        if (itemIds.length === 1) {
          const response = await itemAPI.copyItem(itemIds[0], selectedBoardId);
          if (response.success) {
            toast({
              title: 'Success',
              description: 'Item copied successfully',
            });
          } else {
            throw new Error(response.message || 'Failed to copy item');
          }
        } else {
          const response = await itemAPI.bulkCopyItems(itemIds, selectedBoardId);
          if (response.success) {
            toast({
              title: 'Success',
              description: `${itemIds.length} item(s) copied successfully`,
            });
          } else {
            throw new Error(response.message || 'Failed to copy items');
          }
        }
      }

      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setSelectedWorkspaceId(currentWorkspaceId || '');
      setSelectedBoardId('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${mode} item(s)`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedBoard = boards.find(b => b.id === selectedBoardId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'move' ? (
              <>
                <Move className="h-5 w-5" />
                Move Item{items.length > 1 ? 's' : ''}
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" />
                Copy Item{items.length > 1 ? 's' : ''}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'move' 
              ? `Move ${items.length} item(s) to another board. This will remove them from the current board.`
              : `Copy ${items.length} item(s) to another board. The original items will remain in this board.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Items Preview */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <Label className="text-sm font-medium mb-2 block">Items to {mode}:</Label>
            <ScrollArea className="max-h-32">
              <div className="flex flex-wrap gap-1">
                {items.slice(0, 10).map(item => (
                  <Badge key={item.id} variant="secondary" className="text-xs">
                    {item.name}
                  </Badge>
                ))}
                {items.length > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    +{items.length - 10} more
                  </Badge>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Workspace Selection */}
          <div className="space-y-2">
            <Label htmlFor="workspace">Select Workspace</Label>
            <Select
              value={selectedWorkspaceId}
              onValueChange={setSelectedWorkspaceId}
              disabled={loadingWorkspaces}
            >
              <SelectTrigger id="workspace">
                <SelectValue placeholder="Select workspace..." />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map(workspace => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Board Selection */}
          <div className="space-y-2">
            <Label htmlFor="board">Select Target Board</Label>
            <Select
              value={selectedBoardId}
              onValueChange={setSelectedBoardId}
              disabled={loadingBoards || !selectedWorkspaceId || boards.length === 0}
            >
              <SelectTrigger id="board">
                <SelectValue placeholder={boards.length === 0 ? "No boards available" : "Select board..."} />
              </SelectTrigger>
              <SelectContent>
                {boards.map(board => (
                  <SelectItem key={board.id} value={board.id}>
                    <div className="flex items-center gap-2">
                      {board.icon && <span>{board.icon}</span>}
                      <span>{board.name}</span>
                      {board.description && (
                        <span className="text-xs text-muted-foreground">
                          - {board.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {boards.length === 0 && selectedWorkspaceId && (
              <p className="text-sm text-muted-foreground">
                No available boards in this workspace (excluding archived and current board)
              </p>
            )}
          </div>

          {/* Target Board Info */}
          {selectedBoard && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Target: {selectedBoard.name}
                  </p>
                  {selectedBoard.description && (
                    <p className="text-xs text-blue-700 mt-1">
                      {selectedBoard.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedBoardId}
          >
            {loading ? (
              mode === 'move' ? 'Moving...' : 'Copying...'
            ) : (
              <>
                {mode === 'move' ? (
                  <>
                    <Move className="h-4 w-4 mr-2" />
                    Move {items.length} Item{items.length > 1 ? 's' : ''}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy {items.length} Item{items.length > 1 ? 's' : ''}
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
