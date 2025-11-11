import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  User,
  MessageSquare,
} from 'lucide-react';
import { ItemApprovalStatus, ApprovalLevel } from '@/types/workspace';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ApprovalTimelineProps {
  approvalStatus: ItemApprovalStatus;
  showDetails?: boolean;
  className?: string;
}

const LEVEL_LABELS: Record<ApprovalLevel, string> = {
  LEVEL_1: 'Level 1',
  LEVEL_2: 'Level 2',
  LEVEL_3: 'Level 3',
};

const LEVEL_COLORS: Record<ApprovalLevel, { bg: string; border: string; text: string }> = {
  LEVEL_1: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  LEVEL_2: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  LEVEL_3: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
};

export const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({
  approvalStatus,
  showDetails = true,
  className,
}) => {
  const getStatusIcon = (status: string | undefined) => {
    if (!status || status === 'pending') {
      return <Clock className="h-5 w-5 text-yellow-600" />;
    }
    if (status === 'approved') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (status === 'rejected') {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-gray-400" />;
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status || status === 'pending') {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Pending
        </Badge>
      );
    }
    if (status === 'approved') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          Approved
        </Badge>
      );
    }
    if (status === 'rejected') {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          Rejected
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800">
        Not Started
      </Badge>
    );
  };

  const getCurrentLevel = (): number | null => {
    // Find first pending level
    if (approvalStatus.level1?.status === 'pending') return 0;
    if (approvalStatus.level1?.status === 'approved' && approvalStatus.level2?.status === 'pending') return 1;
    if (approvalStatus.level1?.status === 'approved' && approvalStatus.level2?.status === 'approved' && approvalStatus.level3?.status === 'pending') return 2;
    
    // Find first not started after approved
    if (approvalStatus.level1?.status === 'approved' && !approvalStatus.level2) return 1;
    if (approvalStatus.level2?.status === 'approved' && !approvalStatus.level3) return 2;
    
    return null;
  };

  const currentLevelIndex = getCurrentLevel();

  const renderTimelineItem = (
    level: ApprovalLevel,
    approval: ItemApprovalStatus['level1'] | ItemApprovalStatus['level2'] | ItemApprovalStatus['level3'],
    index: number
  ) => {
    const colors = LEVEL_COLORS[level];
    const hasApproval = !!approval;
    const isPending = approval?.status === 'pending';
    const isApproved = approval?.status === 'approved';
    const isRejected = approval?.status === 'rejected';
    const isNext = index > 0 && !hasApproval;
    const isCurrent = currentLevelIndex === index;

    return (
      <div key={level} className="relative">
        {/* Timeline line */}
        {index < 2 && (
          <div
            className={cn(
              'absolute left-6 top-12 w-0.5 h-16 z-0',
              isApproved ? 'bg-green-300' : isRejected ? 'bg-red-300' : isPending ? 'bg-yellow-300' : 'bg-gray-200'
            )}
          />
        )}

        {/* Timeline node */}
        <div className="relative z-10 flex items-start gap-4">
          {/* Icon circle */}
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-full border-2 bg-white flex-shrink-0 transition-all',
              isApproved && 'border-green-500 bg-green-50',
              isRejected && 'border-red-500 bg-red-50',
              isPending && 'border-yellow-500 bg-yellow-50',
              !hasApproval && 'border-gray-300 bg-gray-50',
              isCurrent && 'ring-4 ring-blue-400 ring-offset-2 shadow-lg scale-110'
            )}
          >
            {getStatusIcon(approval?.status)}
          </div>

          {/* Content */}
          <div className={cn(
            'flex-1 pb-8',
            colors.bg,
            'rounded-lg p-4 border transition-all',
            colors.border,
            isCurrent && 'ring-2 ring-blue-400 ring-offset-1 shadow-md'
          )}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={cn('font-semibold text-sm', colors.text)}>
                    {LEVEL_LABELS[level]} Approval
                  </h4>
                  {isCurrent && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(approval?.status)}
                </div>
              </div>
            </div>

            {showDetails && (
              <div className="space-y-2 mt-3">
                {approval?.approver && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Approver: {approval.approver.name}</span>
                  </div>
                )}

                {approval?.approvedAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(approval.approvedAt), 'PPP p')} (
                      {formatDistanceToNow(new Date(approval.approvedAt), { addSuffix: true })})
                    </span>
                  </div>
                )}

                {approval?.createdAt && !approval.approvedAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Requested {formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                )}

                {approval?.comments && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2 p-2 bg-white/50 rounded">
                    <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="italic">"{approval.comments}"</span>
                  </div>
                )}

                {!hasApproval && isNext && (
                  <p className="text-xs text-muted-foreground italic">
                    Waiting for previous level approval...
                  </p>
                )}

                {!hasApproval && !isNext && (
                  <p className="text-xs text-muted-foreground italic">
                    Not yet requested
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const timelineItems = [
    { level: 'LEVEL_1' as ApprovalLevel, approval: approvalStatus.level1, index: 0 },
    { level: 'LEVEL_2' as ApprovalLevel, approval: approvalStatus.level2, index: 1 },
    { level: 'LEVEL_3' as ApprovalLevel, approval: approvalStatus.level3, index: 2 },
  ];

  return (
    <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Approval Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {timelineItems.map(({ level, approval, index }) =>
            renderTimelineItem(level, approval, index)
          )}
        </div>

        {/* Overall Status Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Overall Status:</span>
            <Badge
              variant={
                approvalStatus.overallStatus === 'approved'
                  ? 'default'
                  : approvalStatus.overallStatus === 'rejected'
                  ? 'destructive'
                  : approvalStatus.overallStatus === 'in_progress'
                  ? 'secondary'
                  : 'outline'
              }
              className={
                approvalStatus.overallStatus === 'approved'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : approvalStatus.overallStatus === 'rejected'
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : approvalStatus.overallStatus === 'in_progress'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
              }
            >
              {approvalStatus.overallStatus === 'approved'
                ? 'Approved'
                : approvalStatus.overallStatus === 'rejected'
                ? 'Rejected'
                : approvalStatus.overallStatus === 'in_progress'
                ? 'In Progress'
                : 'Pending'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};