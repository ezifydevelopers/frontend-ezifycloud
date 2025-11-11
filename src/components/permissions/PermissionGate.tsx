import React from 'react';
import { useCan } from '@/hooks/usePermission';

type ResourceType = 'workspace' | 'board' | 'item' | 'column' | 'cell';
type ActionType = 'read' | 'write' | 'delete' | 'manage';

interface PermissionGateProps {
  resource: ResourceType;
  resourceId: string | null | undefined;
  action: ActionType;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  enabled?: boolean;
}

/**
 * Component that renders children only if user has the required permission
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  resource,
  resourceId,
  action,
  fallback = null,
  children,
  enabled = true,
}) => {
  const hasPermission = useCan(resource, resourceId, action, enabled);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Convenience components for common permission checks
 */
export const CanRead: React.FC<Omit<PermissionGateProps, 'action'>> = (props) => (
  <PermissionGate {...props} action="read" />
);

export const CanWrite: React.FC<Omit<PermissionGateProps, 'action'>> = (props) => (
  <PermissionGate {...props} action="write" />
);

export const CanDelete: React.FC<Omit<PermissionGateProps, 'action'>> = (props) => (
  <PermissionGate {...props} action="delete" />
);

export const CanManage: React.FC<Omit<PermissionGateProps, 'action'>> = (props) => (
  <PermissionGate {...props} action="manage" />
);

