// Column-level permissions settings component

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { Column } from '@/types/workspace';
import { PermissionManagementDialog } from '@/components/permissions/PermissionManagementDialog';

interface ColumnPermissionsSettingsProps {
  column: Column | null;
  onSuccess?: () => void;
}

export const ColumnPermissionsSettings: React.FC<ColumnPermissionsSettingsProps> = ({
  column,
  onSuccess,
}) => {
  if (!column) {
    return (
      <div className="space-y-2">
        <Label>Column Permissions</Label>
        <p className="text-sm text-muted-foreground">
          Permissions can be configured after the column is created.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Column Permissions</Label>
      <div className="flex items-center justify-between p-3 border rounded-md">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Manage Access Control</p>
            <p className="text-xs text-muted-foreground">
              Control who can read, write, or delete data in this column
            </p>
          </div>
        </div>
        <PermissionManagementDialog
          resource="column"
          resourceId={column.id}
          resourceName={column.name}
          trigger={
            <Button
              type="button"
              variant="outline"
              size="sm"
            >
              Configure Permissions
            </Button>
          }
          onSuccess={onSuccess}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Column-level permissions override board-level permissions for this specific column.
      </p>
    </div>
  );
};
