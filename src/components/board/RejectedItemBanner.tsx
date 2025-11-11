// Rejected Item Banner - Shows rejection details and resubmit option

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Edit } from 'lucide-react';
import { ItemApprovalStatus } from '@/types/workspace';

interface RejectedItemBannerProps {
  approvalStatus: ItemApprovalStatus;
  onEdit?: () => void;
  onResubmit?: () => void;
  itemName?: string;
}

export const RejectedItemBanner: React.FC<RejectedItemBannerProps> = ({
  approvalStatus,
  onEdit,
  onResubmit,
  itemName,
}) => {
  if (approvalStatus.overallStatus !== 'rejected') {
    return null;
  }

  const rejectedLevels = [
    approvalStatus.level1?.status === 'rejected' ? { level: 'Level 1', approval: approvalStatus.level1 } : null,
    approvalStatus.level2?.status === 'rejected' ? { level: 'Level 2', approval: approvalStatus.level2 } : null,
    approvalStatus.level3?.status === 'rejected' ? { level: 'Level 3', approval: approvalStatus.level3 } : null,
  ].filter(Boolean) as Array<{ level: string; approval: NonNullable<ItemApprovalStatus['level1']> }>;

  return (
    <Alert variant="destructive" className="mb-4 border-2">
      <XCircle className="h-5 w-5" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-base mb-2">Item Rejected</h4>
            <p className="text-sm">
              {itemName ? `"${itemName}"` : 'This item'} has been rejected and requires your attention before resubmission.
            </p>
          </div>

          {rejectedLevels.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              {rejectedLevels.map(({ level, approval }) => (
                <div key={level} className="bg-red-50 p-3 rounded-md border border-red-200">
                  <div className="font-medium text-sm mb-1">{level} Rejection</div>
                  {approval.approver && (
                    <div className="text-xs text-muted-foreground mb-1">
                      Rejected by: {approval.approver.name}
                      {approval.approvedAt && (
                        <span className="ml-2">
                          on {new Date(approval.approvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                  {approval.comments && (
                    <div className="text-sm italic mt-1">"{approval.comments}"</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-sm">
              Please review the feedback above, make necessary edits, and resubmit for approval.
            </p>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </Button>
              )}
              {onResubmit && (
                <Button size="sm" onClick={onResubmit}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resubmit
                </Button>
              )}
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

