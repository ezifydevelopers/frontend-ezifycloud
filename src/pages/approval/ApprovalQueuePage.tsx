import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import PageHeader from '@/components/layout/PageHeader';
import { useParams } from 'react-router-dom';
import { approvalAPI } from '@/lib/api';
import { ApprovalLevel, ApprovalStatus } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  ArrowRight,
  Eye,
  Edit,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Approval {
  id: string;
  itemId: string;
  level: ApprovalLevel;
  status: ApprovalStatus;
  comments?: string;
  approverId?: string;
  approvedAt?: string;
  createdAt: string;
  item?: {
    id: string;
    name: string;
    boardId?: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
}

const LEVEL_LABELS: Record<ApprovalLevel, string> = {
  LEVEL_1: 'Level 1',
  LEVEL_2: 'Level 2',
  LEVEL_3: 'Level 3',
};

const LEVEL_COLORS: Record<ApprovalLevel, string> = {
  LEVEL_1: 'bg-blue-100 text-blue-800',
  LEVEL_2: 'bg-purple-100 text-purple-800',
  LEVEL_3: 'bg-green-100 text-green-800',
};

const ApprovalQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<ApprovalLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionDialog, setActionDialog] = useState<{
    approval: Approval;
    action: 'approve' | 'reject' | 'request_changes';
  } | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await approvalAPI.getMyPendingApprovals();
      if (response.success && response.data) {
        const approvalsData = (response.data as Approval[]) || [];
        setApprovals(approvalsData);
      } else {
        setApprovals([]);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load approvals',
        variant: 'destructive',
      });
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApprove = async () => {
    if (!actionDialog) return;

    try {
      setProcessing(true);
      const response = await approvalAPI.updateApproval(actionDialog.approval.id, {
        status: 'approved',
        comments: comment || undefined,
        approverId: user?.id,
      });

      if (response.success) {
        const isLastLevel = actionDialog.approval.level === 'LEVEL_3';
        toast({
          title: 'Success',
          description: isLastLevel
            ? 'Approval complete! All levels approved. The item creator has been notified.'
            : 'Approved successfully. Moving to next approval level...',
        });
        setActionDialog(null);
        setComment('');
        // Delay to allow backend to create next level
        setTimeout(() => {
          fetchApprovals();
        }, 500);
      } else {
        throw new Error(response.message || 'Failed to approve');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!actionDialog || !comment.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);
      const response = await approvalAPI.updateApproval(actionDialog.approval.id, {
        status: 'rejected',
        comments: comment,
        approverId: user?.id,
      });

      if (response.success) {
        toast({
          title: 'Rejected',
          description: 'Item rejected. The item creator has been notified with your reason.',
        });
        setActionDialog(null);
        setComment('');
        fetchApprovals();
      } else {
        throw new Error(response.message || 'Failed to reject');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!actionDialog || !comment.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please describe the changes needed',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);
      // Reject with comment indicating changes needed
      const rejectResponse = await approvalAPI.updateApproval(actionDialog.approval.id, {
        status: 'rejected',
        comments: `Changes requested: ${comment}`,
        approverId: user?.id,
      });

      if (rejectResponse.success) {
        toast({
          title: 'Changes Requested',
          description: `Feedback sent to creator. They can edit the item and resubmit for ${actionDialog.approval.level === 'LEVEL_1' ? 'Level 1' : actionDialog.approval.level === 'LEVEL_2' ? 'Level 2' : 'Level 3'} approval.`,
        });
        setActionDialog(null);
        setComment('');
        fetchApprovals();
      } else {
        throw new Error(rejectResponse.message || 'Failed to request changes');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to request changes',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredApprovals = approvals.filter((approval) => {
    const matchesLevel = filterLevel === 'all' || approval.level === filterLevel;
    const matchesStatus = filterStatus === 'all' || approval.status === filterStatus;
    const matchesSearch =
      !searchTerm ||
      approval.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesLevel && matchesStatus && matchesSearch;
  });

  const groupedByLevel = filteredApprovals.reduce((acc, approval) => {
    if (!acc[approval.level]) {
      acc[approval.level] = [];
    }
    acc[approval.level].push(approval);
    return acc;
  }, {} as Record<ApprovalLevel, Approval[]>);

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Approval Queue"
          subtitle="Manage pending approvals for items"
          icon={CheckCircle2}
          iconColor="from-blue-600 to-purple-600"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Try to get workspaceId from URL or navigate to a default workspace
                const workspaceId = window.location.pathname.match(/workspaces\/([^/]+)/)?.[1];
                if (workspaceId) {
                  navigate(`/workspaces/${workspaceId}/approved-items`);
                } else {
                  navigate('/workspaces');
                }
              }}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Approved Items
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back
            </Button>
          </div>
        </PageHeader>

        <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl mt-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle>Pending Approvals ({filteredApprovals.length})</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>
                <Select value={filterLevel} onValueChange={(value) => setFilterLevel(value as ApprovalLevel | 'all')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="LEVEL_1">Level 1</SelectItem>
                    <SelectItem value="LEVEL_2">Level 2</SelectItem>
                    <SelectItem value="LEVEL_3">Level 3</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as ApprovalStatus | 'all')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetchApprovals}>
                  <Filter className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredApprovals.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No approvals found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByLevel).map(([level, levelApprovals]) => (
                  <div key={level} className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={LEVEL_COLORS[level as ApprovalLevel]}>
                        {LEVEL_LABELS[level as ApprovalLevel]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {levelApprovals.length} approval{levelApprovals.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {levelApprovals.map((approval) => (
                          <TableRow key={approval.id}>
                            <TableCell className="font-medium">
                              {approval.item?.name || 'Unknown Item'}
                            </TableCell>
                            <TableCell>{getStatusBadge(approval.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {approval.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setActionDialog({ approval, action: 'approve' });
                                        setComment('');
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setActionDialog({ approval, action: 'request_changes' });
                                        setComment('');
                                      }}
                                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      Request Changes
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setActionDialog({ approval, action: 'reject' });
                                        setComment('');
                                      }}
                                    >
                                      <XCircle className="h-4 w-4 mr-1 text-red-600" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (approval.item?.boardId) {
                                      navigate(`/workspaces/board/${approval.item.boardId}/item/${approval.itemId}`);
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={!!actionDialog}
          onOpenChange={(open) => {
            if (!open) {
              setActionDialog(null);
              setComment('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog?.action === 'approve' 
                  ? 'Approve Item' 
                  : actionDialog?.action === 'request_changes'
                  ? 'Request Changes'
                  : 'Reject Item'}
              </DialogTitle>
              <DialogDescription>
                <div className="mb-2">
                  {actionDialog?.approval.item?.name}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {LEVEL_LABELS[actionDialog?.approval.level || 'LEVEL_1']}
                  </span>
                </div>
                <div className="text-xs mt-2">
                  {actionDialog?.action === 'approve' 
                    ? 'Are you sure you want to approve this item? You can add optional comments. The item will automatically move to the next approval level if needed, and the creator will be notified.'
                    : actionDialog?.action === 'request_changes'
                    ? 'Request specific changes to this item. Describe what needs to be updated. The item will be returned to the creator for modifications, and they can edit and resubmit it for the same approval level after making the changes.'
                    : 'Are you sure you want to reject this item? A rejection reason is required. The item creator will be notified and the approval process will stop. Use "Request Changes" if you want them to make edits and resubmit.'}
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comment">
                  {actionDialog?.action === 'reject' 
                    ? 'Rejection Reason' 
                    : actionDialog?.action === 'request_changes'
                    ? 'Feedback / Changes Needed'
                    : 'Comments'} 
                  {(actionDialog?.action === 'reject' || actionDialog?.action === 'request_changes') && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                {actionDialog?.action === 'request_changes' && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Provide specific feedback on what needs to be changed. The creator will see this and can edit the item before resubmitting.
                  </p>
                )}
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    actionDialog?.action === 'reject'
                      ? 'Please provide a reason for rejection...'
                      : actionDialog?.action === 'request_changes'
                      ? 'Describe what changes are needed...'
                      : 'Add optional comments...'
                  }
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setActionDialog(null);
                  setComment('');
                }}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={
                  actionDialog?.action === 'approve' 
                    ? handleApprove 
                    : actionDialog?.action === 'request_changes'
                    ? handleRequestChanges
                    : handleReject
                }
                disabled={
                  processing || 
                  ((actionDialog?.action === 'reject' || actionDialog?.action === 'request_changes') && !comment.trim())
                }
                variant={
                  actionDialog?.action === 'reject' 
                    ? 'destructive' 
                    : actionDialog?.action === 'request_changes'
                    ? 'outline'
                    : 'default'
                }
              >
                {processing
                  ? 'Processing...'
                  : actionDialog?.action === 'approve'
                  ? 'Approve'
                  : actionDialog?.action === 'request_changes'
                  ? 'Request Changes'
                  : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ApprovalQueuePage;

