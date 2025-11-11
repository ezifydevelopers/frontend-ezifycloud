import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { itemAPI } from '@/lib/api';
import { Item } from '@/types/workspace';
import { Loader2 } from 'lucide-react';

interface BulkStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: Item[];
  currentStatus?: string;
  onSuccess?: () => void;
}

export const BulkStatusDialog: React.FC<BulkStatusDialogProps> = ({
  open,
  onOpenChange,
  selectedItems,
  currentStatus,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<string>(currentStatus || '');

  // Get unique statuses from selected items
  const statuses = React.useMemo(() => {
    const statusSet = new Set<string>();
    selectedItems.forEach(item => {
      if (item.status) {
        statusSet.add(item.status);
      }
    });
    return Array.from(statusSet);
  }, [selectedItems]);

  const handleSubmit = async () => {
    if (!newStatus) {
      toast({
        title: 'Error',
        description: 'Please select a status',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Update all selected items
      const updatePromises = selectedItems.map(item =>
        itemAPI.updateItem(item.id, {
          status: newStatus,
        })
      );

      await Promise.all(updatePromises);

      toast({
        title: 'Success',
        description: `Updated status for ${selectedItems.length} item(s)`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
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
          <DialogTitle>Bulk Status Change</DialogTitle>
          <DialogDescription>
            Change the status of {selectedItems.length} selected item(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.length > 0 && (
                  <>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                    <div className="border-t my-1" />
                  </>
                )}
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {statuses.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p>Current statuses: {statuses.join(', ')}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !newStatus}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

