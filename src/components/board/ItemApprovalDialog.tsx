import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ApprovalWorkflow } from './ApprovalWorkflow';
import { ApprovalTimeline } from './ApprovalTimeline';
import { ApprovalStatusBadge } from './ApprovalStatusBadge';
import { approvalAPI } from '@/lib/api';
import { ItemApprovalStatus, ApprovalLevel } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, Loader2, XCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChangesRequestedBanner } from './ChangesRequestedBanner';
import { ApprovalStatusIndicator } from './ApprovalStatusIndicator';
import { ApprovalHistory } from './ApprovalHistory';

interface ItemApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName?: string;
}

export const ItemApprovalDialog: React.FC<ItemApprovalDialogProps> = ({
  open,
  onOpenChange,
  itemId,
  itemName,
  boardId,
  workspaceId,
  onEdit,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [approvalStatus, setApprovalStatus] = useState<ItemApprovalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [canApprove, setCanApprove] = useState(false);

  const fetchApprovalStatus = async () => {
    try {
      setLoading(true);
      const response = await approvalAPI.getItemApprovals(itemId);
      if (response.success && response.data) {
        const status = response.data as ItemApprovalStatus;
        setApprovalStatus(status);

        // Check if user can approve
        // User can approve if they're an approver or admin/owner/finance in workspace
        const hasPendingApproval =
          status.level1?.status === 'pending' ||
          status.level2?.status === 'pending' ||
          status.level3?.status === 'pending';

        // For now, allow finance role to approve (can be refined)
        setCanApprove(hasPendingApproval);
      }
    } catch (error) {
      console.error('Error fetching approval status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load approval status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && itemId) {
      fetchApprovalStatus();
    }
  }, [open, itemId]);

  const handleRequestApproval = async (levels: ApprovalLevel[] = ['LEVEL_1']) => {
    try {
      setRequesting(true);
      const response = await approvalAPI.requestApproval(itemId, { levels });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Approval requested successfully',
        });
        fetchApprovalStatus();
      } else {
        throw new Error(response.message || 'Failed to request approval');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to request approval',
        variant: 'destructive',
      });
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const hasNoApprovals =
    !approvalStatus?.level1 && !approvalStatus?.level2 && !approvalStatus?.level3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                {itemName ? `Approvals - ${itemName}` : 'Approval Workflow'}
              </DialogTitle>
              <DialogDescription>
                {approvalStatus?.overallStatus === 'approved'
                  ? 'All approval levels completed'
                  : approvalStatus?.overallStatus === 'rejected'
                  ? 'Approval has been rejected. You can edit the item and resubmit for approval.'
                  : approvalStatus?.overallStatus === 'in_progress'
                  ? 'Approval workflow in progress'
                  : 'Request approval for this item'}
              </DialogDescription>
            </div>
            {approvalStatus && (
              <ApprovalStatusBadge status={approvalStatus.overallStatus} />
            )}
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {hasNoApprovals ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                No approval requests yet. Start the approval process by requesting Level 1 approval.
              </p>
              <Button
                onClick={() => handleRequestApproval(['LEVEL_1'])}
                disabled={requesting}
              >
                {requesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Request Approval
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Show changes requested banner if applicable */}
              {(approvalStatus?.level1?.comments?.includes('Changes requested:') ||
                approvalStatus?.level2?.comments?.includes('Changes requested:') ||
                approvalStatus?.level3?.comments?.includes('Changes requested:')) && (
                <ChangesRequestedBanner
                  approvalStatus={approvalStatus}
                  itemId={itemId}
                  itemName={itemName}
                  onEdit={() => {
                    onOpenChange(false);
                    if (onEdit) {
                      onEdit();
                    } else if (workspaceId && boardId) {
                      window.location.href = `/workspaces/${workspaceId}/boards/${boardId}/items/${itemId}`;
                    }
                  }}
                  onResubmitted={() => {
                    fetchApprovalStatus();
                  }}
                />
              )}

              {/* Show rejection alert if rejected (but not changes requested) */}
              {approvalStatus?.overallStatus === 'rejected' &&
                !approvalStatus?.level1?.comments?.includes('Changes requested:') &&
                !approvalStatus?.level2?.comments?.includes('Changes requested:') &&
                !approvalStatus?.level3?.comments?.includes('Changes requested:') && (
                <Alert variant="destructive" className="mb-4">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Item Rejected</div>
                    <div className="space-y-2">
                      {approvalStatus.level1?.status === 'rejected' && approvalStatus.level1.comments && (
                        <div>
                          <div className="font-medium text-xs">Level 1 Rejection:</div>
                          <div className="text-sm italic">"{approvalStatus.level1.comments}"</div>
                        </div>
                      )}
                      {approvalStatus.level2?.status === 'rejected' && approvalStatus.level2.comments && (
                        <div>
                          <div className="font-medium text-xs">Level 2 Rejection:</div>
                          <div className="text-sm italic">"{approvalStatus.level2.comments}"</div>
                        </div>
                      )}
                      {approvalStatus.level3?.status === 'rejected' && approvalStatus.level3.comments && (
                        <div>
                          <div className="font-medium text-xs">Level 3 Rejection:</div>
                          <div className="text-sm italic">"{approvalStatus.level3.comments}"</div>
                        </div>
                      )}
                      <div className="pt-2 border-t mt-2">
                        <p className="text-sm">You can now edit the item to address the feedback, then resubmit for approval.</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Approval Status Indicator - Compact visual flow */}
              <div className="mb-4">
                <ApprovalStatusIndicator
                  approvalStatus={approvalStatus}
                  variant="detailed"
                  showApprover={true}
                  showDate={true}
                />
              </div>

              <ApprovalTimeline approvalStatus={approvalStatus} showDetails={true} />
              
              {/* Approval History - Complete timeline with time tracking */}
              <ApprovalHistory itemId={itemId} itemName={itemName} />
              
              {/* Show resubmit button if rejected */}
              {approvalStatus?.overallStatus === 'rejected' && (
                <div className="flex justify-end gap-2 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Close dialog and trigger edit
                      onOpenChange(false);
                      if (onEdit) {
                        onEdit();
                      } else if (workspaceId && boardId) {
                        // Fallback: navigate to item detail page
                        window.location.href = `/workspaces/${workspaceId}/boards/${boardId}/items/${itemId}`;
                      }
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Edit Item
                  </Button>
                  <Button
                    onClick={() => handleRequestApproval(['LEVEL_1'])}
                    disabled={requesting}
                  >
                    {requesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Resubmitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Resubmit for Approval
                      </>
                    )}
                  </Button>
                </div>
              )}

              <ApprovalWorkflow
                itemId={itemId}
                approvalStatus={approvalStatus}
                onStatusChange={fetchApprovalStatus}
                canApprove={canApprove}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

