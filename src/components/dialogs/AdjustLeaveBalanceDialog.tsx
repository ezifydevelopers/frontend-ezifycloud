import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { adminAPI, managerAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AdjustLeaveBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  onSuccess?: () => void;
}

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
];

const AdjustLeaveBalanceDialog: React.FC<AdjustLeaveBalanceDialogProps> = ({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leaveType, setLeaveType] = useState<string>('');
  const [additionalDays, setAdditionalDays] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setLeaveType('');
      setAdditionalDays('');
      setReason('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveType || !additionalDays || !reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const days = parseInt(additionalDays);
    if (isNaN(days) || days <= 0 || days > 365) {
      toast({
        title: 'Validation Error',
        description: 'Additional days must be between 1 and 365',
        variant: 'destructive',
      });
      return;
    }

    if (reason.trim().length < 5) {
      toast({
        title: 'Validation Error',
        description: 'Reason must be at least 5 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Use appropriate API based on user role
      let response;
      if (user?.role === 'admin') {
        response = await adminAPI.adjustEmployeeLeaveBalance(
          employeeId,
          {
            leaveType,
            additionalDays: days,
            reason: reason.trim(),
          }
        );
      } else if (user?.role === 'manager') {
        response = await managerAPI.adjustTeamMemberLeaveBalance(
          employeeId,
          {
            leaveType,
            additionalDays: days,
            reason: reason.trim(),
          }
        );
      } else {
        throw new Error('Unauthorized: Only admins and managers can adjust leave balances');
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: `Successfully added ${days} ${LEAVE_TYPES.find(t => t.value === leaveType)?.label || leaveType} days to ${employeeName}'s leave balance`,
        });
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || 'Failed to adjust leave balance');
      }
    } catch (error) {
      console.error('Error adjusting leave balance:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to adjust leave balance',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adjust Leave Balance</DialogTitle>
          <DialogDescription>
            Add additional leave days to {employeeName}'s balance. This action will be logged in the audit trail.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only authorized personnel (Managers/Admins) can manually adjust leave balances. 
                Employees cannot exceed their allocated leave limit and must request additional days through this feature.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger id="leaveType">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalDays">Additional Days *</Label>
              <Input
                id="additionalDays"
                type="number"
                min="1"
                max="365"
                value={additionalDays}
                onChange={(e) => setAdditionalDays(e.target.value)}
                placeholder="Enter number of days (1-365)"
                required
              />
              <p className="text-xs text-gray-500">
                Enter the number of additional leave days to add to the employee's balance
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for adding these leave days (minimum 5 characters)"
                rows={4}
                required
                minLength={5}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {reason.length}/500 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Add Leave Days
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdjustLeaveBalanceDialog;

