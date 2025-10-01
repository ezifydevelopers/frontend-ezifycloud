import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const policySchema = z.object({
  leaveType: z.string().min(1, 'Leave type is required'),
  totalDaysPerYear: z.number().min(1, 'Must be at least 1 day'),
  canCarryForward: z.boolean(),
  maxCarryForwardDays: z.number().optional(),
  requiresApproval: z.boolean(),
  allowHalfDay: z.boolean(),
  description: z.string().optional(),
});

type PolicyFormData = z.infer<typeof policySchema>;

interface PolicyFormProps {
  policy?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const PolicyForm: React.FC<PolicyFormProps> = ({
  policy,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!policy;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      leaveType: policy?.leaveType || '',
      totalDaysPerYear: policy?.totalDaysPerYear || 25,
      canCarryForward: policy?.canCarryForward || false,
      maxCarryForwardDays: policy?.maxCarryForwardDays || 0,
      requiresApproval: policy?.requiresApproval || true,
      allowHalfDay: policy?.allowHalfDay || true,
      description: policy?.description || '',
    },
  });

  const watchedCarryForward = watch('canCarryForward');

  const onSubmit = async (data: PolicyFormData) => {
    try {
      setIsSubmitting(true);
      
      // Implement API call
      // if (isEditing) {
      //   await policyAPI.updatePolicy(policy.id, data);
      // } else {
      //   await policyAPI.createPolicy(data);
      // }
      
      toast({
        title: 'Success',
        description: `Policy ${isEditing ? 'updated' : 'created'} successfully`,
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save policy',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Policy' : 'Add New Policy'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update leave policy settings.'
              : 'Create a new leave policy for your organization.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type</Label>
            <Input
              id="leaveType"
              placeholder="e.g., Annual Leave"
              {...register('leaveType')}
              className={errors.leaveType ? 'border-destructive' : ''}
            />
            {errors.leaveType && (
              <p className="text-sm text-destructive">{errors.leaveType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalDaysPerYear">Total Days Per Year</Label>
            <Input
              id="totalDaysPerYear"
              type="number"
              min="1"
              {...register('totalDaysPerYear', { valueAsNumber: true })}
              className={errors.totalDaysPerYear ? 'border-destructive' : ''}
            />
            {errors.totalDaysPerYear && (
              <p className="text-sm text-destructive">{errors.totalDaysPerYear.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Carry Forward</Label>
                <p className="text-sm text-muted-foreground">
                  Allow employees to carry forward unused leave to next year
                </p>
              </div>
              <Switch
                checked={watchedCarryForward}
                onCheckedChange={(checked) => setValue('canCarryForward', checked)}
              />
            </div>

            {watchedCarryForward && (
              <div className="space-y-2">
                <Label htmlFor="maxCarryForwardDays">Max Carry Forward Days</Label>
                <Input
                  id="maxCarryForwardDays"
                  type="number"
                  min="0"
                  {...register('maxCarryForwardDays', { valueAsNumber: true })}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Requires Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Leave requests of this type require manager approval
                </p>
              </div>
              <Switch
                checked={watch('requiresApproval')}
                onCheckedChange={(checked) => setValue('requiresApproval', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Half Day</Label>
                <p className="text-sm text-muted-foreground">
                  Allow employees to take half-day leave of this type
                </p>
              </div>
              <Switch
                checked={watch('allowHalfDay')}
                onCheckedChange={(checked) => setValue('allowHalfDay', checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe this leave policy..."
              {...register('description')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Policy' : 'Create Policy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyForm;
