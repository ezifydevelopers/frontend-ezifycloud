import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import { EmployeeSalary, MonthlySalary, SalaryStatistics } from '@/types/api';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calculator, 
  FileText, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Settings,
  UserPlus,
  Calendar,
  Target
} from 'lucide-react';

const SalaryManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [employeeSalaries, setEmployeeSalaries] = useState<EmployeeSalary[]>([]);
  const [allEmployees, setAllEmployees] = useState<{id: string, name: string, email: string, department: string}[]>([]);
  const [monthlySalaries, setMonthlySalaries] = useState<MonthlySalary[]>([]);
  const [statistics, setStatistics] = useState<SalaryStatistics | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New state for enhanced functionality
  const [showAddSalaryDialog, setShowAddSalaryDialog] = useState(false);
  const [showEditSalaryDialog, setShowEditSalaryDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSalary | null>(null);
  const [salaryFormData, setSalaryFormData] = useState({
    userId: '',
    baseSalary: '',
    hourlyRate: '',
    currency: 'USD',
    effectiveDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
    // Advanced salary features
    payFrequency: 'monthly',
    salaryGrade: '',
    bonusPercentage: '',
    commissionRate: '',
    overtimeRate: '',
    benefits: {
      healthInsurance: '',
      dentalInsurance: '',
      retirementContribution: '',
      lifeInsurance: '',
      disabilityInsurance: ''
    },
    deductions: {
      taxWithholding: '',
      socialSecurity: '',
      medicare: '',
      otherDeductions: ''
    },
    allowances: {
      housingAllowance: '',
      transportAllowance: '',
      mealAllowance: '',
      otherAllowances: ''
    },
    performanceMetrics: {
      targetBonus: '',
      kpiWeightage: '',
      reviewCycle: 'annual'
    }
  });

  // Fetch all employees
  const fetchAllEmployees = async () => {
    try {
      const response = await adminAPI.getEmployees();
      if (response.success) {
        setAllEmployees(response.data.users || response.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch employee salaries
  const fetchEmployeeSalaries = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getEmployeeSalaries();
      if (response.success) {
        setEmployeeSalaries(response.data);
      }
    } catch (error) {
      console.error('Error fetching employee salaries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employee salaries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch monthly salaries
  const fetchMonthlySalaries = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getMonthlySalaries({ year: selectedYear, month: selectedMonth });
      if (response.success) {
        setMonthlySalaries(response.data);
      }
    } catch (error) {
      console.error('Error fetching monthly salaries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch monthly salaries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch salary statistics
  const fetchSalaryStatistics = async () => {
    try {
      const response = await adminAPI.getSalaryStatistics({ year: selectedYear, month: selectedMonth });
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error fetching salary statistics:', error);
    }
  };

  // Generate monthly salaries
  const generateMonthlySalaries = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.generateMonthlySalaries({ year: selectedYear, month: selectedMonth });
      if (response.success) {
        toast({
          title: 'Success',
          description: `Generated salaries for ${response.data.length} employees`,
        });
        fetchMonthlySalaries();
        fetchSalaryStatistics();
      }
    } catch (error) {
      console.error('Error generating monthly salaries:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate monthly salaries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Approve monthly salary
  const approveMonthlySalary = async (salaryId: string) => {
    try {
      const response = await adminAPI.approveMonthlySalary(salaryId, {});
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Salary approved successfully',
        });
        fetchMonthlySalaries();
      }
    } catch (error) {
      console.error('Error approving salary:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve salary',
        variant: 'destructive',
      });
    }
  };

  // Add new employee salary
  const handleAddSalary = () => {
    setSalaryFormData({
      userId: '',
      baseSalary: '',
      hourlyRate: '',
      currency: 'USD',
      effectiveDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
      payFrequency: 'monthly',
      salaryGrade: '',
      bonusPercentage: '',
      commissionRate: '',
      overtimeRate: '',
      benefits: {
        healthInsurance: '',
        dentalInsurance: '',
        retirementContribution: '',
        lifeInsurance: '',
        disabilityInsurance: ''
      },
      deductions: {
        taxWithholding: '',
        socialSecurity: '',
        medicare: '',
        otherDeductions: ''
      },
      allowances: {
        housingAllowance: '',
        transportAllowance: '',
        mealAllowance: '',
        otherAllowances: ''
      },
      performanceMetrics: {
        targetBonus: '',
        kpiWeightage: '',
        reviewCycle: 'annual'
      }
    });
    setSelectedEmployee(null);
    setShowAddSalaryDialog(true);
  };

  // Edit existing employee salary
  const handleEditSalary = (employee: EmployeeSalary) => {
    setSelectedEmployee(employee);
    setSalaryFormData({
      userId: employee.userId,
      baseSalary: employee.baseSalary.toString(),
      hourlyRate: employee.hourlyRate?.toString() || '',
      currency: employee.currency,
      effectiveDate: employee.effectiveDate.split('T')[0],
      endDate: employee.endDate?.split('T')[0] || '',
      isActive: employee.isActive,
      payFrequency: 'monthly',
      salaryGrade: '',
      bonusPercentage: '',
      commissionRate: '',
      overtimeRate: '',
      benefits: {
        healthInsurance: '',
        dentalInsurance: '',
        retirementContribution: '',
        lifeInsurance: '',
        disabilityInsurance: ''
      },
      deductions: {
        taxWithholding: '',
        socialSecurity: '',
        medicare: '',
        otherDeductions: ''
      },
      allowances: {
        housingAllowance: '',
        transportAllowance: '',
        mealAllowance: '',
        otherAllowances: ''
      },
      performanceMetrics: {
        targetBonus: '',
        kpiWeightage: '',
        reviewCycle: 'annual'
      }
    });
    setShowEditSalaryDialog(true);
  };

  // Save salary (add or edit)
  const handleSaveSalary = async () => {
    try {
      setLoading(true);
      
      const salaryData = {
        userId: selectedEmployee ? selectedEmployee.userId : salaryFormData.userId,
        baseSalary: parseFloat(salaryFormData.baseSalary),
        hourlyRate: salaryFormData.hourlyRate ? parseFloat(salaryFormData.hourlyRate) : undefined,
        currency: salaryFormData.currency,
        effectiveDate: new Date(salaryFormData.effectiveDate),
        endDate: salaryFormData.endDate ? new Date(salaryFormData.endDate) : undefined,
        isActive: salaryFormData.isActive
      };

      if (selectedEmployee) {
        // Update existing salary
        await adminAPI.updateEmployeeSalary(selectedEmployee.id, salaryData);
        toast({
          title: 'Success',
          description: 'Employee salary updated successfully',
        });
      } else {
        // Add new salary
        await adminAPI.createEmployeeSalary(salaryData);
        toast({
          title: 'Success',
          description: 'Employee salary added successfully',
        });
      }

      setShowAddSalaryDialog(false);
      setShowEditSalaryDialog(false);
      fetchEmployeeSalaries();
    } catch (error) {
      console.error('Error saving salary:', error);
      toast({
        title: 'Error',
        description: 'Failed to save salary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate salary for specific employee
  const calculateEmployeeSalary = async (employeeId: string) => {
    try {
      const response = await adminAPI.calculateEmployeeSalary(employeeId, { 
        year: selectedYear, 
        month: selectedMonth 
      });
      if (response.success) {
        toast({
          title: 'Salary Calculated',
          description: `Net Salary: $${response.data.netSalary.toFixed(2)}`,
        });
      }
    } catch (error) {
      console.error('Error calculating salary:', error);
      toast({
        title: 'Error',
        description: 'Failed to calculate salary',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchAllEmployees();
    fetchEmployeeSalaries();
    fetchMonthlySalaries();
    fetchSalaryStatistics();
  }, [selectedYear, selectedMonth]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      calculated: { color: 'bg-blue-100 text-blue-800', icon: Calculator },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      paid: { color: 'bg-purple-100 text-purple-800', icon: DollarSign },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredMonthlySalaries = monthlySalaries.filter(salary =>
    salary.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salary.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-gray-600">Manage employee salaries and monthly calculations</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleAddSalary}
            className="bg-green-600 hover:bg-green-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Salary
          </Button>
          <Button
            onClick={generateMonthlySalaries}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Generate Salaries
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalEmployees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gross Salary</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(statistics.totalGrossSalary)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(statistics.totalDeductions)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Salary</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(statistics.totalNetSalary)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Year:</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Month:</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button variant="outline" onClick={() => { fetchMonthlySalaries(); fetchSalaryStatistics(); }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Salaries</TabsTrigger>
          <TabsTrigger value="employees">Employee Salaries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Salary Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Leave Deductions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Leave Deductions:</span>
                      <span className="font-semibold text-red-600">
                        {statistics ? formatCurrency(statistics.leaveDeductions) : '$0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Deductions:</span>
                      <span className="font-semibold text-red-600">
                        {statistics ? formatCurrency(statistics.taxDeductions) : '$0.00'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Average Salary:</span>
                      <span className="font-semibold">
                        {statistics ? formatCurrency(statistics.averageSalary) : '$0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Employees:</span>
                      <span className="font-semibold">{statistics?.totalEmployees || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Salaries - {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMonthlySalaries.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{salary.user.name}</div>
                          <div className="text-sm text-gray-500">{salary.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(salary.baseSalary)}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(salary.totalDeductions)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(salary.netSalary)}</TableCell>
                      <TableCell>{getStatusBadge(salary.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveMonthlySalary(salary.id)}
                            disabled={salary.status === 'approved' || salary.status === 'paid'}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Salary Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeSalaries.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{salary.user.name}</div>
                          <div className="text-sm text-gray-500">{salary.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(salary.baseSalary)}</TableCell>
                      <TableCell>
                        {salary.hourlyRate ? formatCurrency(salary.hourlyRate) : 'N/A'}
                      </TableCell>
                      <TableCell>{new Date(salary.effectiveDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={salary.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {salary.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditSalary(salary)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => calculateEmployeeSalary(salary.userId)}
                          >
                            <Calculator className="w-4 h-4 mr-1" />
                            Calculate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Advanced Salary Management Dialog */}
      <Dialog open={showAddSalaryDialog || showEditSalaryDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddSalaryDialog(false);
          setShowEditSalaryDialog(false);
        }
      }}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {selectedEmployee ? 'Edit Employee Salary Package' : 'Create Advanced Salary Package'}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {selectedEmployee 
                ? 'Update the comprehensive salary package for this employee.' 
                : 'Set up a complete salary package with benefits, bonuses, and performance metrics.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="compensation">Compensation</TabsTrigger>
              <TabsTrigger value="benefits">Benefits</TabsTrigger>
              <TabsTrigger value="deductions">Deductions</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Employee Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedEmployee && (
                    <div className="space-y-2">
                      <Label htmlFor="userId">Select Employee</Label>
                      <Select 
                        value={salaryFormData.userId} 
                        onValueChange={(value) => setSalaryFormData(prev => ({ ...prev, userId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {allEmployees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name} ({employee.email}) - {employee.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={salaryFormData.currency} 
                        onValueChange={(value) => setSalaryFormData(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                          <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payFrequency">Pay Frequency</Label>
                      <Select 
                        value={salaryFormData.payFrequency} 
                        onValueChange={(value) => setSalaryFormData(prev => ({ ...prev, payFrequency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="effectiveDate">Effective Date</Label>
                      <Input
                        id="effectiveDate"
                        type="date"
                        value={salaryFormData.effectiveDate}
                        onChange={(e) => setSalaryFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date (Optional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={salaryFormData.endDate}
                        onChange={(e) => setSalaryFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compensation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Compensation Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baseSalary">Base Salary</Label>
                      <Input
                        id="baseSalary"
                        type="number"
                        placeholder="50000"
                        value={salaryFormData.baseSalary}
                        onChange={(e) => setSalaryFormData(prev => ({ ...prev, baseSalary: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate (Optional)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        placeholder="25.00"
                        value={salaryFormData.hourlyRate}
                        onChange={(e) => setSalaryFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bonusPercentage">Bonus Percentage (%)</Label>
                      <Input
                        id="bonusPercentage"
                        type="number"
                        placeholder="10"
                        value={salaryFormData.bonusPercentage}
                        onChange={(e) => setSalaryFormData(prev => ({ ...prev, bonusPercentage: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                      <Input
                        id="commissionRate"
                        type="number"
                        placeholder="5"
                        value={salaryFormData.commissionRate}
                        onChange={(e) => setSalaryFormData(prev => ({ ...prev, commissionRate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="overtimeRate">Overtime Rate (x)</Label>
                      <Input
                        id="overtimeRate"
                        type="number"
                        placeholder="1.5"
                        value={salaryFormData.overtimeRate}
                        onChange={(e) => setSalaryFormData(prev => ({ ...prev, overtimeRate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salaryGrade">Salary Grade/Band</Label>
                    <Input
                      id="salaryGrade"
                      type="text"
                      placeholder="Senior Level 3"
                      value={salaryFormData.salaryGrade}
                      onChange={(e) => setSalaryFormData(prev => ({ ...prev, salaryGrade: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="benefits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Benefits & Allowances
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="healthInsurance">Health Insurance</Label>
                      <Input
                        id="healthInsurance"
                        type="number"
                        placeholder="500"
                        value={salaryFormData.benefits.healthInsurance}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          benefits: { ...prev.benefits, healthInsurance: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dentalInsurance">Dental Insurance</Label>
                      <Input
                        id="dentalInsurance"
                        type="number"
                        placeholder="100"
                        value={salaryFormData.benefits.dentalInsurance}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          benefits: { ...prev.benefits, dentalInsurance: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="retirementContribution">Retirement Contribution</Label>
                      <Input
                        id="retirementContribution"
                        type="number"
                        placeholder="1000"
                        value={salaryFormData.benefits.retirementContribution}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          benefits: { ...prev.benefits, retirementContribution: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lifeInsurance">Life Insurance</Label>
                      <Input
                        id="lifeInsurance"
                        type="number"
                        placeholder="200"
                        value={salaryFormData.benefits.lifeInsurance}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          benefits: { ...prev.benefits, lifeInsurance: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="housingAllowance">Housing Allowance</Label>
                      <Input
                        id="housingAllowance"
                        type="number"
                        placeholder="2000"
                        value={salaryFormData.allowances.housingAllowance}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          allowances: { ...prev.allowances, housingAllowance: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transportAllowance">Transport Allowance</Label>
                      <Input
                        id="transportAllowance"
                        type="number"
                        placeholder="500"
                        value={salaryFormData.allowances.transportAllowance}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          allowances: { ...prev.allowances, transportAllowance: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mealAllowance">Meal Allowance</Label>
                      <Input
                        id="mealAllowance"
                        type="number"
                        placeholder="300"
                        value={salaryFormData.allowances.mealAllowance}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          allowances: { ...prev.allowances, mealAllowance: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deductions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Tax & Deductions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxWithholding">Tax Withholding (%)</Label>
                      <Input
                        id="taxWithholding"
                        type="number"
                        placeholder="22"
                        value={salaryFormData.deductions.taxWithholding}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          deductions: { ...prev.deductions, taxWithholding: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="socialSecurity">Social Security (%)</Label>
                      <Input
                        id="socialSecurity"
                        type="number"
                        placeholder="6.2"
                        value={salaryFormData.deductions.socialSecurity}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          deductions: { ...prev.deductions, socialSecurity: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="medicare">Medicare (%)</Label>
                      <Input
                        id="medicare"
                        type="number"
                        placeholder="1.45"
                        value={salaryFormData.deductions.medicare}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          deductions: { ...prev.deductions, medicare: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otherDeductions">Other Deductions</Label>
                      <Input
                        id="otherDeductions"
                        type="number"
                        placeholder="100"
                        value={salaryFormData.deductions.otherDeductions}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          deductions: { ...prev.deductions, otherDeductions: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetBonus">Target Bonus Amount</Label>
                      <Input
                        id="targetBonus"
                        type="number"
                        placeholder="5000"
                        value={salaryFormData.performanceMetrics.targetBonus}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          performanceMetrics: { ...prev.performanceMetrics, targetBonus: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kpiWeightage">KPI Weightage (%)</Label>
                      <Input
                        id="kpiWeightage"
                        type="number"
                        placeholder="70"
                        value={salaryFormData.performanceMetrics.kpiWeightage}
                        onChange={(e) => setSalaryFormData(prev => ({ 
                          ...prev, 
                          performanceMetrics: { ...prev.performanceMetrics, kpiWeightage: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reviewCycle">Review Cycle</Label>
                    <Select 
                      value={salaryFormData.performanceMetrics.reviewCycle} 
                      onValueChange={(value) => setSalaryFormData(prev => ({ 
                        ...prev, 
                        performanceMetrics: { ...prev.performanceMetrics, reviewCycle: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="bi-annual">Bi-Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddSalaryDialog(false);
                setShowEditSalaryDialog(false);
              }}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  // Calculate total compensation
                  const baseSalary = parseFloat(salaryFormData.baseSalary) || 0;
                  const bonus = (baseSalary * parseFloat(salaryFormData.bonusPercentage || '0')) / 100;
                  const benefits = Object.values(salaryFormData.benefits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                  const allowances = Object.values(salaryFormData.allowances).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                  const total = baseSalary + bonus + benefits + allowances;
                  
                  toast({
                    title: 'Total Compensation Preview',
                    description: `Base: $${baseSalary.toLocaleString()} + Bonus: $${bonus.toLocaleString()} + Benefits: $${benefits.toLocaleString()} + Allowances: $${allowances.toLocaleString()} = Total: $${total.toLocaleString()}`,
                  });
                }}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Preview Total
              </Button>
              <Button 
                onClick={handleSaveSalary}
                disabled={loading || !salaryFormData.baseSalary}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? 'Saving...' : (selectedEmployee ? 'Update Salary Package' : 'Create Salary Package')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryManagementPage;
