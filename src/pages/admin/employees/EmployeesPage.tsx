import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import LeaveBalanceCard from '@/components/ui/LeaveBalanceCard';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Trash2,
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
import { User } from '@/types/auth';
import { adminAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import EmployeeForm from './components/EmployeeForm';
import EmployeeFilters from './components/EmployeeFilters';

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
    status: 'all',
  });
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>({});
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      console.log('🔍 EmployeesPage: Fetching employees...');
      
      // Build query parameters, filtering out undefined values
      const queryParams: any = {};
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
        console.log('✅ EmployeesPage: Loaded employees:', employees.length);
      } else {
        throw new Error(response.message || 'Failed to fetch employees');
      }
    } catch (error: any) {
      console.error('❌ EmployeesPage: Error fetching employees:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch employees',
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
        setLeaveBalances(prev => ({ ...prev, [employeeId]: response.data as LeaveBalance }));
      }
    } catch (error) {
      console.error('Error fetching leave balance for employee:', employeeId, error);
    } finally {
      setLoadingBalances(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      console.log('🔍 EmployeesPage: Deleting employee:', employeeId);
      
      const response = await adminAPI.deleteEmployee(employeeId);
      
      console.log('🔍 EmployeesPage: Delete response:', response);
      
      if (response.success) {
        toast({
          title: 'Employee deleted',
          description: 'Employee has been removed successfully',
        });
        fetchEmployees(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to delete employee');
      }
    } catch (error: any) {
      console.error('❌ EmployeesPage: Error deleting employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete employee',
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
    } catch (error: any) {
      console.error('❌ EmployeesPage: Error toggling status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update employee status',
        variant: 'destructive',
      });
    }
  };

  const filteredEmployees = (employees || []).filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filters.department === 'all' || !filters.department || employee.department === filters.department;
    const matchesRole = filters.role === 'all' || !filters.role || employee.role === filters.role;
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'active' && employee.isActive) ||
                         (filters.status === 'inactive' && !employee.isActive);
    
    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
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
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                <div className="w-full lg:w-80">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 h-11"
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
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
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
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50">
                    <TableHead className="font-semibold">Employee</TableHead>
                    <TableHead className="font-semibold">Department</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Leave Balance</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee, index) => (
                    <TableRow 
                      key={employee.id} 
                      className="group hover:bg-slate-50/50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
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
                      <TableCell>
                        <Badge className={getDepartmentColor(employee.department || '')}>
                          {employee.department}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(employee.role)}>
                          {employee.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(employee.isActive)}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-48">
                          {loadingBalances[employee.id] ? (
                            <div className="flex items-center justify-center py-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          ) : leaveBalances[employee.id] ? (
                            <LeaveBalanceCard 
                              leaveBalance={leaveBalances[employee.id]} 
                              showTitle={false} 
                              compact={true}
                            />
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchLeaveBalance(employee.id)}
                              className="text-xs"
                            >
                              View Balance
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1 text-sm text-slate-600">
                            <Mail className="h-3 w-3" />
                            <span>{employee.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
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
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(employee)}
                              className="hover:bg-green-50 hover:text-green-700"
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
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-white/20">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the employee
                                    and remove their data from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteEmployee(employee.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          }}
        />
      )}
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;