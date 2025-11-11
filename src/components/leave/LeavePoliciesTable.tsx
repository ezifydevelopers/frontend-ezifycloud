import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { adminAPI } from '@/lib/api';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { useConfirmation } from '@/hooks/useConfirmation';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Settings,
  Shield,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Star,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

interface LeavePolicy {
  id: string;
  name?: string; // Optional for backward compatibility
  leave_type?: string; // Actual API response field
  description: string;
  leaveType?: string; // For backward compatibility
  type?: string; // For backward compatibility
  maxDaysPerYear?: number; // For backward compatibility
  totalDaysPerYear?: number; // For backward compatibility
  total_days_per_year?: number; // Actual API response field
  daysPerYear?: number; // For backward compatibility
  maxDaysPerRequest?: number; // For backward compatibility
  carryForwardDays?: number; // For backward compatibility
  canCarryForward?: boolean; // For backward compatibility
  can_carry_forward?: boolean; // Actual API response field
  carryForward?: boolean; // For backward compatibility
  maxCarryForwardDays?: number; // For backward compatibility
  max_carry_forward_days?: number; // Actual API response field
  maxCarryForward?: number; // For backward compatibility
  carryForwardExpiry?: number; // For backward compatibility
  requires_approval?: boolean; // Actual API response field
  requiresApproval?: boolean; // For backward compatibility
  allow_half_day?: boolean; // Actual API response field
  requiresDocumentation?: boolean; // For backward compatibility
  advanceNotice?: number; // For backward compatibility
  isActive?: boolean; // For backward compatibility
  applicableRoles?: string[]; // For backward compatibility
  applicableDepartments?: string[]; // For backward compatibility
  createdAt?: string; // For backward compatibility
  updatedAt?: string; // For backward compatibility
}

interface LeavePoliciesTableProps {
  showStats?: boolean;
  showFilters?: boolean;
  showCreateButton?: boolean;
  onRefresh?: () => void;
  className?: string;
}

// Form data interface
interface PolicyFormData {
  name: string;
  type: string;
  daysPerYear: number;
  carryForward: boolean;
  maxCarryForward: number;
  requiresApproval: boolean;
  advanceNotice: number;
  description: string;
  isActive: boolean;
}

// Policy Form Component
const PolicyForm: React.FC<{
  policy: LeavePolicy | null;
  onSave: (data: Partial<LeavePolicy>) => void;
  onCancel: () => void;
  existingPolicies?: LeavePolicy[];
}> = ({ policy, onSave, onCancel, existingPolicies = [] }) => {
  const [formData, setFormData] = useState<PolicyFormData>({
    name: policy?.name || policy?.leaveType || '',
    type: policy?.leaveType || policy?.type || 'annual',
    daysPerYear: policy?.totalDaysPerYear || policy?.maxDaysPerYear || policy?.daysPerYear || 0,
    carryForward: policy?.canCarryForward || (policy?.maxCarryForwardDays || 0) > 0,
    maxCarryForward: policy?.maxCarryForwardDays || 0,
    requiresApproval: policy?.requiresApproval !== undefined ? policy.requiresApproval : true,
    advanceNotice: 0, // This field doesn't exist in the schema
    description: policy?.description || '',
    isActive: policy?.isActive !== undefined ? policy.isActive : true,
  });

  // Get existing leave types (excluding current policy if editing)
  const existingTypes = existingPolicies
    .filter(p => p.id !== policy?.id)
    .map(p => p.leaveType || p.leave_type || p.type)
    .filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Show existing policies info when creating new policy */}
      {!policy && existingTypes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Existing Leave Types</h4>
              <p className="text-sm text-blue-700 mt-1">
                The following leave types already have policies: <span className="font-medium">{existingTypes.join(', ')}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                You can only have one policy per leave type. Choose a different type or edit the existing policy.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Policy Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter policy name"
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Leave Type</Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-200 ${
              existingTypes.includes(formData.type) 
                ? 'border-red-300 focus:border-red-300' 
                : 'border-slate-200 focus:border-blue-300'
            }`}
            required
          >
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="maternity">Maternity Leave</option>
            <option value="paternity">Paternity Leave</option>
            <option value="emergency">Emergency Leave</option>
          </select>
          {existingTypes.includes(formData.type) && !policy && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              A policy for this leave type already exists. Please choose a different type or edit the existing policy.
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="daysPerYear">Days Per Year</Label>
          <Input
            id="daysPerYear"
            type="number"
            value={formData.daysPerYear || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setFormData(prev => ({ ...prev, daysPerYear: isNaN(value) ? 0 : value }));
            }}
            placeholder="Enter days per year"
            required
          />
        </div>
        <div>
          <Label htmlFor="advanceNotice">Advance Notice (Days)</Label>
          <Input
            id="advanceNotice"
            type="number"
            value={formData.advanceNotice || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setFormData(prev => ({ ...prev, advanceNotice: isNaN(value) ? 0 : value }));
            }}
            placeholder="Enter advance notice days"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="carryForward"
            checked={formData.carryForward}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, carryForward: checked }))}
          />
          <Label htmlFor="carryForward">Allow Carry Forward</Label>
        </div>

        {formData.carryForward && (
          <div>
            <Label htmlFor="maxCarryForward">Max Carry Forward Days</Label>
            <Input
              id="maxCarryForward"
              type="number"
              value={formData.maxCarryForward || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setFormData(prev => ({ ...prev, maxCarryForward: isNaN(value) ? 0 : value }));
              }}
              placeholder="Enter max carry forward days"
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="requiresApproval"
            checked={formData.requiresApproval}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresApproval: checked }))}
          />
          <Label htmlFor="requiresApproval">Requires Manager Approval</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">Policy is Active</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter policy description"
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Save className="mr-2 h-4 w-4" />
          {policy ? 'Update Policy' : 'Create Policy'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const LeavePoliciesTable: React.FC<LeavePoliciesTableProps> = ({
  showStats = true,
  showFilters = true,
  showCreateButton = true,
  onRefresh,
  className = ''
}) => {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Confirmation dialog hook
  const confirmation = useConfirmation();

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 LeavePoliciesTable: Fetching policies...');
      
      // Build query parameters, filtering out undefined values
      const queryParams: Record<string, string> = {};
      if (searchTerm) queryParams.search = searchTerm;
      
      console.log('🔍 LeavePoliciesTable: Query params:', queryParams);
      
      const response = await adminAPI.getLeavePolicies(queryParams);
      
      console.log('🔍 LeavePoliciesTable: API response:', response);
      
      if (response.success && response.data) {
        // Handle both direct array and paginated response formats
        let policies: LeavePolicy[] = [];
        if (Array.isArray(response.data)) {
          policies = response.data;
        } else if ('policies' in response.data) {
          policies = (response.data as { policies: LeavePolicy[] }).policies;
        } else if ('data' in response.data) {
          policies = (response.data as { data: unknown[] }).data as LeavePolicy[];
        }
        
        setPolicies(policies);
        console.log('✅ LeavePoliciesTable: Loaded policies:', policies.length);
        console.log('🔍 LeavePoliciesTable: Policies data:', policies);
      } else {
        console.warn('❌ LeavePoliciesTable: No data received');
        setPolicies([]);
      }
    } catch (error) {
      console.error('❌ LeavePoliciesTable: Error fetching leave policies:', error);
      setPolicies([]);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave policies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleSavePolicy = async (policyData: Partial<LeavePolicy>) => {
    try {
      setLoading(true);
      console.log('🔍 LeavePoliciesTable: Saving policy:', policyData);
      
      // Map frontend field names to backend field names
      const mappedData = {
        name: policyData.name || policyData.type || 'annual',
        leaveType: policyData.type || 'annual',
        description: policyData.description || '',
        maxDaysPerYear: Number(policyData.daysPerYear) || 0,
        maxDaysPerRequest: Number(policyData.daysPerYear) || 0, // Use same value for now
        totalDaysPerYear: Number(policyData.daysPerYear) || 0,
        canCarryForward: Boolean(policyData.carryForward),
        maxCarryForwardDays: policyData.carryForward ? (Number(policyData.maxCarryForward) || 0) : null,
        requiresApproval: Boolean(policyData.requiresApproval),
        allowHalfDay: true, // Default to true since this field doesn't exist in the form
      };
      
      console.log('🔍 LeavePoliciesTable: Mapped data:', mappedData);
      
      let response;
      if (editingPolicy) {
        // Update existing policy
        console.log('🔍 LeavePoliciesTable: Updating policy:', editingPolicy.id);
        response = await adminAPI.updateLeavePolicy(editingPolicy.id, mappedData);
        console.log('🔍 LeavePoliciesTable: Update response:', response);
      } else {
        // Create new policy
        console.log('🔍 LeavePoliciesTable: Creating new policy');
        response = await adminAPI.createLeavePolicy(mappedData);
        console.log('🔍 LeavePoliciesTable: Create response:', response);
      }
      
      if (response.success) {
        toast({
          title: editingPolicy ? 'Policy updated' : 'Policy created',
          description: `Leave policy has been ${editingPolicy ? 'updated' : 'created'} successfully`,
        });
        setShowForm(false);
        setEditingPolicy(null);
        // Refresh the policies list
        fetchPolicies();
        // Call parent refresh if provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        // Handle specific error cases
        if (response.message?.includes('already exists')) {
          toast({
            title: 'Policy Already Exists',
            description: response.message,
            variant: 'destructive',
          });
          // Don't close the form, let user try again
          return;
        } else {
          throw new Error(response.message || 'Failed to save policy');
        }
      }
    } catch (error) {
      console.error('❌ LeavePoliciesTable: Error saving policy:', error);
      toast({
        title: 'Error',
        description: `Failed to save leave policy: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivatePolicy = async (policyId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Deactivate Leave Policy',
      description: 'Are you sure you want to deactivate this leave policy? You can reactivate it later if needed.',
      confirmText: 'Deactivate',
      cancelText: 'Cancel',
      variant: 'warning',
    });

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 LeavePoliciesTable: Deactivating policy:', policyId);
      
      // Find the current policy to get its current status
      const currentPolicy = policies.find(p => p.id === policyId);
      if (!currentPolicy) {
        throw new Error('Policy not found');
      }
      
      // Instead of deleting, deactivate the policy using the dedicated toggle endpoint
      const response = await adminAPI.toggleLeavePolicyStatus(policyId, false);
      console.log('🔍 LeavePoliciesTable: Deactivate response:', response);
      
      if (response.success) {
        toast({
          title: 'Policy deactivated',
          description: 'Leave policy has been deactivated successfully. You can reactivate it later if needed.',
        });
        // Refresh the policies list
        fetchPolicies();
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(response.message || 'Failed to deactivate policy');
      }
    } catch (error) {
      console.error('❌ LeavePoliciesTable: Error deactivating policy:', error);
      toast({ 
        title: 'Error', 
        description: `Failed to deactivate leave policy: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Leave Policy',
      description: 'Are you sure you want to permanently delete this leave policy? This action cannot be undone.',
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 LeavePoliciesTable: Deleting policy:', policyId);
      
      const response = await adminAPI.deleteLeavePolicy(policyId);
      console.log('🔍 LeavePoliciesTable: Delete response:', response);
      
      if (response.success) {
        toast({
          title: 'Policy deleted',
          description: 'Leave policy has been permanently deleted successfully.',
        });
        // Refresh the policies list
        fetchPolicies();
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(response.message || 'Failed to delete policy');
      }
    } catch (error) {
      console.error('❌ LeavePoliciesTable: Error deleting policy:', error);
      toast({ 
        title: 'Error', 
        description: `Failed to delete leave policy: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (policyId: string) => {
    try {
      setLoading(true);
      console.log('🔍 LeavePoliciesTable: Toggling status for policy:', policyId);
      
      // Find the current policy to get its current status
      const currentPolicy = policies.find(p => p.id === policyId);
      if (!currentPolicy) {
        throw new Error('Policy not found');
      }
      
      // Use the dedicated toggle endpoint
      const response = await adminAPI.toggleLeavePolicyStatus(policyId, !currentPolicy.isActive);
      console.log('🔍 LeavePoliciesTable: Toggle status response:', response);
      
      if (response.success) {
        toast({
          title: 'Status updated',
          description: 'Policy status has been updated successfully',
        });
        // Refresh the policies list
        fetchPolicies();
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(response.message || 'Failed to update policy status');
      }
    } catch (error) {
      console.error('❌ LeavePoliciesTable: Error toggling status:', error);
      toast({
        title: 'Error',
        description: `Failed to update policy status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const policyType = policy.leaveType || policy.leave_type || policy.type || 'Unknown';
    const policyName = policy.name || policy.leaveType || policy.leave_type || 'Unknown';
    const matchesSearch = policyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policyType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getTypeColor = (type: string) => {
    const normalizedType = type?.toLowerCase();
    switch (normalizedType) {
      case 'annual':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sick':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'casual':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'maternity':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'paternity':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'emergency':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  // Mock statistics
  const stats = [
    {
      title: 'Total Policies',
      value: policies.length,
      description: 'Configured policies',
      icon: BookOpen,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      title: 'Active Policies',
      value: policies.filter(p => p.isActive).length,
      description: 'Currently in use',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },
    {
      title: 'Policy Types',
      value: new Set(policies.map(p => p.type)).size,
      description: 'Different categories',
      icon: Shield,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    },
    {
      title: 'Auto-Approval',
      value: policies.filter(p => !p.requiresApproval).length,
      description: 'No approval needed',
      icon: Settings,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 lg:space-y-2">
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.description}</p>
                  </div>
                  <div className="p-2 lg:p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <stat.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      {showFilters && (
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search policies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 border-slate-200/50 focus:border-blue-300 focus:ring-blue-200"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPolicies}
                  disabled={loading}
                  className="bg-white/50 border-white/20 hover:bg-white/80"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                {showCreateButton && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Policy
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policies Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xl">Leave Policies ({filteredPolicies.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50">
                    <TableHead className="font-semibold">Policy Name</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Days/Year</TableHead>
                    <TableHead className="font-semibold">Carry Forward</TableHead>
                    <TableHead className="font-semibold">Approval Required</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((policy, index) => (
                    <TableRow 
                      key={policy.id} 
                      className="group hover:bg-slate-50/50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900">{policy.name || policy.leaveType || policy.leave_type || 'Unknown Policy'}</p>
                          <p className="text-sm text-slate-500">{policy.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(policy.leaveType || policy.leave_type || policy.type)}>
                          {policy.leaveType || policy.leave_type || policy.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{policy.totalDaysPerYear || policy.maxDaysPerYear || policy.total_days_per_year || policy.daysPerYear}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {((policy.maxCarryForwardDays || policy.carryForwardDays || policy.max_carry_forward_days || 0) > 0) ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-slate-600">
                                {policy.maxCarryForwardDays || policy.carryForwardDays || policy.max_carry_forward_days} days max
                              </span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-slate-600">No</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {(policy.requiresApproval || policy.requires_approval) ? (
                            <>
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                              <span className="text-sm text-slate-600">
                                Manual approval
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-slate-600">Auto-approved</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={policy.isActive ?? true}
                            onCheckedChange={() => handleToggleStatus(policy.id)}
                          />
                          <Badge className={getStatusColor(policy.isActive ?? true)}>
                            {(policy.isActive ?? true) ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingPolicy(policy);
                              setShowForm(true);
                            }}
                            className="hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeactivatePolicy(policy.id)}
                            className="hover:bg-orange-50 hover:text-orange-700"
                            title={(policy.isActive ?? true) ? "Deactivate Policy" : "Policy is already inactive"}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePolicy(policy.id)}
                            className="hover:bg-red-50 hover:text-red-700"
                            title="Permanently Delete Policy"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
            </DialogTitle>
            <DialogDescription>
              {editingPolicy ? 'Update the leave policy details' : 'Configure a new leave policy for your organization'}
            </DialogDescription>
          </DialogHeader>
          <PolicyForm
            policy={editingPolicy}
            onSave={handleSavePolicy}
            onCancel={() => {
              setShowForm(false);
              setEditingPolicy(null);
            }}
            existingPolicies={policies}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.close}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.title}
        description={confirmation.description}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        variant={confirmation.variant}
        icon={confirmation.icon}
        loading={confirmation.loading}
      />
    </div>
  );
};

export default LeavePoliciesTable;