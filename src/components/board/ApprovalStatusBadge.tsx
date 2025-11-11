import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { ItemApprovalStatus } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface ApprovalStatusBadgeProps {
  status: ItemApprovalStatus['overallStatus'];
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const ApprovalStatusBadge: React.FC<ApprovalStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          variant: 'outline' as const,
          className: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle2,
        };
      case 'rejected':
        return {
          label: 'Rejected',
          variant: 'outline' as const,
          className: 'bg-red-100 text-red-700 border-red-200',
          icon: XCircle,
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          variant: 'outline' as const,
          className: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: Clock,
        };
      default:
        return {
          label: 'Pending',
          variant: 'outline' as const,
          className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: AlertCircle,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'font-medium flex items-center gap-1.5 border',
        config.className,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon className={cn('h-3 w-3', size === 'sm' && 'h-2.5 w-2.5')} />}
      {config.label}
    </Badge>
  );
};

