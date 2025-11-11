import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api/adminAPI';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User as UserIcon, 
  Mail, 
  Building2,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PendingUser extends User {
  approvalStatus?: string;
}

const UserApprovalsPage: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getPendingApprovals({ page, limit: 10 });
      
      if (response.success && response.data) {
        setPendingUsers(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.message || 'Failed to fetch pending approvals');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, [page]);

  const handleApprove = async (userId: string) => {
    try {
      setProcessing(userId);
      const response = await adminAPI.approveUserAccess(userId);
      
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

  const handleReject = async () => {
    if (!selectedUser) return;

    try {
      setProcessing(selectedUser.id);
      const response = await adminAPI.rejectUserAccess(selectedUser.id, rejectionReason);
      
      if (response.success) {
        toast({
          title: 'User Rejected',
          description: 'User access has been rejected.',
        });
        setRejectDialogOpen(false);
        setSelectedUser(null);
        setRejectionReason('');
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

  const openRejectDialog = (user: PendingUser) => {
    setSelectedUser(user);
    setRejectDialogOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && pendingUsers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Approvals</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve pending user registrations
          </p>
        </div>
        <Button onClick={fetchPendingApprovals} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {pendingUsers.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
            <p className="text-muted-foreground text-center">
              All user registrations have been processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pending User Approvals</CardTitle>
            <CardDescription>
              {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} waiting for approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {user.department || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {user.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(user.id)}
                          disabled={processing === user.id}
                        >
                          {processing === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(user)}
                          disabled={processing === user.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject access for {selectedUser?.name}? 
              You can provide a reason below (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setSelectedUser(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing === selectedUser?.id}
            >
              {processing === selectedUser?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Access
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserApprovalsPage;

