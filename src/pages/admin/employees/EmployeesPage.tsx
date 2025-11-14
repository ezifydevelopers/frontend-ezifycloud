import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import LeaveBalanceOverviewCard from '@/components/ui/LeaveBalanceOverviewCard';
import AdjustLeaveBalanceDialog from '@/components/dialogs/AdjustLeaveBalanceDialog';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  UserCheck,
  UserX,
  Building2,
  Globe,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Activity,
  Shield,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  Square,
  Settings,
  AlertTriangle,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User } from '@/types/auth';
import { adminAPI } from '@/lib/api/adminAPI';
import { toast } from '@/hooks/use-toast';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import EmployeeForm from './components/EmployeeForm';
import EmployeeFilters from './components/EmployeeFilters';
import LeaveBalanceModal from '@/components/admin/LeaveBalanceModal';

interface LeaveBalance {
  annual: number;
  sick: number;
  casual: number;
  emergency: number;
}

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [adjustingLeaveFor, setAdjustingLeaveFor] = useState<{ id: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: 'all',
    role: 'all',
    status: 'all', // Default to show all employees (active and inactive)
    probationStatus: 'all', // Filter by probation status
    employeeType: 'all', // Filter by employee type (onshore/offshore)
    region: 'all', // Filter by region
  });
  const [activeTab, setActiveTab] = useState<'all' | 'probation' | 'completed'>('all');
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>({});
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});
  const [showLeaveBalanceModal, setShowLeaveBalanceModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [editingProbation, setEditingProbation] = useState<User | null>(null);
  const [probationFormData, setProbationFormData] = useState({
    probationStartDate: '',
    probationEndDate: '',
    probationDuration: 90
  });
  const [resettingPasswordFor, setResettingPasswordFor] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });
  const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  
  const confirmation = useConfirmation();
  const { confirm } = confirmation;

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Refetch employees when filters change
  useEffect(() => {
    console.log('🔄 EmployeesPage: Filters changed, refetching employees:', filters);
    fetchEmployees();
  }, [filters, searchTerm, sorting, pagination.page]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      console.log('🔍 EmployeesPage: Fetching employees...');
      
      // Build query parameters, filtering out undefined values
      const queryParams: any = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder
      };
      if (searchTerm) queryParams.search = searchTerm;
      if (filters.department !== 'all') queryParams.department = filters.department;
      if (filters.role !== 'all') queryParams.role = filters.role;
      if (filters.status !== 'all') queryParams.status = filters.status;
      if (filters.probationStatus && filters.probationStatus !== 'all') queryParams.probationStatus = filters.probationStatus;
      if (filters.employeeType && filters.employeeType !== 'all') queryParams.employeeType = filters.employeeType;
      if (filters.region && filters.region !== 'all') queryParams.region = filters.region;
      
      console.log('🔍 EmployeesPage: Query params:', queryParams);
      
      const response = await adminAPI.getEmployees(queryParams);
      
      console.log('🔍 EmployeesPage: API response:', response);
      
      if (response.success && response.data) {
        const employees = Array.isArray(response.data) ? response.data : response.data.data || [];
        setEmployees(employees);
        
        // Update pagination if available
        if (response.data && typeof response.data === 'object' && 'pagination' in response.data) {
          setPagination((response.data as any).pagination);
        }
        
        console.log('✅ EmployeesPage: Loaded employees:', employees.length);
        console.log('📊 EmployeesPage: Employee status breakdown:', {
          total: employees.length,
          active: employees.filter(emp => emp.isActive).length,
          inactive: employees.filter(emp => !emp.isActive).length,
          employees: employees.map(emp => ({ name: emp.name, isActive: emp.isActive }))
        });
      } else {
        throw new Error((response as any).message || 'Failed to fetch employees');
      }
    } catch (error: unknown) {
      console.error('❌ EmployeesPage: Error fetching employees:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch employees',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async (employeeId: string) => {
    if (leaveBalances[employeeId] || loadingBalances[employeeId]) {
      return; // Already loaded or loading
    }

    try {
      setLoadingBalances(prev => ({ ...prev, [employeeId]: true }));
      const response = await adminAPI.getEmployeeLeaveBalance(employeeId);
      
      if (response.success && response.data) {
        setLeaveBalances(prev => ({ ...prev, [employeeId]: response.data as any }));
      }
    } catch (error) {
      console.error('Error fetching leave balance for employee:', employeeId, error);
    } finally {
      setLoadingBalances(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const handleResetPassword = async () => {
    if (!resettingPasswordFor || !newPassword || newPassword.length < 6) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      setResettingPassword(true);
      const response = await adminAPI.resetEmployeePassword(resettingPasswordFor.id, newPassword);
      
      if (response.success) {
        toast({
          title: 'Password Reset Successful',
          description: `Password has been reset for ${resettingPasswordFor.name}. They will need to use this new password to log in.`,
        });
        setResettingPasswordFor(null);
        setNewPassword('');
        setShowPassword(false);
      } else {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const handlePermanentlyDeleteEmployee = async (employeeId: string, employeeName: string) => {
    const confirmed = await confirm({
      title: '⚠️ PERMANENT DELETE - Cannot Be Undone',
      description: `Are you absolutely sure you want to PERMANENTLY DELETE ${employeeName}? This action will:\n\n• Permanently remove the employee from the database\n• Delete all leave requests and history\n• Delete all leave balances\n• Delete all attendance records\n• Delete all salary records\n• Remove all associated data\n\n⚠️ THIS ACTION CANNOT BE UNDONE!`,
      confirmText: 'Yes, Delete Permanently',
      cancelText: 'Cancel',
      variant: 'destructive',
      icon: <AlertTriangle className="h-6 w-6 text-red-600" />
    });

    if (!confirmed) return;

    try {
      console.log('🔍 EmployeesPage: Permanently deleting employee:', employeeId);
      
      // Show loading state
      toast({
        title: 'Permanently deleting employee...',
        description: 'This may take a moment. All data will be permanently removed.',
        variant: 'destructive',
      });
      
      const response = await adminAPI.permanentlyDeleteEmployee(employeeId);
      
      console.log('🔍 EmployeesPage: Permanent delete response:', response);
      
      if (response.success) {
        toast({
          title: 'Employee Permanently Deleted',
          description: response.message || `${employeeName} has been permanently deleted from the database.`,
          variant: 'default',
        });
        
        // Refresh the list
        await fetchEmployees();
        
        // Also refresh dashboard data if available
        if ((window as any).triggerGlobalRefresh) {
          (window as any).triggerGlobalRefresh();
        }
      } else {
        throw new Error(response.message || 'Failed to permanently delete employee');
      }
    } catch (error: unknown) {
      console.error('❌ EmployeesPage: Error permanently deleting employee:', error);
      
      let errorMessage = 'Failed to permanently delete employee';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as Record<string, unknown>;
        if (errorObj.name === 'TypeError' && typeof errorObj.message === 'string' && errorObj.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (errorObj.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (errorObj.status === 403) {
          errorMessage = 'You do not have permission to permanently delete employees.';
        } else if (errorObj.status === 404) {
          errorMessage = 'Employee not found.';
        } else if (typeof errorObj.status === 'number' && errorObj.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    const confirmed = await confirm({
      title: 'Delete Employee',
      description: `Are you sure you want to delete ${employeeName}? This will permanently deactivate the employee and remove their access to the system. Their data and leave history will be preserved for record-keeping purposes.`,
      confirmText: 'Delete',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      console.log('🔍 EmployeesPage: Deleting employee:', employeeId);
      
      // Show loading state
      toast({
        title: 'Deleting employee...',
        description: 'Please wait while we process your request.',
      });
      
      const response = await adminAPI.deleteEmployee(employeeId);
      
      console.log('🔍 EmployeesPage: Delete response:', response);
      
      if (response.success) {
        toast({
          title: 'Employee deleted successfully',
          description: response.message || `${employeeName} has been deleted successfully. Their data is preserved but they can no longer access the system.`,
        });
        
        // Refresh the list to show updated status
        await fetchEmployees();
        
        // Also refresh dashboard data if available
        if ((window as any).triggerGlobalRefresh) {
          (window as any).triggerGlobalRefresh();
        }
      } else {
        // Check if employee is already deactivated
        if (response.message && response.message.includes('already deactivated')) {
          toast({
            title: 'Employee Already Deactivated',
            description: `${employeeName} is already deactivated. You can reactivate them using the "Activate" option in the actions menu.`,
            variant: 'default',
          });
          // Refresh to show current status
          await fetchEmployees();
        } else {
          throw new Error(response.message || 'Failed to delete employee');
        }
      }
    } catch (error: unknown) {
      console.error('❌ EmployeesPage: Error deleting employee:', error);
      
      // Check if it's a network error or API error
      let errorMessage = 'Failed to delete employee';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as Record<string, unknown>;
        if (errorObj.name === 'TypeError' && typeof errorObj.message === 'string' && errorObj.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (errorObj.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (errorObj.status === 403) {
          errorMessage = 'You do not have permission to delete employees.';
        } else if (errorObj.status === 404) {
          errorMessage = 'Employee not found.';
        } else if (typeof errorObj.status === 'number' && errorObj.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Bulk Operations
  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedEmployees.length === 0) return;

    try {
      setBulkActionLoading(true);
      const response = await adminAPI.bulkUpdateEmployeeStatus(selectedEmployees, isActive);
      
      toast({
        title: 'Success',
        description: `Bulk status update completed: ${response.data.updated} updated, ${response.data.failed} failed`,
      });
      
      setSelectedEmployees([]);
      setShowBulkActions(false);
      fetchEmployees();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to bulk update employee status',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };


  const handleBulkDepartmentUpdate = async (department: string) => {
    if (selectedEmployees.length === 0) return;

    try {
      setBulkActionLoading(true);
      const response = await adminAPI.bulkUpdateEmployeeDepartment(selectedEmployees, department);
      
      toast({
        title: 'Success',
        description: `Bulk department update completed: ${response.data.updated} updated, ${response.data.failed} failed`,
      });
      
      setSelectedEmployees([]);
      setShowBulkActions(false);
      fetchEmployees();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to bulk update employee department',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExportEmployees = async () => {
    try {
      const blob = await adminAPI.exportEmployeesToCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Success',
        description: 'Employee data exported successfully',
      });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export employees',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (employee: User) => {
    try {
      console.log('🔍 EmployeesPage: Toggling status for employee:', employee.id);
      
      const response = await adminAPI.toggleEmployeeStatus(employee.id, !employee.isActive);
      
      console.log('🔍 EmployeesPage: Toggle status response:', response);
      
      if (response.success) {
        toast({
          title: 'Status updated',
          description: `Employee ${employee.isActive ? 'deactivated' : 'activated'}`,
        });
        fetchEmployees(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to update employee status');
      }
    } catch (error: unknown) {
      console.error('❌ EmployeesPage: Error toggling status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update employee status',
        variant: 'destructive',
      });
    }
  };

  const openLeaveBalanceModal = (employee: User) => {
    setSelectedEmployee(employee);
    setShowLeaveBalanceModal(true);
  };

  // Calculate probation status helper function
  const calculateProbationStatus = (employee: User): { status: string | null; endDate: Date | null } => {
    if (employee.role !== 'employee') {
      return { status: null, endDate: null };
    }
    if (employee.probationStatus) {
      return { 
        status: employee.probationStatus, 
        endDate: employee.probationEndDate ? new Date(employee.probationEndDate) : null 
      };
    }
    const startDate = employee.joinDate ? new Date(employee.joinDate) : new Date(employee.createdAt);
    const today = new Date();
    const defaultProbationDuration = employee.probationDuration || 90;
    const probationEndDate = new Date(startDate.getTime() + defaultProbationDuration * 24 * 60 * 60 * 1000);
    if (today < probationEndDate) {
      return { status: 'active', endDate: probationEndDate };
    } else {
      return { status: 'completed', endDate: probationEndDate };
    }
  };

  // Calculate probation statistics (including auto-calculated status)
  const probationStats = {
    inProbation: employees.filter(emp => {
      if (emp.role !== 'employee') return false;
      const probationInfo = calculateProbationStatus(emp);
      const status = probationInfo.status || emp.probationStatus;
      return status === 'active' || status === 'extended';
    }).length,
    completed: employees.filter(emp => {
      if (emp.role !== 'employee') return false;
      const probationInfo = calculateProbationStatus(emp);
      const status = probationInfo.status || emp.probationStatus;
      return status === 'completed';
    }).length,
    terminated: employees.filter(emp => 
      emp.role === 'employee' && emp.probationStatus === 'terminated'
    ).length,
    noProbation: employees.filter(emp => 
      emp.role === 'employee' && !emp.probationStatus && !calculateProbationStatus(emp).status
    ).length,
  };

  const filteredEmployees = (employees || []).filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filters.department === 'all' || !filters.department || employee.department === filters.department;
    const matchesRole = filters.role === 'all' || !filters.role || employee.role === filters.role;
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'active' && employee.isActive) ||
                         (filters.status === 'inactive' && !employee.isActive);
    
    // Filter by active tab (probation status)
    let matchesProbationTab = true;
    if (activeTab === 'probation') {
      // Show employees in active or extended probation (including auto-calculated)
      const probationInfo = calculateProbationStatus(employee);
      const status = probationInfo.status || employee.probationStatus;
      matchesProbationTab = employee.role === 'employee' && 
        (status === 'active' || status === 'extended');
    } else if (activeTab === 'completed') {
      // Show employees who completed probation (including auto-calculated)
      const probationInfo = calculateProbationStatus(employee);
      const status = probationInfo.status || employee.probationStatus;
      matchesProbationTab = employee.role === 'employee' && status === 'completed';
    }
    // 'all' tab shows everyone
    
    const matches = matchesSearch && matchesDepartment && matchesRole && matchesStatus && matchesProbationTab;
    
    return matches;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      'Engineering': 'bg-blue-100 text-blue-800 border-blue-200',
      'Marketing': 'bg-purple-100 text-purple-800 border-purple-200',
      'HR': 'bg-pink-100 text-pink-800 border-pink-200',
      'Sales': 'bg-green-100 text-green-800 border-green-200',
      'Finance': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Operations': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[department as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEmployeeTypeColor = (employeeType?: string | null) => {
    if (!employeeType) {
      return 'bg-slate-100 text-slate-600 border-slate-200';
    }
    switch (employeeType.toLowerCase()) {
      case 'onshore':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'offshore':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getProbationStatusColor = (status?: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'extended':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'terminated':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProbationStatusLabel = (status?: string | null) => {
    switch (status) {
      case 'active':
        return 'In Probation';
      case 'completed':
        return 'Probation Completed';
      case 'extended':
        return 'Probation Extended';
      case 'terminated':
        return 'Probation Terminated';
      default:
        return 'N/A';
    }
  };


  // Calculate employee tenure (days, months, years)
  const calculateTenure = (employee: User): { years: number; months: number; days: number; display: string } => {
    const startDate = employee.joinDate 
      ? new Date(employee.joinDate) 
      : new Date(employee.createdAt);
    const today = new Date();
    
    let years = today.getFullYear() - startDate.getFullYear();
    let months = today.getMonth() - startDate.getMonth();
    let days = today.getDate() - startDate.getDate();
    
    // Adjust for negative days
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Build display string
    let display = '';
    if (years > 0) {
      display += `${years} year${years !== 1 ? 's' : ''}`;
      if (months > 0) {
        display += `, ${months} month${months !== 1 ? 's' : ''}`;
      }
    } else if (months > 0) {
      display += `${months} month${months !== 1 ? 's' : ''}`;
      if (days > 0) {
        display += `, ${days} day${days !== 1 ? 's' : ''}`;
      }
    } else {
      display = `${days} day${days !== 1 ? 's' : ''}`;
    }
    
    return { years, months, days, display };
  };

  const handleCompleteProbation = async (employeeId: string) => {
    try {
      await adminAPI.completeProbation(employeeId);
      toast({
        title: 'Success',
        description: 'Employee probation completed successfully.',
      });
      fetchEmployees();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete probation',
        variant: 'destructive',
      });
    }
  };

  const handleExtendProbation = async (employeeId: string, additionalDays: number) => {
    try {
      await adminAPI.extendProbation(employeeId, additionalDays);
      toast({
        title: 'Success',
        description: `Probation extended by ${additionalDays} days.`,
      });
      fetchEmployees();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to extend probation',
        variant: 'destructive',
      });
    }
  };

  const handleTerminateProbation = async (employeeId: string) => {
    const confirmed = await confirm({
      title: 'Terminate Probation',
      description: 'Are you sure you want to terminate this employee\'s probation? This will deactivate the employee.',
    });

    if (!confirmed) return;

    try {
      await adminAPI.terminateProbation(employeeId);
      toast({
        title: 'Success',
        description: 'Employee probation terminated.',
      });
      fetchEmployees();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to terminate probation',
        variant: 'destructive',
      });
    }
  };

  const handleEditProbation = (employee: User) => {
    setEditingProbation(employee);
    setProbationFormData({
      probationStartDate: employee.probationStartDate 
        ? new Date(employee.probationStartDate).toISOString().split('T')[0]
        : '',
      probationEndDate: employee.probationEndDate 
        ? new Date(employee.probationEndDate).toISOString().split('T')[0]
        : '',
      probationDuration: employee.probationDuration || 90
    });
  };

  const handleUpdateProbation = async () => {
    if (!editingProbation) return;

    try {
      await adminAPI.updateProbation(editingProbation.id, {
        probationStartDate: probationFormData.probationStartDate || undefined,
        probationEndDate: probationFormData.probationEndDate || undefined,
        probationDuration: probationFormData.probationDuration
      });
      toast({
        title: 'Success',
        description: 'Probation updated successfully.',
      });
      setEditingProbation(null);
      fetchEmployees();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update probation',
        variant: 'destructive',
      });
    }
  };

  // Render employee table function
  const renderEmployeeTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite" aria-label="Loading employees">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (filteredEmployees.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center" role="status" aria-live="polite">
          <div className="p-4 bg-slate-100 rounded-full mb-4">
            <Users className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No employees found</h3>
          <p className="text-slate-600 mb-4">
            {searchTerm || filters.department !== 'all' || filters.role !== 'all' || filters.status !== 'all'
              ? 'Try adjusting your search or filters to find employees.'
              : 'Get started by adding your first employee to the system.'
            }
          </p>
          {!searchTerm && filters.department === 'all' && filters.role === 'all' && filters.status === 'all' && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              aria-label="Add first employee to the system"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Employee
            </Button>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0" role="region" aria-label="Employee table with horizontal scroll">
          <Table role="table" aria-label="Employee directory table" className="min-w-full">
            <TableHeader role="rowgroup">
              <TableRow className="border-slate-200/50" role="row">
                <TableHead className="w-12" role="columnheader">
                  <Checkbox
                    checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    aria-label="Select all employees"
                  />
                </TableHead>
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-slate-50"
                  onClick={() => {
                    const newOrder = sorting.sortBy === 'name' && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
                    setSorting({ sortBy: 'name', sortOrder: newOrder });
                    fetchEmployees();
                  }}
                  role="columnheader"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && (() => {
                    const newOrder = sorting.sortBy === 'name' && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
                    setSorting({ sortBy: 'name', sortOrder: newOrder });
                    fetchEmployees();
                  })()}
                  aria-label="Sort by employee name"
                >
                  <div className="flex items-center gap-2">
                    Employee
                    {sorting.sortBy === 'name' && (
                      <span className="text-xs">
                        {sorting.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-slate-50"
                  onClick={() => {
                    const newOrder = sorting.sortBy === 'department' && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
                    setSorting({ sortBy: 'department', sortOrder: newOrder });
                    fetchEmployees();
                  }}
                  role="columnheader"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && (() => {
                    const newOrder = sorting.sortBy === 'department' && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
                    setSorting({ sortBy: 'department', sortOrder: newOrder });
                    fetchEmployees();
                  })()}
                  aria-label="Sort by department"
                >
                  <div className="flex items-center gap-2">
                    Department
                    {sorting.sortBy === 'department' && (
                      <span className="text-xs">
                        {sorting.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-slate-50"
                  onClick={() => {
                    const newOrder = sorting.sortBy === 'role' && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
                    setSorting({ sortBy: 'role', sortOrder: newOrder });
                    fetchEmployees();
                  }}
                  role="columnheader"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && (() => {
                    const newOrder = sorting.sortBy === 'role' && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
                    setSorting({ sortBy: 'role', sortOrder: newOrder });
                    fetchEmployees();
                  })()}
                  aria-label="Sort by role"
                >
                  <div className="flex items-center gap-2">
                    Role
                    {sorting.sortBy === 'role' && (
                      <span className="text-xs">
                        {sorting.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="font-semibold" role="columnheader">Status</TableHead>
                <TableHead className="font-semibold" role="columnheader">Employee Type</TableHead>
                <TableHead className="font-semibold" role="columnheader">Tenure</TableHead>
                <TableHead className="font-semibold" role="columnheader">Probation</TableHead>
                <TableHead className="font-semibold" role="columnheader">Leave Balance</TableHead>
                <TableHead className="font-semibold" role="columnheader">Contact</TableHead>
                <TableHead className="font-semibold" role="columnheader">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody role="rowgroup">
              {filteredEmployees.map((employee, index) => (
                <TableRow 
                  key={employee.id} 
                  className="group hover:bg-slate-50/50 transition-colors duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                  role="row"
                  aria-label={`Employee: ${employee.name}`}
                >
                  <TableCell role="cell">
                    <Checkbox
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      aria-label={`Select ${employee.name}`}
                    />
                  </TableCell>
                  <TableCell role="cell">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm" aria-label={`Avatar for ${employee.name}`}>
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">{employee.name}</p>
                        <p className="text-sm text-slate-500">ID: {employee.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell role="cell">
                    <Badge className={getDepartmentColor(employee.department || '')}>
                      {employee.department}
                    </Badge>
                  </TableCell>
                  <TableCell role="cell">
                    <Badge className={getRoleColor(employee.role)}>
                      {employee.role}
                    </Badge>
                  </TableCell>
                  <TableCell role="cell">
                    <Badge className={getStatusColor(employee.isActive)}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell role="cell">
                    <Badge className={getEmployeeTypeColor(employee.employeeType)}>
                      <div className="flex items-center gap-1.5">
                        {employee.employeeType === 'onshore' ? (
                          <Globe className="h-3 w-3" />
                        ) : employee.employeeType === 'offshore' ? (
                          <Building2 className="h-3 w-3" />
                        ) : null}
                        <span>
                          {employee.employeeType ? (employee.employeeType === 'onshore' ? 'Onshore' : 'Offshore') : 'N/A'}
                        </span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell role="cell">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">
                        {calculateTenure(employee).display}
                      </p>
                      <p className="text-xs text-slate-500">
                        {employee.joinDate 
                          ? new Date(employee.joinDate).toLocaleDateString()
                          : new Date(employee.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell role="cell">
                    {employee.role === 'employee' ? (() => {
                      const probationInfo = calculateProbationStatus(employee);
                      const displayStatus = probationInfo.status || employee.probationStatus;
                      const displayEndDate = probationInfo.endDate || (employee.probationEndDate ? new Date(employee.probationEndDate) : null);
                      
                      return (
                        <div className="space-y-1">
                          <Badge className={getProbationStatusColor(displayStatus)}>
                            {getProbationStatusLabel(displayStatus)}
                          </Badge>
                          {(displayStatus === 'active' || displayStatus === 'extended') && displayEndDate ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              Ends: {displayEndDate.toLocaleDateString()}
                            </p>
                          ) : displayStatus === 'completed' && employee.probationCompletedAt ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              Completed: {new Date(employee.probationCompletedAt).toLocaleDateString()}
                            </p>
                          ) : displayStatus === 'completed' && displayEndDate ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              Ended: {displayEndDate.toLocaleDateString()}
                            </p>
                          ) : null}
                        </div>
                      );
                    })() : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell role="cell">
                    <div className="w-48">
                      {loadingBalances[employee.id] ? (
                        <div className="flex items-center justify-center py-2" aria-label="Loading leave balance">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      ) : leaveBalances[employee.id] ? (
                        <LeaveBalanceOverviewCard 
                          leaveBalance={{
                            annual: {
                              total: (leaveBalances[employee.id] as any)?.leaveBalance?.annual?.total || 0,
                              used: (leaveBalances[employee.id] as any)?.leaveBalance?.annual?.used || 0,
                              remaining: (leaveBalances[employee.id] as any)?.leaveBalance?.annual?.remaining || 0
                            },
                            sick: {
                              total: (leaveBalances[employee.id] as any)?.leaveBalance?.sick?.total || 0,
                              used: (leaveBalances[employee.id] as any)?.leaveBalance?.sick?.used || 0,
                              remaining: (leaveBalances[employee.id] as any)?.leaveBalance?.sick?.remaining || 0
                            },
                            casual: {
                              total: (leaveBalances[employee.id] as any)?.leaveBalance?.casual?.total || 0,
                              used: (leaveBalances[employee.id] as any)?.leaveBalance?.casual?.used || 0,
                              remaining: (leaveBalances[employee.id] as any)?.leaveBalance?.casual?.remaining || 0
                            },
                            emergency: {
                              total: (leaveBalances[employee.id] as any)?.leaveBalance?.emergency?.total || 0,
                              used: (leaveBalances[employee.id] as any)?.leaveBalance?.emergency?.used || 0,
                              remaining: (leaveBalances[employee.id] as any)?.leaveBalance?.emergency?.remaining || 0
                            }
                          }}
                          title=""
                          description=""
                        />
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openLeaveBalanceModal(employee)}
                          className="text-xs"
                          aria-label={`View leave balance for ${employee.name}`}
                        >
                          View Balance
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell role="cell">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-sm text-slate-600">
                        <Mail className="h-3 w-3" aria-label="Email" />
                        <span>{employee.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell role="cell">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          aria-label={`Actions for ${employee.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-white/20">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingEmployee(employee);
                            setShowForm(true);
                          }}
                          className="hover:bg-blue-50 hover:text-blue-700"
                          aria-label={`Edit ${employee.name}`}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setAdjustingLeaveFor({ id: employee.id, name: employee.name });
                          }}
                          className="hover:bg-green-50 hover:text-green-700"
                          aria-label={`Adjust leave balance for ${employee.name}`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Adjust Leave Balance
                        </DropdownMenuItem>
                        {employee.role === 'employee' && (employee.probationStatus === 'active' || employee.probationStatus === 'extended') && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleCompleteProbation(employee.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Complete Probation
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditProbation(employee)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Probation
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const days = prompt('Enter additional days to extend probation:');
                                if (days && !isNaN(Number(days)) && Number(days) > 0) {
                                  handleExtendProbation(employee.id, Number(days));
                                }
                              }}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Extend Probation
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTerminateProbation(employee.id)}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Terminate Probation
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => setResettingPasswordFor(employee)}
                          className="hover:bg-blue-50 hover:text-blue-700"
                          aria-label={`Reset password for ${employee.name}`}
                        >
                          <Lock className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(employee)}
                          className="hover:bg-green-50 hover:text-green-700"
                          aria-label={`${employee.isActive ? 'Deactivate' : 'Activate'} ${employee.name}`}
                        >
                          {employee.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        {employee.isActive && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                              className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 focus:text-orange-700 focus:bg-orange-50"
                              aria-label={`Deactivate ${employee.name}`}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate Employee
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePermanentlyDeleteEmployee(employee.id, employee.name)}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 focus:text-red-700 focus:bg-red-50"
                              aria-label={`Permanently delete ${employee.name}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Permanently Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {!employee.isActive && (
                          <>
                            <DropdownMenuItem
                              disabled
                              className="text-gray-400 cursor-not-allowed"
                              aria-label={`${employee.name} is already deactivated`}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Already Deactivated
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePermanentlyDeleteEmployee(employee.id, employee.name)}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 focus:text-red-700 focus:bg-red-50"
                              aria-label={`Permanently delete ${employee.name}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Permanently Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-600" role="status" aria-live="polite">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalItems)} of {pagination.totalItems} employees
            </div>
            <div className="flex items-center gap-2" role="navigation" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                  fetchEmployees();
                }}
                disabled={!pagination.hasPrev}
                aria-label="Go to previous page"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setPagination(prev => ({ ...prev, page: pageNum }));
                        fetchEmployees();
                      }}
                      className="w-8 h-8 p-0"
                      aria-label={`Go to page ${pageNum}`}
                      aria-current={pagination.page === pageNum ? "page" : undefined}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                  fetchEmployees();
                }}
                disabled={!pagination.hasNext}
                aria-label="Go to next page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  // Statistics with probation data
  const stats = [
    {
      title: 'Total Employees',
      value: employees.length,
      description: 'Active workforce',
      icon: Users,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: 'Active Employees',
      value: employees.filter(emp => emp.isActive).length,
      description: 'Currently working',
      icon: UserCheck,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      trend: { value: 8.3, isPositive: true },
    },
    {
      title: 'In Probation',
      value: probationStats.inProbation,
      description: 'Active/Extended probation',
      icon: Clock,
      color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    },
    {
      title: 'Permanent Employees',
      value: probationStats.completed,
      description: 'Completed probation',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-green-500 to-teal-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" role="main" aria-label="Employee Management">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl" role="banner">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Employee Management
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Manage your organization's workforce and track employee information.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`absolute inset-0 ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                  <stat.icon className={`h-6 w-6 text-white`} />
                </div>
              </div>
              {stat.trend && (
                <div className="flex items-center mt-4">
                  {stat.trend.isPositive ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend.value}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Controls */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Employee Management</h3>
                    <p className="text-sm text-slate-600">Search and filter your team members</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate('/admin/settings', { state: { tab: 'probation' } })}
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    aria-label="Manage probation settings"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Probation Settings
                  </Button>
                  <Button
                    onClick={fetchEmployees}
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    disabled={loading}
                    aria-label="Refresh employee list"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleExportEmployees}
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    aria-label="Export employees to CSV"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    aria-label="Add new employee"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </div>
              </div>

              {/* Bulk Actions Toolbar */}
              {selectedEmployees.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4" role="toolbar" aria-label="Bulk actions for selected employees">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                        <Settings className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
                        </h4>
                        <p className="text-sm text-slate-600">Choose an action to perform on selected employees</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleBulkStatusUpdate(true)}
                        disabled={bulkActionLoading}
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-700 hover:bg-green-50"
                        aria-label="Activate selected employees"
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activate
                      </Button>
                      <Button
                        onClick={() => handleBulkStatusUpdate(false)}
                        disabled={bulkActionLoading}
                        variant="outline"
                        size="sm"
                        className="border-orange-200 text-orange-700 hover:bg-orange-50"
                        aria-label="Deactivate selected employees"
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </Button>
                      <Select onValueChange={handleBulkDepartmentUpdate}>
                        <SelectTrigger className="w-40" aria-label="Change department for selected employees">
                          <SelectValue placeholder="Change Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Human Resources">Human Resources</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Customer Support">Customer Support</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          setSelectedEmployees([]);
                          setShowBulkActions(false);
                        }}
                        variant="ghost"
                        size="sm"
                        aria-label="Cancel bulk actions"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end" role="search" aria-label="Search and filter employees">
                <div className="w-full lg:w-80">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 h-11"
                      aria-label="Search employees by name or email"
                      role="searchbox"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <EmployeeFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg" role="region" aria-label="Employee directory">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xl">Employees ({filteredEmployees.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'probation' | 'completed')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Employees
                <Badge variant="secondary" className="ml-2">{employees.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="probation" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                In Probation
                <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                  {probationStats.inProbation}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Permanent Employees
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                  {probationStats.completed}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {renderEmployeeTable()}
            </TabsContent>

            <TabsContent value="probation" className="mt-0">
              {filteredEmployees.length === 0 && !loading ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Employees in Probation</h3>
                  <p className="text-muted-foreground">All employees have completed their probation period.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <h3 className="font-semibold text-yellow-900">Employees in Probation</h3>
                    </div>
                    <p className="text-sm text-yellow-800">
                      These employees are currently in their probation period. Monitor their performance and complete probation when ready.
                    </p>
                  </div>
                  {renderEmployeeTable()}
                </>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              {filteredEmployees.length === 0 && !loading ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Permanent Employees</h3>
                  <p className="text-muted-foreground">No employees have completed their probation period yet.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">Permanent Employees</h3>
                    </div>
                    <p className="text-sm text-green-800">
                      These employees have successfully completed their probation period and are now permanent employees.
                    </p>
                  </div>
                  {renderEmployeeTable()}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
        </div>
      </div>

      {/* Employee Form Dialog */}
      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          onClose={() => {
            setShowForm(false);
            setEditingEmployee(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingEmployee(null);
            fetchEmployees();
          }}
        />
      )}

      {/* Adjust Leave Balance Dialog */}
      <AdjustLeaveBalanceDialog
        open={!!adjustingLeaveFor}
        onOpenChange={(open) => {
          if (!open) {
            setAdjustingLeaveFor(null);
          }
        }}
        employeeId={adjustingLeaveFor?.id || ''}
        employeeName={adjustingLeaveFor?.name || ''}
        onSuccess={() => {
          setAdjustingLeaveFor(null);
          fetchEmployees();
        }}
      />

      {/* Leave Balance Modal */}
      <LeaveBalanceModal
        isOpen={showLeaveBalanceModal}
        onClose={() => {
          setShowLeaveBalanceModal(false);
          setSelectedEmployee(null);
        }}
        userId={selectedEmployee?.id}
        userName={selectedEmployee?.name}
        fetchLeaveBalanceFn={adminAPI.getUserLeaveBalance}
        onAdjustLeave={() => {
          // Refresh employee list after leave adjustment
          fetchEmployees();
        }}
      />

      {/* Reset Password Dialog */}
      <Dialog open={!!resettingPasswordFor} onOpenChange={(open) => {
        if (!open) {
          setResettingPasswordFor(null);
          setNewPassword('');
          setShowPassword(false);
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for {resettingPasswordFor?.name} ({resettingPasswordFor?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Password must be at least 6 characters long. The employee will need to use this password to log in.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResettingPasswordFor(null);
                setNewPassword('');
                setShowPassword(false);
              }}
              disabled={resettingPassword}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resettingPassword || !newPassword || newPassword.length < 6}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {resettingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Probation Dialog */}
      <Dialog open={!!editingProbation} onOpenChange={(open) => !open && setEditingProbation(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Probation</DialogTitle>
            <DialogDescription>
              Update probation dates and duration for {editingProbation?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="probationStartDate">Start Date</Label>
              <Input
                id="probationStartDate"
                type="date"
                value={probationFormData.probationStartDate}
                onChange={(e) => setProbationFormData({ ...probationFormData, probationStartDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probationDuration">Duration (days)</Label>
              <Input
                id="probationDuration"
                type="number"
                min="1"
                value={probationFormData.probationDuration}
                onChange={(e) => {
                  const duration = parseInt(e.target.value, 10);
                  setProbationFormData({ 
                    ...probationFormData, 
                    probationDuration: duration || 90
                  });
                  // Auto-calculate end date if start date is set
                  if (probationFormData.probationStartDate && duration) {
                    const startDate = new Date(probationFormData.probationStartDate);
                    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
                    setProbationFormData(prev => ({
                      ...prev,
                      probationEndDate: endDate.toISOString().split('T')[0]
                    }));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probationEndDate">End Date</Label>
              <Input
                id="probationEndDate"
                type="date"
                value={probationFormData.probationEndDate}
                onChange={(e) => setProbationFormData({ ...probationFormData, probationEndDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProbation(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProbation}>
              Update Probation
            </Button>
          </DialogFooter>
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

export default EmployeesPage;
