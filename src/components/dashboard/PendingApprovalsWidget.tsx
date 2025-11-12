import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Loader2,
  User as UserIcon,
  Mail,
  Building2,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api/adminAPI';
import { managerAPI } from '@/lib/api/managerAPI';
import { User } from '@/types/auth';

interface PendingApprovalsWidgetProps {
  userRole?: 'admin' | 'manager';
  maxItems?: number;
  showViewAll?: boolean;
}

interface PendingUser extends User {
  approvalStatus?: string;
}

const PendingApprovalsWidget: React.FC<PendingApprovalsWidgetProps> = ({
  userRole = 'admin',
  maxItems = 3,
  showViewAll = true
}) => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = userRole === 'admin' 
        ? await adminAPI.getPendingApprovals({ page: 1, limit: maxItems })
        : await managerAPI.getPendingUserApprovals({ page: 1, limit: maxItems });
      
      if (response.success && response.data) {
        // Both APIs now return PaginatedResponse format: { data: [], total, page, limit, totalPages }
        const users = (response.data as any).data || [];
        const totalCount = (response.data as any).total || 0;
        
        setPendingUsers(Array.isArray(users) ? users.slice(0, maxItems) : []);
        setTotal(totalCount);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      setProcessing(userId);
      const response = userRole === 'admin'
        ? await adminAPI.approveUserAccess(userId)
        : await managerAPI.approveUserAccess(userId);
      
      if (response.success) {
        toast({
          title: 'User Approved',
          description: 'User access has been approved successfully.',
        });
        fetchPendingApprovals();
      } else {
        throw new Error(response.message || 'Failed to approve user');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve user',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      setProcessing(userId);
      const response = userRole === 'admin'
        ? await adminAPI.rejectUserAccess(userId, 'Rejected from dashboard')
        : await managerAPI.rejectUserAccess(userId, 'Rejected from dashboard');
      
      if (response.success) {
        toast({
          title: 'User Rejected',
          description: 'User access has been rejected.',
        });
        fetchPendingApprovals();
      } else {
        throw new Error(response.message || 'Failed to reject user');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject user',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const viewAllPath = userRole === 'admin' 
    ? '/admin/user-approvals' 
    : '/manager/user-approvals';

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            Pending User Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Pending User Approvals</CardTitle>
              <CardDescription className="mt-1">
                {total > 0 ? `${total} user${total !== 1 ? 's' : ''} awaiting approval` : 'No pending approvals'}
              </CardDescription>
            </div>
          </div>
          {total > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
              {total}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-6">
            <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">All Caught Up!</p>
            <p className="text-xs text-muted-foreground">No pending user approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gradient-to-r from-white to-gray-50/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 border-2 border-blue-100 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                      {getInitials(user.name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getRoleBadgeColor(user.role)} text-xs border`}>
                        {user.role}
                      </Badge>
                      {user.department && (
                        <>
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500 truncate">{user.department}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(user.id)}
                    disabled={processing === user.id}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white h-8 px-3"
                  >
                    {processing === user.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(user.id)}
                    disabled={processing === user.id}
                    className="h-8 px-3"
                  >
                    {processing === user.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            
            {showViewAll && total > maxItems && (
              <div className="pt-2 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => navigate(viewAllPath)}
                >
                  View All {total} Pending Approvals
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingApprovalsWidget;

