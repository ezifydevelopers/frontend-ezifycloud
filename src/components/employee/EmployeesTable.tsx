import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
import ActionsDropdown, { 
  createEditAction, 
  createDeleteAction, 
  createToggleStatusAction 
} from '@/components/ui/ActionsDropdown';
import EmployeeForm from '@/pages/admin/employees/components/EmployeeForm';

interface LeaveBalance {
  annual: number;
  sick: number;
  casual: number;
  emergency: number;
}

export interface EmployeesTableProps {
  showStats?: boolean;
  showFilters?: boolean;
  showCreateButton?: boolean;
  showExport?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const EmployeesTable: React.FC<EmployeesTableProps> = ({
  showStats = true,
  showFilters = true,
  showCreateButton = true,
  showExport = true,
  onRefresh,
  className = ''
}) => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: 'all',
    role: 'all',
    status: 'all',
  });
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>({});
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
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

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams: Record<string, unknown> = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder
      };

      // Only add filters if they're not 'all'
      if (filters.department !== 'all') queryParams.department = filters.department;
      if (filters.role !== 'all') queryParams.role = filters.role;
      if (filters.status !== 'all') queryParams.status = filters.status;

      console.log('🔍 EmployeesTable: Fetching employees with params:', queryParams);
      const response = await adminAPI.getEmployees(queryParams);
      console.log('🔍 EmployeesTable: API response:', response);

      if (response.success && response.data) {
        // Handle both direct array and paginated response
        const employeesData = Array.isArray(response.data) ? response.data : response.data.data || [];
        setEmployees(employeesData);
        
        // Update pagination if available
        if (response.data && typeof response.data === 'object' && 'pagination' in response.data) {
          const paginationData = (response.data as Record<string, unknown>).pagination;
          setPagination(prev => ({
            ...prev,
            totalPages: (paginationData as Record<string, unknown>)?.totalPages as number || 1,
            totalItems: (paginationData as Record<string, unknown>)?.totalItems as number || 0,
            hasNext: (paginationData as Record<string, unknown>)?.hasNext as boolean || false,
            hasPrev: (paginationData as Record<string, unknown>)?.hasPrev as boolean || false
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, sorting, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleEditEmployee = (employeeId: string) => {
    console.log('🔍 Edit employee clicked:', employeeId);
    const employee = employees.find(emp => emp.id === employeeId);
    console.log('🔍 Found employee:', employee);
    if (employee) {
      setEditingEmployee(employee);
      setShowForm(true);
      console.log('✅ Edit form opened for employee:', employee.name);
    } else {
      console.error('❌ Employee not found:', employeeId);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    console.log('🔍 Delete employee clicked:', employeeId);
    const confirmed = await confirm({
      title: 'Delete Employee',
      description: 'Are you sure you want to delete this employee? This action cannot be undone.'
    });

    if (!confirmed) {
      console.log('❌ Delete cancelled by user');
      return;
    }

    console.log('✅ Delete confirmed, proceeding...');
    try {
      const response = await adminAPI.deleteEmployee(employeeId);
      console.log('🔍 Delete API response:', response);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Employee deleted successfully',
        });
        await fetchEmployees();
        onRefresh?.();
      } else {
        throw new Error(response.message || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete employee',
        variant: 'destructive',
      });
    }
  };

  const handleToggleEmployeeStatus = async (employeeId: string, currentStatus: boolean) => {
    console.log('🔍 Toggle status clicked:', employeeId, 'current status:', currentStatus);
    try {
      const newStatus = !currentStatus;
      console.log('🔍 Updating status to:', newStatus);
      const response = await adminAPI.toggleEmployeeStatus(employeeId, newStatus);
      console.log('🔍 Toggle API response:', response);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `Employee ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        });
        await fetchEmployees();
        onRefresh?.();
      } else {
        throw new Error(response.message || 'Failed to update employee status');
      }
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update employee status',
        variant: 'destructive',
      });
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filters.department === 'all' || employee.department === filters.department;
    const matchesRole = filters.role === 'all' || employee.role === filters.role;
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'active' && employee.isActive) ||
                         (filters.status === 'inactive' && !employee.isActive);
    
    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  const stats = [
    {
      title: 'Total Employees',
      value: employees.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: 'Active Employees',
      value: employees.filter(emp => emp.isActive).length,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: { value: 8.2, isPositive: true },
    },
    {
      title: 'Departments',
      value: new Set(employees.map(emp => emp.department)).size,
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: { value: 2.1, isPositive: true },
    },
    {
      title: 'Managers',
      value: employees.filter(emp => emp.role === 'manager').length,
      icon: Shield,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: { value: 15.2, isPositive: true },
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      {showStats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      {stat.trend.isPositive ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.trend.value}%
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters and Actions */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchEmployees}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                {showCreateButton && (
                  <Button
                    size="sm"
                    onClick={() => {
                      // TODO: Implement create employee modal
                      toast({
                        title: 'Create Employee',
                        description: 'Create employee functionality - This would open a create modal in a full implementation',
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                )}

                {showExport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Implement export functionality
                      toast({
                        title: 'Export Employees',
                        description: 'Export functionality would be implemented here',
                      });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employees ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-600">Loading employees...</span>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No employees found</p>
              <p className="text-sm text-slate-500">Try adjusting your filters or add new employees</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedEmployees.length === filteredEmployees.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEmployees(filteredEmployees.map(emp => emp.id));
                          } else {
                            setSelectedEmployees([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEmployees(prev => [...prev, employee.id]);
                            } else {
                              setSelectedEmployees(prev => prev.filter(id => id !== employee.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{employee.name}</p>
                            <p className="text-sm text-slate-500">{employee.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {employee.employeeId ? (
                          <span className="text-sm font-medium text-blue-600">{employee.employeeId}</span>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.department}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            employee.role === 'admin' ? 'bg-red-100 text-red-800' :
                            employee.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }
                        >
                          {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ActionsDropdown
                          actions={[
                            createEditAction(() => handleEditEmployee(employee.id)),
                            createToggleStatusAction(
                              employee.isActive,
                              () => handleToggleEmployeeStatus(employee.id, employee.isActive)
                            ),
                            createDeleteAction(() => handleDeleteEmployee(employee.id))
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default EmployeesTable;
