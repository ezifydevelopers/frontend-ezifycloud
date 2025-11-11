// Hook for checking column permissions

import { useState, useEffect } from 'react';
import { permissionAPI } from '@/lib/api';

interface ColumnPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  manage?: boolean;
}

interface UseColumnPermissionsReturn {
  permissions: ColumnPermissions | null;
  hasDeletePermission: boolean;
  loading: boolean;
  error: Error | null;
  checkPermission: (action: 'read' | 'write' | 'delete' | 'manage') => Promise<boolean>;
}

export const useColumnPermissions = (
  columnId: string | undefined,
  enabled: boolean = true
): UseColumnPermissionsReturn => {
  const [permissions, setPermissions] = useState<ColumnPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !columnId) {
      setPermissions(null);
      return;
    }

    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await permissionAPI.getPermissions('column', columnId);
        if (response.success && response.data) {
          setPermissions(response.data as ColumnPermissions);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch permissions'));
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [columnId, enabled]);

  const checkPermission = async (action: 'read' | 'write' | 'delete' | 'manage'): Promise<boolean> => {
    if (!columnId) return false;

    try {
      const response = await permissionAPI.checkPermission('column', columnId, action);
      if (response.success && response.data) {
        return response.data.hasPermission;
      }
      return false;
    } catch {
      return false;
    }
  };

  return {
    permissions,
    hasDeletePermission: permissions?.delete ?? false,
    loading,
    error,
    checkPermission,
  };
};

