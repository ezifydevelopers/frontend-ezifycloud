import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  User,
  Users,
  Save,
  RefreshCw,
} from 'lucide-react';
import { permissionAPI, workspaceAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { WorkspaceRole } from '@/types/workspace';

interface PermissionSet {
  read: boolean;
  write: boolean;
  delete: boolean;
  manage?: boolean;
}

interface PermissionManagementDialogProps {
  resource: 'board' | 'column';
  resourceId: string;
  resourceName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const PermissionManagementDialog: React.FC<PermissionManagementDialogProps> = ({
  resource,
  resourceId,
  resourceName,
  trigger,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<Array<{
    id: string;
    userId: string;
    role: WorkspaceRole;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  }>>([]);
  const [permissions, setPermissions] = useState<Record<string, PermissionSet>>({});

  useEffect(() => {
    if (open) {
      fetchMembers();
      fetchPermissions();
    }
  }, [open, resourceId]);

  const fetchMembers = async () => {
    try {
      // Get workspace members - need workspaceId from resource
      const response = await permissionAPI.getPermissions(resource === 'board' ? 'board' : 'column', resourceId);
      // For now, we'll need to get workspace members another way
      // This would require getting board/column workspace info first
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      // Permissions are stored in the resource itself (board.permissions or column.permissions)
      // We'll need to fetch the resource to get current permissions
      // For now, initialize empty
      setPermissions({});
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load permissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (
    userIdOrRole: string,
    permission: keyof PermissionSet,
    value: boolean
  ) => {
    setPermissions(prev => ({
      ...prev,
      [userIdOrRole]: {
        ...prev[userIdOrRole],
        [permission]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (resource === 'board') {
        await permissionAPI.updateBoardPermissions(resourceId, permissions);
      } else {
        const columnPermissions = Object.entries(permissions).reduce((acc, [key, perm]) => {
          return {
            read: { ...(typeof acc.read === 'object' ? acc.read : {}), [key]: perm.read },
            write: { ...(typeof acc.write === 'object' ? acc.write : {}), [key]: perm.write },
            delete: { ...(typeof acc.delete === 'object' ? acc.delete : {}), [key]: perm.delete },
          };
        }, {} as { read: Record<string, boolean>; write: Record<string, boolean>; delete: Record<string, boolean> });
        
        await permissionAPI.updateColumnPermissions(resourceId, columnPermissions);
      }

      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update permissions',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Manage Permissions
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions - {resourceName}
          </DialogTitle>
          <DialogDescription>
            Configure access permissions for {resource}. Permissions can be set per user or role.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Permission assignment section would go here */}
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Configure permissions for individual users or workspace roles.
              </div>
              {/* TODO: Add permission assignment UI */}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Permissions
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

