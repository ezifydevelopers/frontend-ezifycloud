import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api/adminAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import PageHeader from '@/components/layout/PageHeader';
import {
  DollarSign,
  AlertCircle,
  Calendar,
  Users,
  Download,
  RefreshCw,
  Eye,
  TrendingUp,
  TrendingDown,
  FileText,
  Building2,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface PaidUnpaidLeaveStats {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string | null;
  totalPaidDays: number;
  totalUnpaidDays: number;
  totalDays: number;
  byLeaveType: Array<{
    leaveType: string;
    paidDays: number;
    unpaidDays: number;
    totalDays: number;
  }>;
  leaveRequests: Array<{
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    isPaid: boolean;
    status: string;
    submittedAt: string;
  }>;
}

const PaidUnpaidLeavesPage: React.FC = () => {
  const [stats, setStats] = useState<PaidUnpaidLeaveStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    department: 'all',
    year: new Date().getFullYear(),
    search: ''
  });
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<PaidUnpaidLeaveStats | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {
        year: filters.year.toString()
      };
      if (filters.department !== 'all') {
        params.department = filters.department;
      }

      const response = await adminAPI.getPaidUnpaidLeaveStats(params);
      
      if (response.success && response.data) {
        setStats(response.data as PaidUnpaidLeaveStats[]);
      } else {
        setError(response.message || 'Failed to fetch leave statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leave statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filters.department, filters.year]);

  const toggleEmployee = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  const filteredStats = stats.filter(stat => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      stat.employeeName.toLowerCase().includes(searchLower) ||
      stat.employeeEmail.toLowerCase().includes(searchLower) ||
      (stat.department && stat.department.toLowerCase().includes(searchLower))
    );
  });

  // Get unique departments for filter
  const departments = Array.from(new Set(stats.map(s => s.department).filter(Boolean))) as string[];

  // Calculate totals
  const totals = filteredStats.reduce((acc, stat) => ({
    totalPaidDays: acc.totalPaidDays + stat.totalPaidDays,
    totalUnpaidDays: acc.totalUnpaidDays + stat.totalUnpaidDays,
    totalDays: acc.totalDays + stat.totalDays,
    employeeCount: acc.employeeCount + 1
  }), { totalPaidDays: 0, totalUnpaidDays: 0, totalDays: 0, employeeCount: 0 });

  const getLeaveTypeColor = (leaveType: string) => {
    const colors: Record<string, string> = {
      annual: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      casual: 'bg-green-100 text-green-800',
      maternity: 'bg-pink-100 text-pink-800',
      paternity: 'bg-purple-100 text-purple-800',
      emergency: 'bg-orange-100 text-orange-800',
    };
    return colors[leaveType] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && stats.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Paid & Unpaid Leaves"
          subtitle="Detailed breakdown of paid and unpaid leaves taken by employees"
          icon={DollarSign}
          iconColor="from-green-600 to-blue-600"
        >
          <Button
            onClick={fetchStats}
            variant="outline"
            className="bg-white/50 border-white/20 hover:bg-white/80"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="bg-white/50 border-white/20 hover:bg-white/80"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </PageHeader>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/90 backdrop-blur-sm border-white/30 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Employees</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{totals.employeeCount}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-white/30 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Paid Days</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{totals.totalPaidDays.toFixed(1)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-white/30 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Unpaid Days</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{totals.totalUnpaidDays.toFixed(1)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-white/30 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Leave Days</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{totals.totalDays.toFixed(1)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/30 shadow-xl mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search Employee</Label>
                <Input
                  id="search"
                  placeholder="Search by name, email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={filters.department}
                  onValueChange={(value) => setFilters({ ...filters, department: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={fetchStats}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Statistics Table */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/30 shadow-xl">
          <CardHeader>
            <CardTitle>Employee Leave Statistics</CardTitle>
            <CardDescription>
              Click on an employee row to view detailed leave breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStats.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No Leave Data Found</h3>
                <p className="text-slate-600">No approved leave requests found for the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStats.map((stat) => (
                  <div key={stat.employeeId} className="border rounded-lg overflow-hidden">
                    {/* Main Row */}
                    <div
                      className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => toggleEmployee(stat.employeeId)}
                    >
                      <div className="col-span-12 md:col-span-3 flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEmployee(stat.employeeId);
                          }}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          {expandedEmployees.has(stat.employeeId) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {stat.employeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900">{stat.employeeName}</p>
                          <p className="text-sm text-slate-500">{stat.employeeEmail}</p>
                        </div>
                      </div>
                      <div className="col-span-12 md:col-span-2 flex items-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Building2 className="h-3 w-3 mr-1" />
                          {stat.department || 'Unassigned'}
                        </Badge>
                      </div>
                      <div className="col-span-4 md:col-span-2 text-center">
                        <p className="text-sm text-slate-600">Paid Days</p>
                        <p className="text-lg font-bold text-green-600">{stat.totalPaidDays.toFixed(1)}</p>
                      </div>
                      <div className="col-span-4 md:col-span-2 text-center">
                        <p className="text-sm text-slate-600">Unpaid Days</p>
                        <p className="text-lg font-bold text-red-600">{stat.totalUnpaidDays.toFixed(1)}</p>
                      </div>
                      <div className="col-span-4 md:col-span-2 text-center">
                        <p className="text-sm text-slate-600">Total Days</p>
                        <p className="text-lg font-bold text-slate-900">{stat.totalDays.toFixed(1)}</p>
                      </div>
                      <div className="col-span-12 md:col-span-1 flex items-center justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployee(stat);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedEmployees.has(stat.employeeId) && (
                      <div className="border-t bg-slate-50 p-4">
                        <Tabs defaultValue="byType" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="byType">By Leave Type</TabsTrigger>
                            <TabsTrigger value="requests">Leave Requests</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="byType" className="mt-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Leave Type</TableHead>
                                  <TableHead className="text-center">Paid Days</TableHead>
                                  <TableHead className="text-center">Unpaid Days</TableHead>
                                  <TableHead className="text-center">Total Days</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {stat.byLeaveType.map((typeStat) => (
                                  <TableRow key={typeStat.leaveType}>
                                    <TableCell>
                                      <Badge className={getLeaveTypeColor(typeStat.leaveType)}>
                                        {typeStat.leaveType.charAt(0).toUpperCase() + typeStat.leaveType.slice(1)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-center text-green-600 font-semibold">
                                      {typeStat.paidDays.toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-center text-red-600 font-semibold">
                                      {typeStat.unpaidDays.toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">
                                      {typeStat.totalDays.toFixed(1)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TabsContent>

                          <TabsContent value="requests" className="mt-4">
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {stat.leaveRequests.map((request) => (
                                <div
                                  key={request.id}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                                >
                                  <div className="flex items-center space-x-3">
                                    <Badge className={getLeaveTypeColor(request.leaveType)}>
                                      {request.leaveType}
                                    </Badge>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {request.totalDays} day{request.totalDays !== 1 ? 's' : ''} • 
                                        Submitted: {formatDate(request.submittedAt)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant={request.isPaid ? "default" : "destructive"}
                                      className={request.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                    >
                                      {request.isPaid ? 'Paid' : 'Unpaid'}
                                    </Badge>
                                    <Badge variant="outline">
                                      {request.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed View Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Leave Details - {selectedEmployee?.employeeName}</DialogTitle>
              <DialogDescription>
                Complete breakdown of paid and unpaid leaves
              </DialogDescription>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-600">Total Paid Days</p>
                      <p className="text-2xl font-bold text-green-600">{selectedEmployee.totalPaidDays.toFixed(1)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-600">Total Unpaid Days</p>
                      <p className="text-2xl font-bold text-red-600">{selectedEmployee.totalUnpaidDays.toFixed(1)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-600">Total Days</p>
                      <p className="text-2xl font-bold text-slate-900">{selectedEmployee.totalDays.toFixed(1)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* By Leave Type */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Breakdown by Leave Type</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead className="text-center">Paid Days</TableHead>
                        <TableHead className="text-center">Unpaid Days</TableHead>
                        <TableHead className="text-center">Total Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEmployee.byLeaveType.map((typeStat) => (
                        <TableRow key={typeStat.leaveType}>
                          <TableCell>
                            <Badge className={getLeaveTypeColor(typeStat.leaveType)}>
                              {typeStat.leaveType.charAt(0).toUpperCase() + typeStat.leaveType.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-green-600 font-semibold">
                            {typeStat.paidDays.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center text-red-600 font-semibold">
                            {typeStat.unpaidDays.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {typeStat.totalDays.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* All Leave Requests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">All Leave Requests</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedEmployee.leaveRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge className={getLeaveTypeColor(request.leaveType)}>
                            {request.leaveType}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">
                              {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {request.totalDays} day{request.totalDays !== 1 ? 's' : ''} • 
                              Submitted: {formatDate(request.submittedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={request.isPaid ? "default" : "destructive"}
                            className={request.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {request.isPaid ? 'Paid' : 'Unpaid'}
                          </Badge>
                          <Badge variant="outline">
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PaidUnpaidLeavesPage;

