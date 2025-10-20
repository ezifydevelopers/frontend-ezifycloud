import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { managerAPI } from '@/lib/api';
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
  Eye,
  Edit
} from 'lucide-react';

const TeamSalaryPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [teamSalaries, setTeamSalaries] = useState<EmployeeSalary[]>([]);
  const [monthlySalaries, setMonthlySalaries] = useState<MonthlySalary[]>([]);
  const [statistics, setStatistics] = useState<SalaryStatistics | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch team salaries
  const fetchTeamSalaries = async () => {
    try {
      setLoading(true);
      const response = await managerAPI.getTeamSalaries();
      if (response.success) {
        setTeamSalaries(response.data);
      }
    } catch (error) {
      console.error('Error fetching team salaries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch team salaries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch team monthly salaries
  const fetchTeamMonthlySalaries = async () => {
    try {
      setLoading(true);
      const response = await managerAPI.getTeamMonthlySalaries({ year: selectedYear, month: selectedMonth });
      if (response.success) {
        setMonthlySalaries(response.data);
      }
    } catch (error) {
      console.error('Error fetching team monthly salaries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch team monthly salaries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch team salary statistics
  const fetchTeamSalaryStatistics = async () => {
    try {
      const response = await managerAPI.getTeamSalaryStatistics({ year: selectedYear, month: selectedMonth });
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error fetching team salary statistics:', error);
    }
  };

  // Generate team monthly salaries
  const generateTeamMonthlySalaries = async () => {
    try {
      setLoading(true);
      const response = await managerAPI.generateTeamMonthlySalaries({ year: selectedYear, month: selectedMonth });
      if (response.success) {
        toast({
          title: 'Success',
          description: `Generated salaries for ${response.data.length} team members`,
        });
        fetchTeamMonthlySalaries();
        fetchTeamSalaryStatistics();
      }
    } catch (error) {
      console.error('Error generating team monthly salaries:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate team monthly salaries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Approve team monthly salary
  const approveTeamMonthlySalary = async (salaryId: string) => {
    try {
      const response = await managerAPI.approveTeamMonthlySalary(salaryId, {});
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Team salary approved successfully',
        });
        fetchTeamMonthlySalaries();
      }
    } catch (error) {
      console.error('Error approving team salary:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve team salary',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchTeamSalaries();
    fetchTeamMonthlySalaries();
    fetchTeamSalaryStatistics();
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
          <h1 className="text-3xl font-bold text-gray-900">Team Salary Management</h1>
          <p className="text-gray-600">Manage your team's salaries and monthly calculations</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={generateTeamMonthlySalaries}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Generate Team Salaries
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
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
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
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button variant="outline" onClick={() => { fetchTeamMonthlySalaries(); fetchTeamSalaryStatistics(); }}>
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
          <TabsTrigger value="team">Team Salaries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Salary Overview</CardTitle>
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
                  <h3 className="text-lg font-semibold mb-4">Team Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Average Salary:</span>
                      <span className="font-semibold">
                        {statistics ? formatCurrency(statistics.averageSalary) : '$0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Team Members:</span>
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
              <CardTitle>Team Monthly Salaries - {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Member</TableHead>
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
                            onClick={() => approveTeamMonthlySalary(salary.id)}
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

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Salary Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Member</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamSalaries.map((salary) => (
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
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
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
      </Tabs>
    </div>
  );
};

export default TeamSalaryPage;
