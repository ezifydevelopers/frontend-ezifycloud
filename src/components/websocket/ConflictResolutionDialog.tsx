// Conflict resolution dialog for concurrent edits

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: {
    currentValue: unknown;
    incomingValue: unknown;
    currentUserId: string;
    incomingUserId: string;
    currentUserName: string;
    incomingUserName: string;
  };
  onResolve: (strategy: 'keep_current' | 'use_incoming' | 'merge') => void;
  onCancel: () => void;
}

export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  open,
  onOpenChange,
  conflict,
  onResolve,
  onCancel,
}) => {
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'Empty';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-50">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <DialogTitle>Edit Conflict Detected</DialogTitle>
              <DialogDescription>
                Another user has edited this cell while you were editing it.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Value */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Value (by {conflict.currentUserName})</label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm">{formatValue(conflict.currentValue)}</p>
            </div>
          </div>

          {/* Incoming Value */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Value</label>
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm">{formatValue(conflict.incomingValue)}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              Please choose how to resolve this conflict:
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={() => onResolve('keep_current')}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Keep Current
          </Button>
          <Button
            variant="default"
            onClick={() => onResolve('use_incoming')}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Use My Value
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

