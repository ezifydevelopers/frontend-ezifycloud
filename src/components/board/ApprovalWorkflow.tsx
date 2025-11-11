import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  AlertCircle,
  User,
  Edit,
} from 'lucide-react';
import { ItemApprovalStatus, ApprovalLevel, ApprovalStatus } from '@/types/workspace';
import { approvalAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ApprovalWorkflowProps {
  itemId: string;
  approvalStatus?: ItemApprovalStatus;
  onStatusChange?: () => void;
  canApprove?: boolean;
}

const LEVEL_LABELS: Record<ApprovalLevel, string> = {
  LEVEL_1: 'Level 1 Approval',
  LEVEL_2: 'Level 2 Approval',
  LEVEL_3: 'Level 3 Approval',
};

const LEVEL_DESCRIPTIONS: Record<ApprovalLevel, string> = {
  LEVEL_1: 'First level approval required',
  LEVEL_2: 'Second level approval required',
  LEVEL_3: 'Final level approval required',
};

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  itemId,
  approvalStatus,
  onStatusChange,
  canApprove = false,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [actionDialog, setActionDialog] = useState<{
    approvalId: string;
    level: ApprovalLevel;
    action: 'approve' | 'reject' | 'request_changes';
  } | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    if (!actionDialog) return;

    try {
      setProcessing(true);
      const response = await approvalAPI.updateApproval(actionDialog.approvalId, {
        status: 'approved',
        comments: comment || undefined,
        approverId: user?.id,
      });

      if (response.success) {
        const isLastLevel = actionDialog.level === 'LEVEL_3';
        toast({
          title: 'Success',
          description: isLastLevel
            ? 'Approval complete! All levels approved.'
            : `${LEVEL_LABELS[actionDialog.level]} approved. Moving to next level...`,
        });
        setActionDialog(null);
        setComment('');
        // Delay status change to allow backend to create next level
        setTimeout(() => {
          onStatusChange?.();
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
    if (!actionDialog) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Rejection requires a reason. Please provide comments explaining why.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);
      const response = await approvalAPI.updateApproval(actionDialog.approvalId, {
        status: 'rejected',
        comments: comment,
        approverId: user?.id,
      });

      if (response.success) {
        toast({
          title: 'Rejected',
          description: `${LEVEL_LABELS[actionDialog.level]} rejected. The item creator has been notified.`,
        });
        setActionDialog(null);
        setComment('');
        onStatusChange?.();
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
        description: 'Please describe the changes needed. Your feedback will help the creator make the necessary updates.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);
      // Request changes: reject with comment indicating changes are needed
      // This returns the item to creator for edits, they can resubmit when ready
      const rejectResponse = await approvalAPI.updateApproval(actionDialog.approvalId, {
        status: 'rejected',
        comments: `Changes requested: ${comment}`,
        approverId: user?.id,
      });

      if (rejectResponse.success) {
        toast({
          title: 'Changes Requested',
          description: `Feedback sent to creator. They can edit the item and resubmit for ${actionDialog.level === 'LEVEL_1' ? 'Level 1' : actionDialog.level === 'LEVEL_2' ? 'Level 2' : 'Level 3'} approval.`,
        });
        setActionDialog(null);
        setComment('');
        onStatusChange?.();
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

  const renderLevel = (
    level: ApprovalLevel,
    approval: ItemApprovalStatus['level1'] | ItemApprovalStatus['level2'] | ItemApprovalStatus['level3']
  ) => {
    const isPending = !approval || approval.status === 'pending';
    const isApproved = approval?.status === 'approved';
    const isRejected = approval?.status === 'rejected';
    const canAct = canApprove && isPending && approval;

    return (
      <div
        key={level}
        className={cn(
          'flex items-center gap-4 p-4 border rounded-lg transition-colors',
          isApproved && 'bg-green-50 border-green-200',
          isRejected && 'bg-red-50 border-red-200',
          isPending && approval && 'bg-yellow-50 border-yellow-200',
          !approval && 'bg-slate-50 border-slate-200'
        )}
      >
        <div className="flex-shrink-0">
          {isApproved ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : isRejected ? (
            <XCircle className="h-6 w-6 text-red-600" />
          ) : approval ? (
            <Clock className="h-6 w-6 text-yellow-600" />
          ) : (
            <AlertCircle className="h-6 w-6 text-slate-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{LEVEL_LABELS[level]}</h4>
            <Badge
              variant={
                isApproved ? 'default' : isRejected ? 'destructive' : 'outline'
              }
              className="text-xs"
            >
              {isApproved
                ? 'Approved'
                : isRejected
                ? 'Rejected'
                : approval
                ? 'Pending'
                : 'Not Started'}
            </Badge>
          </div>

          {approval ? (
            <div className="space-y-1">
              {approval.approver && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{approval.approver.name}</span>
                </div>
              )}
              {approval.approvedAt && (
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(approval.approvedAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
              {approval.comments && (
                <p className="text-xs text-muted-foreground italic">
                  "{approval.comments}"
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {LEVEL_DESCRIPTIONS[level]}
            </p>
          )}
        </div>

        {canAct && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setActionDialog({
                  approvalId: approval.id,
                  level,
                  action: 'approve',
                })
              }
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setActionDialog({
                  approvalId: approval.id,
                  level,
                  action: 'request_changes',
                })
              }
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <Edit className="h-3 w-3 mr-1" />
              Request Changes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setActionDialog({
                  approvalId: approval.id,
                  level,
                  action: 'reject',
                })
              }
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (!approvalStatus) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        {renderLevel('LEVEL_1', approvalStatus.level1)}
        {approvalStatus.level1?.status === 'approved' && (
          <div className="flex justify-center">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        {renderLevel('LEVEL_2', approvalStatus.level2)}
        {approvalStatus.level2?.status === 'approved' && (
          <div className="flex justify-center">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        {renderLevel('LEVEL_3', approvalStatus.level3)}
      </div>

      {/* Action Dialog */}
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
                ? 'Approve' 
                : actionDialog?.action === 'request_changes'
                ? 'Request Changes'
                : 'Reject'}{' '}
              {actionDialog && LEVEL_LABELS[actionDialog.level]}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.action === 'approve'
                ? 'Approve this item and move it to the next approval level (if applicable). You can add optional comments. The item creator will be notified.'
                : actionDialog?.action === 'request_changes'
                ? 'Request specific changes to this item. Please describe what needs to be updated. The item will be returned to the creator for modifications. They can edit and resubmit it for the same approval level.'
                : 'Reject this item permanently. A rejection reason is required. The approval process will stop and the creator will be notified. Use "Request Changes" if you want the creator to make edits and resubmit.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                {actionDialog?.action === 'reject'
                  ? 'Rejection Reason * (Required)'
                  : actionDialog?.action === 'request_changes'
                  ? 'Changes Needed * (Required)'
                  : 'Comments (Optional)'}
              </Label>
              {actionDialog?.action === 'approve' && (
                <p className="text-xs text-muted-foreground mb-2">
                  Optional comments will be shared with the item creator. The item will automatically progress to the next approval level after approval.
                </p>
              )}
              {actionDialog?.action === 'reject' && (
                <p className="text-xs text-muted-foreground mb-2">
                  Please explain why this item is being rejected. This reason will be sent to the item creator.
                </p>
              )}
              {actionDialog?.action === 'request_changes' && (
                <p className="text-xs text-muted-foreground mb-2">
                  Provide specific feedback on what needs to be changed. The creator will see this feedback and can edit the item before resubmitting.
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
                    : 'Add any comments...'
                }
                rows={3}
                className="resize-none"
                required={actionDialog?.action === 'reject' || actionDialog?.action === 'request_changes'}
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
              variant={
                actionDialog?.action === 'reject' 
                  ? 'destructive' 
                  : actionDialog?.action === 'request_changes'
                  ? 'outline'
                  : 'default'
              }
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
    </>
  );
};

