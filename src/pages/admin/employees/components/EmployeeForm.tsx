import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { User } from '@/types/auth';
import { adminAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { handleFormValidationErrors } from '@/lib/formUtils';
import { APP_CONFIG } from '@/lib/config';

const employeeSchema = z.object({
  name: z.string().min(APP_CONFIG.UI.VALIDATION.NAME_MIN_LENGTH, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().optional(),
  role: z.enum(['admin', 'manager', 'employee']),
  department: z.string().min(1, 'Please select a department'),
  managerId: z.string().optional(),
  isActive: z.boolean().default(true),
  employeeType: z.enum(['onshore', 'offshore']).optional().nullable(),
  region: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  joinDate: z.string().optional().nullable(),
  probationStatus: z.enum(['active', 'completed', 'extended', 'terminated']).optional().nullable(),
}).refine((data) => {
  // If creating new employee, password is required and must meet backend requirements
  if (!data.password) return true; // Will be handled in onSubmit
  return data.password.length >= APP_CONFIG.SECURITY.PASSWORD.MIN_LENGTH && 
         /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(data.password);
}, {
  message: 'Password must be at least 6 characters with uppercase, lowercase, and number',
  path: ['password']
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!employee;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name || '',
      email: employee?.email || '',
      role: employee?.role || 'employee',
      department: employee?.department || '',
      managerId: employee?.managerId || undefined,
      isActive: employee?.isActive ?? true,
      employeeType: employee?.employeeType || null,
      region: employee?.region || null,
      timezone: employee?.timezone || null,
      joinDate: employee?.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
      probationStatus: employee?.probationStatus || null,
    },
  });

  const watchedRole = watch('role');

  const onSubmit = async (data: EmployeeFormData) => {
    // Check for validation errors first
    if (handleFormValidationErrors(errors)) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Show loading toast
      toast({
        title: isEditing ? APP_CONFIG.MESSAGES.LOADING.UPDATING_EMPLOYEE : APP_CONFIG.MESSAGES.LOADING.CREATING_EMPLOYEE,
        description: APP_CONFIG.MESSAGES.LOADING.PROCESSING_REQUEST,
      });
      
      if (isEditing) {
        const updateData = {
          name: data.name,
          email: data.email,
          role: data.role,
          department: data.department,
          managerId: data.managerId,
          employeeType: data.employeeType,
          region: data.region,
          timezone: data.timezone,
          joinDate: data.joinDate ? new Date(data.joinDate).toISOString() : null,
          probationStatus: data.probationStatus,
        };
        await adminAPI.updateEmployee(employee!.id, updateData);
        toast({
          title: 'Success',
          description: APP_CONFIG.MESSAGES.SUCCESS.EMPLOYEE_UPDATED,
        });
      } else {
        // For new employees, password is required and must meet backend requirements
        if (!data.password) {
          toast({
            title: 'Error',
            description: APP_CONFIG.MESSAGES.ERROR.PASSWORD_REQUIRED,
            variant: 'destructive',
          });
          return;
        }
        
        if (data.password.length < APP_CONFIG.SECURITY.PASSWORD.MIN_LENGTH || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(data.password)) {
          toast({
            title: 'Error',
            description: APP_CONFIG.MESSAGES.ERROR.PASSWORD_VALIDATION,
            variant: 'destructive',
          });
          return;
        }
        
        // Call createEmployee API for new employees
        const employeeData = {
          name: data.name!,
          email: data.email!,
          password: data.password!,
          role: data.role!,
          department: data.department!,
          managerId: data.managerId,
          employeeType: data.employeeType,
          region: data.region,
          timezone: data.timezone,
        };
        await adminAPI.createEmployee(employeeData);
        toast({
          title: 'Success',
          description: APP_CONFIG.MESSAGES.SUCCESS.EMPLOYEE_CREATED,
        });
      }
      
      onSuccess();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as Error).message || APP_CONFIG.MESSAGES.ERROR.FAILED_TO_SAVE,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = APP_CONFIG.BUSINESS.DEPARTMENTS;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? APP_CONFIG.FORMS.BUTTONS.EDIT_EMPLOYEE : APP_CONFIG.FORMS.BUTTONS.ADD_NEW_EMPLOYEE}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update employee information and settings.'
              : 'Add a new team member to your organization.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{APP_CONFIG.FORMS.LABELS.FULL_NAME}</Label>
              <Input
                id="name"
                placeholder={APP_CONFIG.FORMS.PLACEHOLDERS.NAME}
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{APP_CONFIG.FORMS.LABELS.EMAIL_ADDRESS}</Label>
              <Input
                id="email"
                type="email"
                placeholder={APP_CONFIG.FORMS.PLACEHOLDERS.EMAIL}
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">{APP_CONFIG.FORMS.LABELS.PASSWORD}</Label>
              <Input
                id="password"
                type="password"
                placeholder={APP_CONFIG.FORMS.PLACEHOLDERS.PASSWORD}
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must contain at least 6 characters with uppercase, lowercase, and number
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">{APP_CONFIG.FORMS.LABELS.ROLE}</Label>
              <Select
                value={watchedRole}
                onValueChange={(value) => setValue('role', value as 'admin' | 'manager' | 'employee')}
              >
                <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                  <SelectValue placeholder={APP_CONFIG.FORMS.PLACEHOLDERS.SELECT_ROLE} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">{APP_CONFIG.FORMS.LABELS.EMPLOYEE}</SelectItem>
                  <SelectItem value="manager">{APP_CONFIG.FORMS.LABELS.MANAGER}</SelectItem>
                  <SelectItem value="admin">{APP_CONFIG.FORMS.LABELS.ADMIN}</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">{APP_CONFIG.FORMS.LABELS.DEPARTMENT}</Label>
              <Select
                onValueChange={(value) => setValue('department', value)}
              >
                <SelectTrigger className={errors.department ? 'border-destructive' : ''}>
                  <SelectValue placeholder={APP_CONFIG.FORMS.PLACEHOLDERS.SELECT_DEPARTMENT} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-sm text-destructive">{errors.department.message}</p>
              )}
            </div>
          </div>

          {/* Employee Type and Region - Only for employees */}
          {watchedRole === 'employee' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeType">Employee Type</Label>
                <Select
                  value={watch('employeeType') || 'not_specified'}
                  onValueChange={(value) => setValue('employeeType', value === 'not_specified' ? null : value as 'onshore' | 'offshore')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not Specified</SelectItem>
                    <SelectItem value="onshore">Onshore</SelectItem>
                    <SelectItem value="offshore">Offshore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region/Country</Label>
                <Input
                  id="region"
                  placeholder="e.g., USA, India, UK"
                  value={watch('region') || ''}
                  onChange={(e) => setValue('region', e.target.value || null)}
                />
              </div>
            </div>
          )}

          {watchedRole === 'employee' && watch('employeeType') && (
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={watch('timezone') || 'not_specified'}
                onValueChange={(value) => setValue('timezone', value === 'not_specified' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_specified">Not Specified</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Joining Date and Probation Status - Only when editing */}
          {isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="joinDate">Joining Date</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={watch('joinDate') || ''}
                  onChange={(e) => setValue('joinDate', e.target.value || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="probationStatus">Probation Status</Label>
                <Select
                  value={watch('probationStatus') || 'not_set'}
                  onValueChange={(value) => setValue('probationStatus', value === 'not_set' ? null : value as 'active' | 'completed' | 'extended' | 'terminated')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select probation status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_set">Not Set</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="extended">Extended</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">{APP_CONFIG.FORMS.LABELS.ACTIVE_EMPLOYEE}</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {APP_CONFIG.FORMS.BUTTONS.CANCEL}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? APP_CONFIG.FORMS.BUTTONS.SAVING : isEditing ? APP_CONFIG.FORMS.BUTTONS.UPDATE_EMPLOYEE : APP_CONFIG.FORMS.BUTTONS.CREATE_EMPLOYEE}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeForm;
