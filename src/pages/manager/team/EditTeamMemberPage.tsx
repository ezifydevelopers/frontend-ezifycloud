import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { managerAPI } from '@/lib/api';
import { 
  ArrowLeft,
  Save,
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader2
} from 'lucide-react';

const editTeamMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  department: z.string().min(1, 'Please select a department'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

type EditTeamMemberFormData = z.infer<typeof editTeamMemberSchema>;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  isActive: boolean;
}

const EditTeamMemberPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<EditTeamMemberFormData>({
    resolver: zodResolver(editTeamMemberSchema),
    defaultValues: {
      isActive: true,
    }
  });

  const watchedIsActive = watch('isActive');

  const fetchMemberDetails = useCallback(async (memberId: string) => {
    try {
      setLoading(true);
      console.log('🔍 EditTeamMemberPage: Fetching member details for ID:', memberId);
      
      const response = await managerAPI.getTeamMemberById(memberId);
      console.log('🔍 EditTeamMemberPage: API Response:', response);
      
      if (response.success && response.data) {
        const memberData = response.data as unknown as TeamMember;
        console.log('🔍 EditTeamMemberPage: Member data:', memberData);
        setMember(memberData);
        
        // Populate form with existing data
        const formData = {
          name: memberData.name || '',
          email: memberData.email || '',
          department: memberData.department || '',
          password: '', // Always start with empty password
          isActive: memberData.isActive ?? true,
        };
        
        console.log('🔍 EditTeamMemberPage: Form data to reset:', formData);
        reset(formData);
      } else {
        console.error('🔍 EditTeamMemberPage: No data in response:', response);
        toast({
          title: 'Error',
          description: 'Failed to fetch member details',
          variant: 'destructive',
        });
        navigate('/manager/team');
      }
    } catch (error) {
      console.error('🔍 EditTeamMemberPage: Error fetching member details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch member details',
        variant: 'destructive',
      });
      navigate('/manager/team');
    } finally {
      setLoading(false);
    }
  }, [navigate, reset]);

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

  useEffect(() => {
    if (id) {
      fetchMemberDetails(id);
      fetchDepartments();
    }
  }, [id, fetchMemberDetails]);

  const onSubmit = async (data: EditTeamMemberFormData) => {
    if (!id) return;

    try {
      setSaving(true);
      
      // Prepare update data - only include password if it's provided
      const updateData: {
        name: string;
        email: string;
        department: string;
        isActive: boolean;
        password?: string;
      } = {
        name: data.name,
        email: data.email,
        department: data.department,
        isActive: data.isActive,
      };

      // Only include password if it's provided and not empty
      if (data.password && data.password.trim() !== '') {
        updateData.password = data.password;
      }

      console.log('🔍 EditTeamMemberPage: Updating team member:', { id, updateData });
      
      const response = await managerAPI.updateTeamMember(id, updateData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Team member updated successfully',
        });
        
        navigate(`/manager/team/${id}`);
      } else {
        throw new Error(response.message || 'Failed to update team member');
      }
    } catch (error) {
      console.error('🔍 EditTeamMemberPage: Error updating team member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update team member',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading member details...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Member Not Found</h3>
            <p className="text-muted-foreground mb-4">The requested team member could not be found</p>
            <Button onClick={() => navigate('/manager/team')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="bg-white/90 backdrop-blur-md border-white/20 shadow-xl rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/manager/team/${id}`)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Edit Team Member
                  </h1>
                  <p className="text-muted-foreground text-lg">Update {member.name}'s information</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Team Member Information */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Team Member Information</CardTitle>
                  <p className="text-sm text-muted-foreground">Basic details and work information</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter full name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="Enter email address"
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Reset Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      {...register('password')}
                      placeholder="Enter new password (leave blank to keep current)"
                      className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Leave blank to keep the current password
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    onValueChange={(value) => setValue('department', value)}
                    defaultValue={member?.department}
                  >
                    <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingDepartments ? (
                        <SelectItem value="loading" disabled>
                          Loading departments...
                        </SelectItem>
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
                    <p className="text-sm text-red-500">{errors.department.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="isActive"
                      checked={watchedIsActive}
                      onCheckedChange={(checked) => setValue('isActive', checked)}
                    />
                    <Label htmlFor="isActive" className="text-sm">
                      {watchedIsActive ? 'Active Employee' : 'Inactive Employee'}
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/manager/team/${id}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || loadingDepartments}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeamMemberPage;
