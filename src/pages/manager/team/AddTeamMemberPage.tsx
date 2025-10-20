import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { toast } from '@/hooks/use-toast';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { managerAPI } from '@/lib/api';
import { handleFormValidationErrors } from '@/lib/formUtils';

const teamMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['employee']),
  department: z.string().min(1, 'Please select a department').refine(val => val !== 'loading', 'Please select a valid department'),
  isActive: z.boolean().default(true),
});

type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

const AddTeamMemberPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshAfterEmployeeAction } = useDataRefresh();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'employee',
      department: '',
      isActive: true,
    },
  });


  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await managerAPI.getTeamDepartments();
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch departments',
        variant: 'destructive',
      });
    } finally {
      setLoadingDepartments(false);
    }
  };

  const onSubmit = async (data: TeamMemberFormData) => {
    // Check for validation errors first
    if (handleFormValidationErrors(errors)) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Show loading toast
      toast({
        title: 'Creating team member...',
        description: 'Please wait while we process your request.',
      });
      
      // Transform data for manager API
      const teamMemberData = {
        name: data.name,
        email: data.email,
        phone: '', // Not in the simple form
        department: data.department,
        role: data.role,
        position: '', // Not in the simple form
        salary: 0, // Not in the simple form
        startDate: new Date().toISOString().split('T')[0],
        address: '', // Not in the simple form
        emergencyContact: '', // Not in the simple form
        emergencyPhone: '', // Not in the simple form
        skills: '', // Not in the simple form
        notes: '', // Not in the simple form
        isActive: data.isActive,
      };

      // Call the manager API to add team member
      const response = await managerAPI.addTeamMember(teamMemberData);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Team member added successfully!',
        });

        // Refresh team data
        await refreshAfterEmployeeAction('create');

        // Navigate back to team overview
        navigate('/manager/team');
      } else {
        throw new Error(response.message || 'Failed to add team member');
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add team member',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    navigate('/manager/team');
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogDescription>
            Add a new team member to your department.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must contain at least 6 characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <div className="flex items-center h-10 px-3 py-2 border border-input bg-background rounded-md text-sm">
                Employee
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                onValueChange={(value) => setValue('department', value)}
              >
                <SelectTrigger className={errors.department ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {loadingDepartments ? (
                    <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                  ) : (
                    departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-sm text-destructive">{errors.department.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">Active Employee</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loadingDepartments}>
              {isSubmitting ? 'Adding...' : 'Add Team Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamMemberPage;