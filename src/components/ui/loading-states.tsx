import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <Loader2 
      className={cn('animate-spin text-primary', sizeClasses[size], className)} 
    />
  );
};

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Loading...',
  fullScreen = false 
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-background/80 backdrop-blur-sm',
        fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 rounded-lg'
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
};

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  className,
  count = 1 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded-md bg-muted',
            className
          )}
        />
      ))}
    </>
  );
};

interface LoadingCardProps {
  message?: string;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  message = 'Loading...',
  className 
}) => {
  return (
    <div className={cn('p-6 text-center', className)}>
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

