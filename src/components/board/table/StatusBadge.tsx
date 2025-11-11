import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

// Status color mapping - professional and consistent
const getStatusConfig = (status: string) => {
  const statusLower = status.toLowerCase();
  
  // Overdue - highest priority
  if (statusLower.includes('overdue')) {
    return {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-300',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
    };
  }
  
  // Paid/Approved - success states
  if (statusLower.includes('paid') || statusLower.includes('approved') || statusLower.includes('complete') || statusLower.includes('done') || statusLower === 'active') {
    return {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-300',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
    };
  }
  
  // Pending/Waiting - warning states
  if (statusLower.includes('pending') || statusLower.includes('waiting') || statusLower.includes('review')) {
    return {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-300',
      icon: Clock,
      iconColor: 'text-yellow-600',
    };
  }
  
  // Rejected/Cancelled - error states
  if (statusLower.includes('rejected') || statusLower.includes('cancelled') || statusLower.includes('failed') || statusLower === 'inactive') {
    return {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-300',
      icon: XCircle,
      iconColor: 'text-red-600',
    };
  }
  
  // In Progress - info states
  if (statusLower.includes('progress') || statusLower.includes('processing') || statusLower.includes('in_progress')) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-300',
      icon: Clock,
      iconColor: 'text-blue-600',
    };
  }
  
  // Draft/New - neutral states
  if (statusLower.includes('draft') || statusLower.includes('new')) {
    return {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-300',
      icon: Clock,
      iconColor: 'text-gray-500',
    };
  }
  
  // Default
  return {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-300',
    icon: undefined,
    iconColor: '',
  };
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  className,
  showIcon = true,
}) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium capitalize border flex items-center gap-1.5',
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && Icon && (
        <Icon className={cn(iconSizeClasses[size], config.iconColor)} />
      )}
      <span>{status}</span>
    </Badge>
  );
};

