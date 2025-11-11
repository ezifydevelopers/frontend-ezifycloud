import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  onGoHome,
  className,
}) => {
  return (
    <Alert variant="destructive" className={cn('max-w-md mx-auto', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
      </AlertDescription>
      {(onRetry || onGoHome) && (
        <div className="flex gap-2 mt-4">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          {onGoHome && (
            <Button variant="outline" size="sm" onClick={onGoHome}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      )}
    </Alert>
  );
};

interface ErrorOverlayProps {
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({
  message,
  onRetry,
  fullScreen = false,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-background/80 backdrop-blur-sm',
        fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 rounded-lg'
      )}
    >
      <div className="text-center max-w-md p-6">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error</h3>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div className={cn('text-center py-12 px-4', className)}>
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
};

