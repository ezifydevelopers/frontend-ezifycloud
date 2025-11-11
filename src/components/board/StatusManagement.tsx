import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { Column, Item } from '@/types/workspace';
import { boardAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StatusManagementProps {
  item: Item;
  statusColumn?: Column;
  itemStatus?: string;
  onStatusChange?: () => void;
  variant?: 'inline' | 'dropdown' | 'badge';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusManagement: React.FC<StatusManagementProps> = ({
  item,
  statusColumn,
  itemStatus,
  onStatusChange,
  variant = 'badge',
  size = 'md',
}) => {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  // Get current status value
  const getCurrentStatus = () => {
    if (statusColumn) {
      const cell = item.cells?.[statusColumn.id];
      if (cell) {
        const value = typeof cell === 'object' && 'value' in cell ? cell.value : cell;
        return value ? String(value) : null;
      }
      return null;
    }
    return itemStatus || item.status || null;
  };

  const currentStatus = getCurrentStatus();
  
  // Get status options
  const getStatusOptions = (): string[] => {
    if (statusColumn && statusColumn.type === 'STATUS') {
      const options = (statusColumn.settings as { options?: string[] })?.options || [];
      return options;
    }
    // Default status options
    return ['To Do', 'In Progress', 'In Review', 'Done', 'Blocked'];
  };

  const statusOptions = getStatusOptions();

  // Get status configuration
  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('done') || statusLower.includes('complete') || statusLower.includes('approved')) {
      return {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle2,
      };
    }
    if (statusLower.includes('blocked') || statusLower.includes('rejected') || statusLower.includes('cancelled')) {
      return {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
      };
    }
    if (statusLower.includes('progress') || statusLower.includes('review') || statusLower.includes('pending')) {
      return {
        variant: 'secondary' as const,
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Clock,
      };
    }
    return {
      variant: 'outline' as const,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertCircle,
    };
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    try {
      setUpdating(true);

      if (statusColumn) {
        // Update status column cell
        const currentCells = item.cells || {};
        const updatedCells = {
          ...currentCells,
          [statusColumn.id]: newStatus,
        };

        const response = await boardAPI.updateItem(item.id, {
          cells: updatedCells,
        });

        if (response.success) {
          toast({
            title: 'Success',
            description: 'Status updated successfully',
          });
          onStatusChange?.();
        } else {
          throw new Error(response.message || 'Failed to update status');
        }
      } else {
        // Update item.status field
        const response = await boardAPI.updateItem(item.id, {
          status: newStatus,
        });

        if (response.success) {
          toast({
            title: 'Success',
            description: 'Status updated successfully',
          });
          onStatusChange?.();
        } else {
          throw new Error(response.message || 'Failed to update status');
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!currentStatus && statusOptions.length === 0) {
    return null;
  }

  const statusConfig = currentStatus ? getStatusConfig(currentStatus) : null;
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  // Render based on variant
  if (variant === 'badge') {
    if (!currentStatus) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7">
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Set Status
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2">
            <div className="space-y-1">
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  variant="ghost"
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                  disabled={updating}
                >
                  {status}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    const Icon = statusConfig?.icon || AlertCircle;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge
            variant={statusConfig?.variant || 'outline'}
            className={cn(
              'font-medium flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity',
              statusConfig?.className,
              sizeClasses[size]
            )}
          >
            <Icon className={cn('h-3 w-3', size === 'sm' && 'h-2.5 w-2.5')} />
            {currentStatus}
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2">
          <div className="space-y-1">
            {statusOptions.map((status) => (
              <Button
                key={status}
                variant={status === currentStatus ? 'default' : 'ghost'}
                className="w-full justify-start"
                size="sm"
                onClick={() => handleStatusChange(status)}
                disabled={updating}
              >
                {status}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  if (variant === 'dropdown') {
    return (
      <Select
        value={currentStatus || ''}
        onValueChange={handleStatusChange}
        disabled={updating}
      >
        <SelectTrigger className={cn(
          size === 'sm' && 'h-8 text-xs',
          size === 'md' && 'h-9 text-sm',
          size === 'lg' && 'h-10 text-base'
        )}>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Inline variant (minimal button)
  if (!currentStatus) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => {
          // You can implement quick status picker here
          handleStatusChange(statusOptions[0]);
        }}
        disabled={updating}
      >
        <ArrowUpDown className="h-3 w-3 mr-1" />
        Set Status
      </Button>
    );
  }

  const Icon = statusConfig?.icon || AlertCircle;
  return (
    <Button
      variant={statusConfig?.variant === 'destructive' ? 'destructive' : 'outline'}
      size={size}
      onClick={() => {
        // Cycle through statuses or open picker
        const currentIndex = statusOptions.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % statusOptions.length;
        handleStatusChange(statusOptions[nextIndex]);
      }}
      disabled={updating}
      className={cn(statusConfig?.className)}
    >
      <Icon className={cn('h-3 w-3 mr-1.5', size === 'sm' && 'h-2.5 w-2.5 mr-1')} />
      {currentStatus}
    </Button>
  );
};

