import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  employeeType?: 'onshore' | 'offshore' | null; // Employee type for the policy
  employee_type?: 'onshore' | 'offshore' | null; // Actual API response field
}

interface LeavePoliciesTableProps {
  showStats?: boolean;
  showFilters?: boolean;
  showCreateButton?: boolean;
  onRefresh?: () => void;
  className?: string;
  employeeType?: 'onshore' | 'offshore' | null; // Filter by employee type
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
  employeeType?: 'onshore' | 'offshore' | null;
}

// Format leave type for display (replace underscores with spaces and capitalize)
const formatLeaveType = (type: string): string => {
  if (!type) return '';
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format policy name for display (replace underscores with spaces)
const formatPolicyName = (name: string | undefined): string => {
  if (!name) return '';
  return name.replace(/_/g, ' ');
};

// Policy Form Component
const PolicyForm: React.FC<{
  policy: LeavePolicy | null;
  onSave: (data: Partial<LeavePolicy>) => void;
  onCancel: () => void;
  existingPolicies?: LeavePolicy[];
  availableLeaveTypes?: string[];
  loadingTypes?: boolean;
  onRefreshLeaveTypes?: () => void;
  employeeType?: 'onshore' | 'offshore' | null; // Employee type for this policy
}> = ({ policy, onSave, onCancel, existingPolicies = [], availableLeaveTypes: propAvailableLeaveTypes = [], loadingTypes: propLoadingTypes = false, onRefreshLeaveTypes, employeeType = null }) => {
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
    employeeType: employeeType || null, // Set from prop or use policy's employeeType
  });

  const [isCustomType, setIsCustomType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');

  // Get existing leave types (excluding current policy if editing)
  // Filter by employeeType to only show conflicts for the current tab
  const existingTypes = existingPolicies
    .filter(p => {
      // Exclude current policy if editing
      if (p.id === policy?.id) return false;
      
      // Filter by employeeType - only show policies matching the current tab
      const policyEmployeeType = p.employeeType || p.employee_type;
      if (employeeType) {
        // If we're in a specific tab, only show policies for that tab
        return policyEmployeeType === employeeType;
      } else {
        // If no employeeType specified, only show generic policies (null)
        return !policyEmployeeType;
      }
    })
    .map(p => p.leaveType || p.leave_type || p.type)
    .filter(Boolean);

  // Base leave types that can be used to create policies
  // These are standard leave types that are always available for both onshore and offshore
  // IMPORTANT: The dropdown should show base types, not policy-specific types
  // This allows creating separate policies for onshore and offshore using the same base leave type
  // (e.g., "sick" for onshore and "sick" for offshore are separate policies)
  const baseLeaveTypes = ['annual', 'sick', 'casual', 'maternity', 'paternity', 'emergency'];
  
  // Get custom leave types from API (these are additional types beyond the base types)
  // Filter out base types to avoid duplicates
  const apiLeaveTypes = propAvailableLeaveTypes.length > 0 
    ? propAvailableLeaveTypes.filter(type => !baseLeaveTypes.includes(type.toLowerCase()))
    : [];
  
  // Combine base types with custom API types
  // Base types are always shown, allowing creation of separate onshore/offshore policies
  const availableLeaveTypes = [...baseLeaveTypes, ...apiLeaveTypes];
  
  const loadingTypes = propLoadingTypes;
  
  console.log('🔍 PolicyForm: Available leave types:', availableLeaveTypes);
  console.log('🔍 PolicyForm: EmployeeType:', employeeType);
  console.log('🔍 PolicyForm: Existing types for this employeeType:', existingTypes);

  // Convert display name to type format (lowercase, underscores)
  const toTypeFormat = (name: string): string => {
    return name.toLowerCase().replace(/\s+/g, '_');
  };

  // Handle leave type selection
  const handleLeaveTypeChange = (value: string) => {
    if (value === '__add_new__') {
      setIsCustomType(true);
      setCustomTypeName('');
      setFormData(prev => ({ ...prev, type: '' }));
    } else {
      setIsCustomType(false);
      setCustomTypeName('');
      setFormData(prev => ({ ...prev, type: value }));
    }
  };

  // Handle custom type name input
  const handleCustomTypeNameChange = (value: string) => {
    setCustomTypeName(value);
    const typeValue = toTypeFormat(value);
    setFormData(prev => ({
      ...prev,
      type: typeValue,
      // Auto-update policy name if it's empty or matches the old type
      name: prev.name === '' || prev.name === formatLeaveType(prev.type) ? value : prev.name
    }));
  };

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
                The following leave types already have policies{employeeType ? ` for ${employeeType === 'onshore' ? 'Onshore' : 'Offshore'}` : ''}: <span className="font-medium">{existingTypes.map(t => formatLeaveType(t)).join(', ')}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {employeeType 
                  ? `You can only have one policy per leave type for ${employeeType === 'onshore' ? 'onshore' : 'offshore'} employees. Choose a different type or edit the existing policy.`
                  : 'You can only have one policy per leave type. Choose a different type or edit the existing policy.'}
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
        {employeeType && (
          <div>
            <Label htmlFor="employeeType">Employee Type</Label>
            <Input
              id="employeeType"
              value={employeeType === 'onshore' ? 'Onshore' : 'Offshore'}
              disabled
              className="bg-slate-100 cursor-not-allowed"
            />
          </div>
        )}
        <div>
          <Label htmlFor="type">Leave Type</Label>
          {isCustomType ? (
            <div className="space-y-2">
              <Input
                id="customType"
                value={customTypeName}
                onChange={(e) => handleCustomTypeNameChange(e.target.value)}
                placeholder="Enter new leave type (e.g., Personal Leave, Study Leave)"
                className={existingTypes.includes(toTypeFormat(customTypeName)) 
                  ? 'border-red-300 focus:border-red-300' 
                  : 'border-slate-200 focus:border-blue-300'
                }
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCustomType(false);
                  setCustomTypeName('');
                  setFormData(prev => ({ ...prev, type: 'annual' }));
                }}
                className="text-xs text-muted-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel custom type
              </Button>
            </div>
          ) : (
            <Select
              value={formData.type || 'annual'}
              onValueChange={handleLeaveTypeChange}
            >
              <SelectTrigger 
                id="type"
                className={existingTypes.includes(formData.type) 
                  ? 'border-red-300 focus:border-red-300' 
                  : 'border-slate-200 focus:border-blue-300'
                }
              >
                <SelectValue placeholder="Select leave type">
                  {formData.type ? formatLeaveType(formData.type) : 'Select leave type'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {loadingTypes ? (
                  <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                ) : (
                  <>
                    {availableLeaveTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatLeaveType(type)}
                      </SelectItem>
                    ))}
                    <div className="border-t my-1" />
                    <SelectItem value="__add_new__" className="text-blue-600 font-medium">
                      <div className="flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Leave Type
                      </div>
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          )}
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
  className = '',
  employeeType = null
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
      if (employeeType) queryParams.employeeType = employeeType;
      
      console.log('🔍 LeavePoliciesTable: Query params:', queryParams);
      
      const response = await adminAPI.getLeavePolicies(queryParams);
      
      console.log('🔍 LeavePoliciesTable: API response:', response);
      console.log('🔍 LeavePoliciesTable: Response structure:', {
        success: response.success,
        hasData: !!response.data,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        employeeType: employeeType,
        queryParams: queryParams
      });
      
      if (response.success && response.data) {
        // Handle PaginatedResponse structure: response.data is PaginatedResponse<T>, response.data.data is T[]
        let policies: LeavePolicy[] = [];
        
        if (Array.isArray(response.data)) {
          // Direct array format (fallback)
          policies = response.data;
          console.log('🔍 LeavePoliciesTable: Using direct array format, count:', policies.length);
        } else if (response.data && typeof response.data === 'object') {
          // PaginatedResponse format: { data: T[], pagination: {...} }
          if ('data' in response.data && Array.isArray((response.data as any).data)) {
            policies = (response.data as { data: LeavePolicy[] }).data;
            console.log('🔍 LeavePoliciesTable: Using PaginatedResponse format, count:', policies.length);
          } else if ('policies' in response.data && Array.isArray((response.data as any).policies)) {
            // Alternative nested structure
            policies = (response.data as { policies: LeavePolicy[] }).policies;
            console.log('🔍 LeavePoliciesTable: Using nested policies format, count:', policies.length);
          } else {
            console.warn('🔍 LeavePoliciesTable: Unknown response.data structure:', response.data);
            policies = [];
          }
        } else {
          console.warn('🔍 LeavePoliciesTable: response.data is not an array or object:', response.data);
          policies = [];
        }
        
        // Additional client-side filtering by employeeType to ensure complete separation
        // IMPORTANT: Onshore and Offshore policies are completely separate
        // Show policies with exact employeeType match, OR null policies if no exact match exists (for migration)
        if (employeeType && (employeeType === 'onshore' || employeeType === 'offshore')) {
          const beforeFilter = policies.length;
          
          // Check if any policies have the exact employeeType match
          const hasExactMatch = policies.some(policy => {
            const policyEmployeeType = policy.employeeType || policy.employee_type;
            return policyEmployeeType === employeeType;
          });
          
          policies = policies.filter(policy => {
            // Handle both camelCase (employeeType) and snake_case (employee_type) field names
            const policyEmployeeType = policy.employeeType || policy.employee_type;
            
            if (hasExactMatch) {
              // If we have exact matches, only show those
              return policyEmployeeType === employeeType;
            } else {
              // No exact matches - show null policies for migration (they can be edited to assign employeeType)
              return policyEmployeeType === null || policyEmployeeType === undefined;
            }
          });
          
          console.log(`🔍 LeavePoliciesTable: Filtered from ${beforeFilter} to ${policies.length} ${employeeType} policies (${hasExactMatch ? 'exact match' : 'migration mode - showing null policies'})`);
        }
        
        setPolicies(policies);
        console.log('✅ LeavePoliciesTable: Final policies count:', policies.length);
        if (policies.length > 0) {
          console.log('🔍 LeavePoliciesTable: Sample policy:', policies[0]);
        }
      } else {
        console.warn('❌ LeavePoliciesTable: Response not successful:', response);
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
  }, [searchTerm, employeeType]);

  // Fetch available leave types from API
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<string[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      setLoadingTypes(true);
      console.log('🔍 LeavePoliciesTable: Fetching leave types for employeeType:', employeeType);
      // Pass employeeType to filter leave types by employee type
      const response = await adminAPI.getLeavePolicyTypes(employeeType || undefined);
      if (response.success && response.data) {
        console.log('✅ LeavePoliciesTable: Received leave types:', response.data);
        setAvailableLeaveTypes(response.data);
      } else {
        console.warn('⚠️ LeavePoliciesTable: API response not successful:', response);
        // Fallback to default types if API fails
        setAvailableLeaveTypes(['annual', 'sick', 'casual', 'maternity', 'paternity', 'emergency']);
      }
    } catch (error) {
      console.error('❌ LeavePoliciesTable: Error fetching leave types:', error);
      // Fallback to default types if API fails
      setAvailableLeaveTypes(['annual', 'sick', 'casual', 'maternity', 'paternity', 'emergency']);
    } finally {
      setLoadingTypes(false);
    }
  }, [employeeType]);

  useEffect(() => {
    fetchPolicies();
    fetchLeaveTypes();
  }, [fetchPolicies, fetchLeaveTypes]);

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
        employeeType: employeeType || policyData.employeeType || null, // Include employeeType
      };
      
      console.log('🔍 LeavePoliciesTable: Mapped data:', mappedData);
      
      let response;
      if (editingPolicy) {
        // Update existing policy
        console.log('🔍 LeavePoliciesTable: Updating policy:', editingPolicy.id);
        // Pass employeeType to ensure we only update policies matching the current tab
        response = await adminAPI.updateLeavePolicy(editingPolicy.id, mappedData, employeeType || undefined);
        console.log('🔍 LeavePoliciesTable: Update response:', response);
      } else {
        // Create new policy
        console.log('🔍 LeavePoliciesTable: Creating new policy');
        // Pass employeeType to ensure policy is created for the correct tab
        response = await adminAPI.createLeavePolicy(mappedData, employeeType || undefined);
        console.log('🔍 LeavePoliciesTable: Create response:', response);
      }
      
      // Check if response has success field (normal response) or is an error response (409 conflict)
      const isErrorResponse = !response.success || response.status === 409 || response.error;
      
      if (!isErrorResponse && response.success) {
        toast({
          title: editingPolicy ? 'Policy updated' : 'Policy created',
          description: `Leave policy has been ${editingPolicy ? 'updated' : 'created'} successfully`,
        });
        setShowForm(false);
        setEditingPolicy(null);
        // Refresh the policies list
        fetchPolicies();
        // Refresh the leave types list to include newly created types
        fetchLeaveTypes();
        // Call parent refresh if provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        // Handle error response (409 conflict or other errors)
        const errorMessage = response.message || response.error || 'Failed to save policy';
        const existingPolicyId = (response.data as any)?.existingPolicyId;
        
        // Check if it's a duplicate policy error
        if (errorMessage.includes('already exists') || response.status === 409 || response.error?.includes('already exists')) {
          toast({
            title: 'Policy Already Exists',
            description: errorMessage,
            variant: 'destructive',
            action: existingPolicyId ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Find and edit the existing policy
                  const existingPolicy = policies.find(p => p.id === existingPolicyId);
                  if (existingPolicy) {
                    setEditingPolicy(existingPolicy);
                    setShowForm(true);
                  } else {
                    // Refresh policies and try again
                    fetchPolicies().then(() => {
                      const refreshedPolicy = policies.find(p => p.id === existingPolicyId);
                      if (refreshedPolicy) {
                        setEditingPolicy(refreshedPolicy);
                        setShowForm(true);
                      }
                    });
                  }
                }}
              >
                Edit Existing Policy
              </Button>
            ) : undefined,
          });
          // Don't close the form, let user try again
          return;
        } else {
          throw new Error(errorMessage);
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
      // Pass employeeType to ensure we only deactivate policies matching the current tab
      const response = await adminAPI.toggleLeavePolicyStatus(policyId, false, employeeType || undefined);
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
      
      // Pass employeeType to ensure we only delete policies matching the current tab
      const response = await adminAPI.deleteLeavePolicy(policyId, employeeType || undefined);
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
      // Pass employeeType to ensure we only toggle policies matching the current tab
      const response = await adminAPI.toggleLeavePolicyStatus(policyId, !currentPolicy.isActive, employeeType || undefined);
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
                          <p className="font-semibold text-slate-900">
                            {formatPolicyName(policy.name || policy.leaveType || policy.leave_type) || 'Unknown Policy'}
                          </p>
                          <p className="text-sm text-slate-500">{policy.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(policy.leaveType || policy.leave_type || policy.type)}>
                          {formatLeaveType(policy.leaveType || policy.leave_type || policy.type || '')}
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
            availableLeaveTypes={availableLeaveTypes}
            loadingTypes={loadingTypes}
            onRefreshLeaveTypes={fetchLeaveTypes}
            employeeType={employeeType}
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