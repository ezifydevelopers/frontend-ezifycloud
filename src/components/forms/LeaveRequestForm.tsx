import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { employeeAPI } from '@/lib/api';
import { handleFormValidationErrors } from '@/lib/formUtils';
import { LeavePolicy } from '@/types/leave';

// Dynamic schema will be created based on available policies
const createLeaveRequestSchema = (policies: LeavePolicy[]) => {
  const leaveTypes = policies.map(policy => policy.leaveType);
  // If no policies are available, use a default schema
  if (leaveTypes.length === 0) {
    return z.object({
      leaveType: z.string().min(1, 'Leave type is required'),
      startDate: z.date({
        required_error: "Start date is required",
      }),
      endDate: z.date({
        required_error: "End date is required",
      }),
      reason: z.string().min(10, 'Reason must be at least 10 characters'),
      isHalfDay: z.boolean().default(false),
      halfDayPeriod: z.enum(['morning', 'afternoon']).optional(),
      emergencyContact: z.string().optional(),
      workHandover: z.string().optional(),
    }).refine(data => data.endDate >= data.startDate, {
      message: "End date cannot be before start date",
      path: ["endDate"],
    }).refine(data => !data.isHalfDay || data.halfDayPeriod, {
      message: "Half day period is required when half day is selected",
      path: ["halfDayPeriod"],
    });
  }
  
  return z.object({
    leaveType: z.enum(leaveTypes as [string, ...string[]]),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date({
      required_error: "End date is required",
    }),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
    isHalfDay: z.boolean().default(false),
    halfDayPeriod: z.enum(['morning', 'afternoon']).optional(),
    emergencyContact: z.string().optional(),
    workHandover: z.string().optional(),
  }).refine(data => data.endDate >= data.startDate, {
    message: "End date cannot be before start date",
    path: ["endDate"],
  }).refine(data => !data.isHalfDay || data.halfDayPeriod, {
    message: "Half day period is required when half day is selected",
    path: ["halfDayPeriod"],
  });
};

type LeaveRequestFormData = {
  leaveType: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  isHalfDay?: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  emergencyContact?: string;
  workHandover?: string;
};

type LeaveRequestAPIData = {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  emergencyContact: string;
  workHandover: string;
  attachments: string[];
};

interface LeaveRequestFormProps {
  onSubmit?: (data: LeaveRequestAPIData) => void;
  className?: string;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ onSubmit, className }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(createLeaveRequestSchema(leavePolicies)),
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const isHalfDay = watch('isHalfDay');
  const leaveType = watch('leaveType');

  // Fetch leave policies on component mount
  useEffect(() => {
    const fetchLeavePolicies = async () => {
      try {
        setLoadingPolicies(true);
        const response = await employeeAPI.getLeavePolicies({ status: 'active', limit: 50 });
        if (response.success && response.data) {
          const policies = Array.isArray(response.data) ? response.data : response.data.data || [];
          setLeavePolicies(policies);
          console.log('🔍 LeaveRequestForm: Fetched leave policies:', policies);
        }
      } catch (error) {
        console.error('Error fetching leave policies:', error);
        toast({
          title: 'Error',
          description: 'Failed to load leave policies. Using default options.',
          variant: 'destructive',
        });
      } finally {
        setLoadingPolicies(false);
      }
    };

    fetchLeavePolicies();
  }, []);

  const calculateTotalDays = () => {
    if (!startDate || !endDate || 
        !(startDate instanceof Date) || !(endDate instanceof Date) ||
        isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 0;
    }
    const timeDiff = endDate.getTime() - startDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    return isHalfDay ? 0.5 : dayDiff;
  };

  const handleFormSubmit = async (data: LeaveRequestFormData) => {
    // Check for validation errors first
    if (handleFormValidationErrors(errors)) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Show loading toast
      toast({
        title: 'Submitting request...',
        description: 'Please wait while we process your leave request.',
      });
      
      // Transform form data to API format
      const leaveRequestData: LeaveRequestAPIData = {
        leaveType: data.leaveType,
        startDate: data.startDate instanceof Date && !isNaN(data.startDate.getTime()) ? data.startDate.toISOString() : new Date().toISOString(),
        endDate: data.endDate instanceof Date && !isNaN(data.endDate.getTime()) ? data.endDate.toISOString() : new Date().toISOString(),
        reason: data.reason,
        isHalfDay: data.isHalfDay || false,
        halfDayPeriod: data.isHalfDay ? data.halfDayPeriod : undefined,
        emergencyContact: data.emergencyContact || '',
        workHandover: data.workHandover || '',
        attachments: documents.map(file => file.name),
      };

      console.log('🔍 LeaveRequestForm: Sending data to parent:', leaveRequestData);

      // Pass data to parent component to handle API call
      if (onSubmit) {
        onSubmit(leaveRequestData);
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Create leave type options from fetched policies
  const leaveTypeOptions = leavePolicies.map(policy => ({
    value: policy.leaveType,
    label: policy.name || policy.leaveType || 'Unknown Policy'
  }));

  console.log('🔍 LeaveRequestForm: Leave policies:', leavePolicies);
  console.log('🔍 LeaveRequestForm: Leave type options:', leaveTypeOptions);

  return (
    <div className={className}>
      <div className="space-y-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
              Debug: {leavePolicies.length} policies loaded, {leaveTypeOptions.length} options available
            </div>
          )}
          {/* Leave Type */}
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type *</Label>
            {loadingPolicies ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading leave policies...</span>
              </div>
            ) : leaveTypeOptions.length === 0 ? (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No leave policies available</p>
                <p className="text-xs text-muted-foreground">Please contact your administrator</p>
              </div>
            ) : (
              <Select onValueChange={(value) => setValue('leaveType', value as LeaveRequestFormData['leaveType'])}>
                <SelectTrigger className={`w-full h-10 px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-200 focus:outline-none ${errors.leaveType ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 rounded-md shadow-lg z-50 p-1">
                  {leaveTypeOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value} 
                      className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.leaveType && (
              <p className="text-sm text-destructive">{errors.leaveType.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                {...register('startDate', { 
                  valueAsDate: true,
                  validate: (value) => {
                    if (!value) return 'Start date is required';
                    if (value < new Date()) return 'Start date cannot be in the past';
                    return true;
                  }
                })}
                className={cn(
                  errors.startDate && 'border-destructive'
                )}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input
                type="date"
                {...register('endDate', { 
                  valueAsDate: true,
                  validate: (value) => {
                    if (!value) return 'End date is required';
                    const currentStartDate = watch('startDate');
                    if (currentStartDate && value < currentStartDate) return 'End date cannot be before start date';
                    return true;
                  }
                })}
                className={cn(
                  errors.endDate && 'border-destructive'
                )}
                min={startDate && startDate instanceof Date && !isNaN(startDate.getTime()) ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Half Day Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isHalfDay"
              checked={isHalfDay}
              onCheckedChange={(checked) => setValue('isHalfDay', checked as boolean)}
            />
            <Label htmlFor="isHalfDay" className="text-sm font-medium">
              This is a half-day leave
            </Label>
          </div>

          {/* Half Day Period */}
          {isHalfDay && (
            <div className="space-y-2">
              <Label htmlFor="halfDayPeriod">Half Day Period</Label>
              <Select onValueChange={(value) => setValue('halfDayPeriod', value as LeaveRequestFormData['halfDayPeriod'])}>
                <SelectTrigger className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-200 focus:outline-none">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 rounded-md shadow-lg z-50 p-1">
                  <SelectItem 
                    value="morning" 
                    className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    Morning (9 AM - 1 PM)
                  </SelectItem>
                  <SelectItem 
                    value="afternoon" 
                    className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    Afternoon (1 PM - 5 PM)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Total Days Display */}
          {startDate && endDate && 
           startDate instanceof Date && endDate instanceof Date &&
           !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Total leave duration: <strong>{calculateTotalDays()} day{calculateTotalDays() !== 1 ? 's' : ''}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Leave *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for your leave request..."
              rows={4}
              {...register('reason')}
              className={errors.reason ? 'border-destructive' : ''}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input
              id="emergencyContact"
              placeholder="Phone number or email for emergency contact"
              {...register('emergencyContact')}
            />
          </div>

          {/* Work Handover */}
          <div className="space-y-2">
            <Label htmlFor="workHandover">Work Handover Notes</Label>
            <Textarea
              id="workHandover"
              placeholder="Any important work handover notes or pending tasks..."
              rows={3}
              {...register('workHandover')}
            />
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label htmlFor="documents">Supporting Documents</Label>
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload medical certificates or other supporting documents
              </p>
              <Input
                id="documents"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileUpload}
                className="w-full"
              />
            </div>
            
            {/* Document List */}
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medical Certificate Warning */}
          {leaveType === 'sick' && (
            <Alert>
              <AlertDescription>
                <strong>Note:</strong> Medical certificate required for sick leave longer than 3 days.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              'Submit Leave Request'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestForm;