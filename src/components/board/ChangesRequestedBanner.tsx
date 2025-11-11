// Changes Requested Banner - Shows requested changes and allows resubmission

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ItemApprovalStatus } from '@/types/workspace';
import { approvalAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ChangesRequestedBannerProps {
  approvalStatus: ItemApprovalStatus;
  itemId: string;
  itemName?: string;
  onEdit?: () => void;
  onResubmitted?: () => void;
}

export const ChangesRequestedBanner: React.FC<ChangesRequestedBannerProps> = ({
  approvalStatus,
  itemId,
  itemName,
  onEdit,
  onResubmitted,
}) => {
  const { toast } = useToast();

  // Find approvals with "Changes requested" comments
  const changesRequested = [
    approvalStatus.level1?.status === 'rejected' && approvalStatus.level1.comments?.includes('Changes requested:')
      ? { level: 'Level 1', approval: approvalStatus.level1 }
      : null,
    approvalStatus.level2?.status === 'rejected' && approvalStatus.level2.comments?.includes('Changes requested:')
      ? { level: 'Level 2', approval: approvalStatus.level2 }
      : null,
    approvalStatus.level3?.status === 'rejected' && approvalStatus.level3.comments?.includes('Changes requested:')
      ? { level: 'Level 3', approval: approvalStatus.level3 }
      : null,
  ].filter(Boolean) as Array<{ level: string; approval: NonNullable<ItemApprovalStatus['level1']> }>;

  if (changesRequested.length === 0) {
    return null;
  }

  const handleResubmit = async () => {
    try {
      // Find the level that requested changes
      const firstRequestedLevel = changesRequested[0];
      let targetLevel: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' = 'LEVEL_1';
      
      if (firstRequestedLevel.level === 'Level 2') targetLevel = 'LEVEL_2';
      if (firstRequestedLevel.level === 'Level 3') targetLevel = 'LEVEL_3';

      const response = await approvalAPI.requestApproval(itemId, { levels: [targetLevel] });
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Item resubmitted for approval. The approver has been notified.',
        });
        onResubmitted?.();
      } else {
        throw new Error(response.message || 'Failed to resubmit');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resubmit for approval',
        variant: 'destructive',
      });
    }
  };

  const extractFeedback = (comments: string | undefined): string => {
    if (!comments) return '';
    // Remove "Changes requested: " prefix if present
    return comments.replace(/^Changes requested:\s*/i, '').trim();
  };

  return (
    <Alert variant="outline" className="mb-4 border-2 border-orange-300 bg-orange-50">
      <AlertCircle className="h-5 w-5 text-orange-600" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
              <span>Changes Requested</span>
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                Action Required
              </Badge>
            </h4>
            <p className="text-sm">
              {itemName ? `"${itemName}"` : 'This item'} requires modifications before it can be approved.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-orange-200">
            {changesRequested.map(({ level, approval }) => {
              const feedback = extractFeedback(approval.comments);
              return (
                <div key={level} className="bg-white p-3 rounded-md border border-orange-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-sm">{level} - Changes Requested</div>
                    {approval.approver && (
                      <div className="text-xs text-muted-foreground">
                        by {approval.approver.name}
                        {approval.approvedAt && (
                          <span className="ml-2">
                            on {new Date(approval.approvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {feedback && (
                    <div className="text-sm mt-2 p-2 bg-orange-50 rounded border border-orange-100">
                      <div className="font-medium text-xs mb-1">Feedback:</div>
                      <div className="italic">"{feedback}"</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-orange-200">
            <p className="text-sm">
              Please make the requested changes, then resubmit for approval. The approval will return to the same level.
            </p>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </Button>
              )}
              <Button size="sm" onClick={handleResubmit} className="bg-orange-600 hover:bg-orange-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Resubmit for Approval
              </Button>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

