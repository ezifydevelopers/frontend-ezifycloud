import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  Edit,
  Copy,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount?: number;
  actions: BulkAction[];
  onClearSelection: () => void;
  onSelectAll?: () => void;
  className?: string;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  totalCount,
  actions,
  onClearSelection,
  onSelectAll,
  className,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background border-b shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="font-semibold">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </Badge>
        {onSelectAll && totalCount && selectedCount < totalCount && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="text-sm"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Select All ({totalCount})
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            <action.icon className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
};

