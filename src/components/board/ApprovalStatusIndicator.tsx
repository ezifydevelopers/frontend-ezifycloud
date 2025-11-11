// Approval Status Indicator - Compact visual indicator for approval status
// Shows current level, status, approver info with color coding

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle, User, Calendar } from 'lucide-react';
import { ItemApprovalStatus, ApprovalLevel } from '@/types/workspace';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ApprovalStatusIndicatorProps {
  approvalStatus: ItemApprovalStatus;
  variant?: 'compact' | 'detailed' | 'minimal';
  showApprover?: boolean;
  showDate?: boolean;
  className?: string;
}

const LEVEL_LABELS: Record<ApprovalLevel, string> = {
  LEVEL_1: 'L1',
  LEVEL_2: 'L2',
  LEVEL_3: 'L3',
};

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'yellow',
    icon: Clock,
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  approved: {
    label: 'Approved',
    color: 'green',
    icon: CheckCircle2,
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800 border-green-200',
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800 border-red-200',
  },
  not_started: {
    label: 'Not Started',
    color: 'gray',
    icon: AlertCircle,
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

const LEVEL_COLORS: Record<ApprovalLevel, { bg: string; border: string; text: string; dot: string }> = {
  LEVEL_1: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  LEVEL_2: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  LEVEL_3: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
};

export const ApprovalStatusIndicator: React.FC<ApprovalStatusIndicatorProps> = ({
  approvalStatus,
  variant = 'compact',
  showApprover = true,
  showDate = true,
  className,
}) => {
  // Determine current level (first pending or first not started)
  const getCurrentLevel = (): { level: ApprovalLevel | null; approval: any; index: number } | null => {
    const levels = [
      { level: 'LEVEL_1' as ApprovalLevel, approval: approvalStatus.level1, index: 0 },
      { level: 'LEVEL_2' as ApprovalLevel, approval: approvalStatus.level2, index: 1 },
      { level: 'LEVEL_3' as ApprovalLevel, approval: approvalStatus.level3, index: 2 },
    ];

    // Find first pending
    for (const { level, approval, index } of levels) {
      if (approval?.status === 'pending') {
        return { level, approval, index };
      }
    }

    // Find first not started (if previous is approved)
    for (let i = 0; i < levels.length; i++) {
      const { level, approval, index } = levels[i];
      const previousApproval = i > 0 ? levels[i - 1].approval : null;
      
      if (!approval && previousApproval?.status === 'approved') {
        return { level, approval: null, index };
      }
    }

    return null;
  };

  const currentLevelInfo = getCurrentLevel();

  const renderLevelBadge = (
    level: ApprovalLevel,
    approval: ItemApprovalStatus['level1'] | ItemApprovalStatus['level2'] | ItemApprovalStatus['level3'] | null,
    index: number,
    isCurrent: boolean = false
  ) => {
    const levelColors = LEVEL_COLORS[level];
    const status = approval?.status || 'not_started';
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
    const Icon = config.icon;

    if (variant === 'minimal') {
      return (
        <div
          key={level}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
            isCurrent && 'ring-2 ring-offset-1',
            status === 'approved' && 'bg-green-100 text-green-700 border-green-300 ring-green-400',
            status === 'rejected' && 'bg-red-100 text-red-700 border-red-300 ring-red-400',
            status === 'pending' && 'bg-yellow-100 text-yellow-700 border-yellow-300 ring-yellow-400',
            status === 'not_started' && 'bg-gray-100 text-gray-500 border-gray-300'
          )}
        >
          <Icon className="h-3 w-3" />
          <span>{LEVEL_LABELS[level]}</span>
        </div>
      );
    }

    return (
      <div
        key={level}
        className={cn(
          'relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
          levelColors.bg,
          levelColors.border,
          isCurrent && 'ring-2 ring-offset-1 ring-blue-400 shadow-md',
          variant === 'detailed' && 'flex-col items-start py-3'
        )}
      >
        {/* Current indicator dot */}
        {isCurrent && (
          <div className={cn('absolute -top-1 -right-1 w-3 h-3 rounded-full', levelColors.dot, 'ring-2 ring-white')} />
        )}

        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center justify-center w-6 h-6 rounded-full border-2',
              status === 'approved' && 'bg-green-100 border-green-500',
              status === 'rejected' && 'bg-red-100 border-red-500',
              status === 'pending' && 'bg-yellow-100 border-yellow-500',
              status === 'not_started' && 'bg-gray-100 border-gray-300'
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', config.text)} />
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('font-semibold text-xs', levelColors.text)}>
              {LEVEL_LABELS[level]}
            </span>
            <Badge variant="outline" className={cn('text-xs', config.badge)}>
              {config.label}
            </Badge>
          </div>
        </div>

        {variant === 'detailed' && approval && (
          <div className="mt-2 space-y-1 text-xs">
            {showApprover && approval.approver && (
              <div className={cn('flex items-center gap-1.5', levelColors.text)}>
                <User className="h-3 w-3" />
                <span>{approval.approver.name}</span>
              </div>
            )}
            {showDate && approval.approvedAt && (
              <div className={cn('flex items-center gap-1.5', levelColors.text)}>
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(approval.approvedAt), 'MMM d, yyyy')}</span>
              </div>
            )}
            {showDate && !approval.approvedAt && approval.createdAt && (
              <div className={cn('flex items-center gap-1.5', levelColors.text)}>
                <Calendar className="h-3 w-3" />
                <span>Requested {format(new Date(approval.createdAt), 'MMM d')}</span>
              </div>
            )}
          </div>
        )}

        {variant === 'compact' && approval?.approver && showApprover && (
          <div className="ml-auto text-xs text-muted-foreground">
            {approval.approver.name}
          </div>
        )}
      </div>
    );
  };

  const levels = [
    { level: 'LEVEL_1' as ApprovalLevel, approval: approvalStatus.level1, index: 0 },
    { level: 'LEVEL_2' as ApprovalLevel, approval: approvalStatus.level2, index: 1 },
    { level: 'LEVEL_3' as ApprovalLevel, approval: approvalStatus.level3, index: 2 },
  ];

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        {levels.map(({ level, approval, index }) => {
          const isCurrent = currentLevelInfo?.level === level && currentLevelInfo?.index === index;
          return renderLevelBadge(level, approval, index, isCurrent);
        })}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {levels.map(({ level, approval, index }) => {
        const isCurrent = currentLevelInfo?.level === level && currentLevelInfo?.index === index;
        return renderLevelBadge(level, approval, index, isCurrent);
      })}
      {/* Overall status */}
      <div className="pt-2 border-t mt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Overall:</span>
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
    </div>
  );
};

