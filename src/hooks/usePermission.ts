import { useState, useEffect, useCallback } from 'react';
import { permissionAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type ResourceType = 'workspace' | 'board' | 'item' | 'column' | 'cell';
type ActionType = 'read' | 'write' | 'delete' | 'manage';

interface PermissionResult {
  read: boolean;
  write: boolean;
  delete: boolean;
  manage?: boolean;
  loading: boolean;
  error: Error | null;
}

interface UsePermissionOptions {
  resource: ResourceType;
  resourceId: string | null | undefined;
  enabled?: boolean;
}

/**
 * Hook to check permissions for a resource
 */
export const usePermission = (options: UsePermissionOptions): PermissionResult => {
  const { resource, resourceId, enabled = true } = options;
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Omit<PermissionResult, 'loading' | 'error'>>({
    read: false,
    write: false,
    delete: false,
    manage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !resourceId || !user) {
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Only support workspace, board, item, column for now (cell uses different endpoint)
        if (resource === 'cell') {
          // For cells, we'll check column permissions
          setPermissions({ read: false, write: false, delete: false, manage: false });
          setLoading(false);
          return;
        }

        const response = await permissionAPI.getPermissions(
          resource as 'workspace' | 'board' | 'item' | 'column',
          resourceId
        );

        if (response.success && response.data) {
          setPermissions(response.data);
        } else {
          setError(new Error(response.message || 'Failed to fetch permissions'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch permissions'));
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [resource, resourceId, enabled, user]);

  return {
    ...permissions,
    loading,
    error,
  };
};

/**
 * Hook to check a specific permission
 */
export const useCan = (
  resource: ResourceType,
  resourceId: string | null | undefined,
  action: ActionType,
  enabled = true
): boolean => {
  const permissions = usePermission({ resource, resourceId, enabled });
  
  if (permissions.loading || !enabled || !resourceId) {
    return false;
  }

  return permissions[action] ?? false;
};

/**
 * Convenience hooks for common permission checks
 */
export const useCanRead = (resource: ResourceType, resourceId: string | null | undefined) => 
  useCan(resource, resourceId, 'read');

export const useCanWrite = (resource: ResourceType, resourceId: string | null | undefined) => 
  useCan(resource, resourceId, 'write');

export const useCanDelete = (resource: ResourceType, resourceId: string | null | undefined) => 
  useCan(resource, resourceId, 'delete');

export const useCanManage = (resource: ResourceType, resourceId: string | null | undefined) => 
  useCan(resource, resourceId, 'manage');

/**
 * Hook to check permission with callback
 */
export const useCheckPermission = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const check = useCallback(async (
    resource: ResourceType,
    resourceId: string,
    action: ActionType
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);
      
      if (resource === 'cell') {
        // Cell permissions need special handling
        return false;
      }

      const response = await permissionAPI.checkPermission(
        resource as 'workspace' | 'board' | 'item' | 'column',
        resourceId,
        action
      );

      return response.success && response.data?.hasPermission === true;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { check, loading };
};

