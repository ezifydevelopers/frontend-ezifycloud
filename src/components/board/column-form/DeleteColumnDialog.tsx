// Delete Column Dialog with permission check, confirmation, and metadata option

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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, Database, ShieldX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { boardAPI } from '@/lib/api';
import { Column } from '@/types/workspace';
import { useColumnPermissions } from './hooks/useColumnPermissions';

interface DeleteColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: Column | null;
  onSuccess?: () => void;
}

export const DeleteColumnDialog: React.FC<DeleteColumnDialogProps> = ({
  open,
  onOpenChange,
  column,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [keepDataAsMetadata, setKeepDataAsMetadata] = useState(false);
  const [itemCount, setItemCount] = useState<number>(0);

  const {
    hasDeletePermission,
    loading: permissionsLoading,
    checkPermission,
  } = useColumnPermissions(column?.id, open);

  // Fetch item count for this column
  useEffect(() => {
    if (!open || !column) return;

    const fetchItemCount = async () => {
      // In a real implementation, you'd fetch the actual count from the API
      // For now, we'll use a placeholder - this should be replaced with actual API call
      setItemCount((column as any)?._count?.items ?? 0);
    };

    fetchItemCount();
  }, [open, column]);

  // Check permission when dialog opens
  useEffect(() => {
    if (open && column) {
      checkPermission('delete');
    }
  }, [open, column, checkPermission]);

  const handleDelete = async () => {
    if (!column) return;

    // Double-check permission
    const canDelete = await checkPermission('delete');
    if (!canDelete) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to delete this column.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const response = await boardAPI.deleteColumn(column.id, keepDataAsMetadata ? { keepDataAsMetadata: true } : undefined);

      if (response.success) {
        toast({
          title: 'Success',
          description: keepDataAsMetadata
            ? 'Column deleted. Data has been preserved as metadata.'
            : 'Column deleted successfully',
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(response.message || 'Failed to delete column');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete column',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!column) return null;

  if (permissionsLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!hasDeletePermission) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-50">
                <ShieldX className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle>Permission Denied</DialogTitle>
            </div>
            <DialogDescription className="mt-2">
              You do not have permission to delete this column. Please contact your administrator.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-50">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              Delete Column
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 mt-2">
            Are you sure you want to delete the column <strong>&quot;{column.name}&quot;</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Data Loss Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-yellow-800">
                  Warning: This action cannot be undone
                </p>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>
                    • Deleting this column will remove all data stored in this column
                  </p>
                  {itemCount > 0 && (
                    <p>
                      • This will affect <strong>{itemCount}</strong> item{itemCount !== 1 ? 's' : ''} with data in this column
                    </p>
                  )}
                  <p>
                    • Items will remain, but this column&apos;s data will be permanently lost
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Keep Data as Metadata Option */}
          <div className="space-y-2">
            <div className="flex items-start space-x-3 p-3 border rounded-md hover:bg-slate-50">
              <Checkbox
                id="keepMetadata"
                checked={keepDataAsMetadata}
                onCheckedChange={(checked) => setKeepDataAsMetadata(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="keepMetadata"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <Database className="h-4 w-4 text-blue-600" />
                  Keep data as metadata
                </Label>
                <p className="text-xs text-muted-foreground">
                  If enabled, column data will be preserved in item metadata. This allows you to
                  restore the column or access the data later, but it will not be visible in views.
                  Recommended if you want to keep the data for historical records or potential restoration.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Column Type:</strong> {column.type}
            </p>
            {column.required && (
              <p className="text-amber-600">
                <strong>Note:</strong> This is a required column. Deleting it may affect item validation.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setKeepDataAsMetadata(false);
            }}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            variant="destructive"
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </div>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {keepDataAsMetadata ? 'Delete & Preserve Data' : 'Delete Column'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

