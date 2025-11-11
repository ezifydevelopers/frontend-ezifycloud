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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { itemAPI } from '@/lib/api';
import { Item } from '@/types/workspace';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: Item[];
  workspaceMembers?: Array<{ id: string; name: string; email: string }>;
  onSuccess?: () => void;
}

export const BulkAssignDialog: React.FC<BulkAssignDialogProps> = ({
  open,
  onOpenChange,
  selectedItems,
  workspaceMembers = [],
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assignMode, setAssignMode] = useState<'assign' | 'unassign'>('assign');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setSelectedUserIds(new Set());
      setAssignMode('assign');
    }
  }, [open]);

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUserIds.size === workspaceMembers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(workspaceMembers.map(m => m.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedUserIds.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one user',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const userIds = Array.from(selectedUserIds);
      
      // Update all selected items
      const updatePromises = selectedItems.map(item => {
        if (assignMode === 'assign') {
          // Add users to assignment (merge with existing)
          const currentAssignees = item.assignedTo || [];
          const newAssignees = [...new Set([...currentAssignees, ...userIds])];
          return itemAPI.updateItem(item.id, {
            assignedTo: newAssignees,
          });
        } else {
          // Remove users from assignment
          const currentAssignees = item.assignedTo || [];
          const newAssignees = currentAssignees.filter(id => !userIds.includes(id));
          return itemAPI.updateItem(item.id, {
            assignedTo: newAssignees,
          });
        }
      });

      await Promise.all(updatePromises);

      toast({
        title: 'Success',
        description: `${assignMode === 'assign' ? 'Assigned' : 'Unassigned'} ${selectedUserIds.size} user(s) to ${selectedItems.length} item(s)`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update assignments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Assign/Unassign</DialogTitle>
          <DialogDescription>
            {assignMode === 'assign' ? 'Assign' : 'Unassign'} users to {selectedItems.length} selected item(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Action</Label>
            <div className="flex gap-2">
              <Button
                variant={assignMode === 'assign' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAssignMode('assign')}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign
              </Button>
              <Button
                variant={assignMode === 'unassign' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAssignMode('unassign')}
                className="flex-1"
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Unassign
              </Button>
            </div>
          </div>

          {workspaceMembers.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Users</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                >
                  {selectedUserIds.size === workspaceMembers.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="border rounded-lg p-2 max-h-60 overflow-y-auto space-y-2">
                {workspaceMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded"
                  >
                    <Checkbox
                      id={member.id}
                      checked={selectedUserIds.has(member.id)}
                      onCheckedChange={() => handleUserToggle(member.id)}
                    />
                    <Label
                      htmlFor={member.id}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      <div>
                        <div className="font-medium">{member.name}</div>
                        {member.email && (
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              No workspace members available
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || selectedUserIds.size === 0}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {assignMode === 'assign' ? 'Assign' : 'Unassign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

