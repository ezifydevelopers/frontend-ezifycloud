import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  User, 
  Calendar, 
  Activity,
  Globe,
  Monitor,
  FileText
} from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetId?: string;
  targetType?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLogDetailsProps {
  log: AuditLog;
  onClose: () => void;
}

const AuditLogDetails: React.FC<AuditLogDetailsProps> = ({ log, onClose }) => {
  const getActionBadge = (action: string) => {
    const actionColors: { [key: string]: string } = {
      'LOGIN': 'bg-green-100 text-green-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
      'CREATE_LEAVE_REQUEST': 'bg-blue-100 text-blue-800',
      'APPROVE_LEAVE_REQUEST': 'bg-green-100 text-green-800',
      'REJECT_LEAVE_REQUEST': 'bg-red-100 text-red-800',
      'UPDATE_USER': 'bg-yellow-100 text-yellow-800',
      'DELETE_USER': 'bg-red-100 text-red-800',
    };
    
    const colorClass = actionColors[action] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={colorClass}>
        {action.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Log Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about this system activity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User Name</p>
                <p className="font-medium">{log.userName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="font-mono text-sm">{log.userId}</p>
              </div>
            </div>
          </div>

          {/* Action Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Action Details
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Action</p>
                <div className="mt-1">{getActionBadge(log.action)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                <p className="text-sm">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </div>
            {log.details && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Details</p>
                <p className="text-sm p-3 bg-muted/50 rounded-lg">{log.details}</p>
              </div>
            )}
          </div>

          {/* Target Information */}
          {log.targetType && log.targetId && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Target Information</h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target Type</p>
                  <p className="font-medium">{log.targetType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target ID</p>
                  <p className="font-mono text-sm">{log.targetId}</p>
                </div>
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Technical Details
            </h3>
            <div className="space-y-4">
              {log.ipAddress && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">IP Address</p>
                  <p className="font-mono text-sm">{log.ipAddress}</p>
                </div>
              )}
              {log.userAgent && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">User Agent</p>
                  <p className="text-sm break-all">{log.userAgent}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogDetails;
