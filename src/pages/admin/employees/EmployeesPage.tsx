import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import LeaveBalanceOverviewCard from '@/components/ui/LeaveBalanceOverviewCard';
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
import { User } from '@/types/auth';
import { adminAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useConfirmation } from '@/hooks/useConfirmation';
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
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: 'all',
    role: 'all',
    status: 'all', // Default to show all employees (active and inactive)
  });
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>({});
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});
  const [showLeaveBalanceModal, setShowLeaveBalanceModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
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
  
  const { confirm } = useConfirmation();

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

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    const confirmed = await confirm({
      title: 'Deactivate Employee',
      description: `Are you sure you want to deactivate ${employeeName}? This will mark them as inactive but preserve their data and leave history.`,
      confirmText: 'Deactivate',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      console.log('🔍 EmployeesPage: Deactivating employee:', employeeId);
      
      // Show loading state
      toast({
        title: 'Deactivating employee...',
        description: 'Please wait while we process your request.',
      });
      
      const response = await adminAPI.deleteEmployee(employeeId);
      
      console.log('🔍 EmployeesPage: Delete response:', response);
      
      if (response.success) {
        toast({
          title: 'Employee deactivated successfully',
          description: response.message || `${employeeName} has been deactivated successfully. Their data is preserved but they can no longer access the system.`,
        });
        
        // Refresh the list to show updated status
        await fetchEmployees();
        
        // Also refresh dashboard data if available
        if ((window as any).triggerGlobalRefresh) {
          (window as any).triggerGlobalRefresh();
        }
      } else {
        throw new Error(response.message || 'Failed to deactivate employee');
      }
    } catch (error: unknown) {
      console.error('❌ EmployeesPage: Error deactivating employee:', error);
      
      // Check if it's a network error or API error
      let errorMessage = 'Failed to deactivate employee';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as Record<string, unknown>;
        if (errorObj.name === 'TypeError' && typeof errorObj.message === 'string' && errorObj.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (errorObj.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (errorObj.status === 403) {
          errorMessage = 'You do not have permission to deactivate employees.';
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

  const filteredEmployees = (employees || []).filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filters.department === 'all' || !filters.department || employee.department === filters.department;
    const matchesRole = filters.role === 'all' || !filters.role || employee.role === filters.role;
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'active' && employee.isActive) ||
                         (filters.status === 'inactive' && !employee.isActive);
    
    const matches = matchesSearch && matchesDepartment && matchesRole && matchesStatus;
    
    // Debug logging for status filtering
    if (filters.status !== 'all') {
      console.log(`🔍 Employee ${employee.name}: isActive=${employee.isActive}, statusFilter=${filters.status}, matchesStatus=${matchesStatus}, matches=${matches}`);
    }
    
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

  // Mock statistics
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
      title: 'Departments',
      value: new Set(employees.map(emp => emp.department)).size,
      description: 'Different teams',
      icon: Building2,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    },
    {
      title: 'New This Month',
      value: 8,
      description: 'Recent hires',
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
      trend: { value: 15.2, isPositive: true },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" role="main" aria-label="Employee Management">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          {loading ? (
            <div className="flex items-center justify-center py-12" role="status" aria-live="polite" aria-label="Loading employees">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredEmployees.length === 0 ? (
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
          ) : (
            <div className="overflow-x-auto" role="region" aria-label="Employee table with horizontal scroll">
              <Table role="table" aria-label="Employee directory table">
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

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
        </CardContent>
      </Card>

      {/* Employee Form Modal */}
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
          aria-label={editingEmployee ? "Edit employee form" : "Add new employee form"}
        />
      )}

      {/* Leave Balance Modal */}
      <LeaveBalanceModal
        isOpen={showLeaveBalanceModal}
        onClose={() => {
          setShowLeaveBalanceModal(false);
          setSelectedEmployee(null);
        }}
        userId={selectedEmployee?.id}
        userName={selectedEmployee?.name}
        aria-label="Employee leave balance details"
      />
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;