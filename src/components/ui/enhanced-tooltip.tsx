import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EnhancedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
  disabled?: boolean;
  className?: string;
}

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  content,
  children,
  side = 'top',
  delayDuration = 300,
  disabled = false,
  className,
}) => {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild className={className}>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface TooltipWrapperProps {
  tooltip?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Wrapper component that conditionally shows tooltip
 */
export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  tooltip,
  children,
  disabled = false,
  className,
}) => {
  if (!tooltip || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <EnhancedTooltip content={tooltip} disabled={disabled} className={className}>
      {children}
    </EnhancedTooltip>
  );
};

