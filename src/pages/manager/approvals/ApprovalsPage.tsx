import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Calendar,
  User,
  Building2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Star,
  Zap,
  CalendarDays,
  Clock3,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { leaveAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface LeaveRequest {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    avatar?: string;
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  priority: 'low' | 'medium' | 'high';
  emergencyContact?: string;
  workHandover?: string;
}

const ApprovalsPage: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'pending',
    leaveType: 'all',
    priority: 'all',
  });

  // Mock data
  const mockRequests: LeaveRequest[] = [
    {
      id: '1',
      employee: {
        id: 'emp1',
        name: 'Alice Johnson',
        email: 'alice.johnson@company.com',
        department: 'Engineering',
        avatar: 'AJ',
      },
      leaveType: 'Annual Leave',
      startDate: '2024-12-22',
      endDate: '2024-12-30',
      days: 7,
      reason: 'Christmas vacation with family',
      status: 'pending',
      submittedAt: '2024-12-15T10:30:00Z',
      priority: 'high',
      emergencyContact: '+1-555-0123',
      workHandover: 'Tasks assigned to Bob Smith',
    },
    {
      id: '2',
      employee: {
        id: 'emp2',
        name: 'Bob Smith',
        email: 'bob.smith@company.com',
        department: 'Marketing',
        avatar: 'BS',
      },
      leaveType: 'Sick Leave',
      startDate: '2024-12-16',
      endDate: '2024-12-16',
      days: 1,
      reason: 'Doctor appointment for annual checkup',
      status: 'pending',
      submittedAt: '2024-12-15T14:20:00Z',
      priority: 'medium',
      emergencyContact: '+1-555-0124',
    },
    {
      id: '3',
      employee: {
        id: 'emp3',
        name: 'Carol Davis',
        email: 'carol.davis@company.com',
        department: 'HR',
        avatar: 'CD',
      },
      leaveType: 'Casual Leave',
      startDate: '2024-12-20',
      endDate: '2024-12-21',
      days: 2,
      reason: 'Personal work - home renovation',
      status: 'pending',
      submittedAt: '2024-12-14T09:15:00Z',
      priority: 'low',
      emergencyContact: '+1-555-0125',
      workHandover: 'HR tasks delegated to David Wilson',
    },
    {
      id: '4',
      employee: {
        id: 'emp4',
        name: 'David Wilson',
        email: 'david.wilson@company.com',
        department: 'Sales',
        avatar: 'DW',
      },
      leaveType: 'Emergency Leave',
      startDate: '2024-12-18',
      endDate: '2024-12-19',
      days: 2,
      reason: 'Family emergency - parent hospitalization',
      status: 'pending',
      submittedAt: '2024-12-17T16:45:00Z',
      priority: 'high',
      emergencyContact: '+1-555-0126',
    },
  ];

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLeaveRequests(mockRequests);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch leave requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setLeaveRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'Current Manager' }
          : req
      ));
      toast({
        title: 'Request approved',
        description: 'Leave request has been approved successfully',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve request';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setLeaveRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'Current Manager' }
          : req
      ));
      toast({
        title: 'Request rejected',
        description: 'Leave request has been rejected',
        variant: 'destructive',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject request';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = 
      request.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || request.status === filters.status;
    const matchesLeaveType = filters.leaveType === 'all' || request.leaveType === filters.leaveType;
    const matchesPriority = filters.priority === 'all' || request.priority === filters.priority;
    
    return matchesSearch && matchesStatus && matchesLeaveType && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLeaveTypeColor = (leaveType: string) => {
    switch (leaveType) {
      case 'Annual Leave':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Sick Leave':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Casual Leave':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Emergency Leave':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Maternity Leave':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Paternity Leave':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Mock statistics
  const stats = [
    {
      title: 'Pending Requests',
      value: leaveRequests.filter(req => req.status === 'pending').length,
      description: 'Awaiting your review',
      icon: Clock,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    },
    {
      title: 'Approved Today',
      value: 3,
      description: 'Requests approved',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      trend: { value: 15.2, isPositive: true },
    },
    {
      title: 'High Priority',
      value: leaveRequests.filter(req => req.priority === 'high').length,
      description: 'Urgent requests',
      icon: AlertCircle,
      color: 'bg-gradient-to-br from-red-500 to-rose-600',
    },
    {
      title: 'Team Members',
      value: new Set(leaveRequests.map(req => req.employee.id)).size,
      description: 'Active team size',
      icon: User,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
  ];

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Leave Approvals
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Review and approve leave requests from your team members.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Team Active</span>
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

      {/* Controls */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 border-slate-200/50 focus:border-green-300 focus:ring-green-200"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-32 bg-white/50 border-slate-200/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.leaveType} onValueChange={(value) => setFilters(prev => ({ ...prev, leaveType: value }))}>
                  <SelectTrigger className="w-40 bg-white/50 border-slate-200/50">
                    <SelectValue placeholder="Leave Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                    <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="w-32 bg-white/50 border-slate-200/50">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-xl">Leave Requests ({filteredRequests.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50">
                    <TableHead className="font-semibold">Employee</TableHead>
                    <TableHead className="font-semibold">Leave Type</TableHead>
                    <TableHead className="font-semibold">Dates</TableHead>
                    <TableHead className="font-semibold">Days</TableHead>
                    <TableHead className="font-semibold">Priority</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request, index) => (
                    <TableRow 
                      key={request.id} 
                      className="group hover:bg-slate-50/50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white font-semibold">
                              {request.employee.avatar || request.employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-900">{request.employee.name}</p>
                            <p className="text-sm text-slate-500">{request.employee.department}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLeaveTypeColor(request.leaveType)}>
                          {request.leaveType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">
                            {new Date(request.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-slate-500">
                            to {new Date(request.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{request.days}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(request.id)}
                                className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(request.id)}
                                className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 hover:bg-slate-50"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
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

      {/* Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="justify-start group hover:scale-105 transition-transform duration-200"
              onClick={() => {
                const pendingRequests = leaveRequests.filter(req => req.status === 'pending');
                pendingRequests.forEach(req => handleApprove(req.id));
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4 group-hover:text-green-600" />
              Approve All Pending
            </Button>
            <Button 
              variant="outline" 
              className="justify-start group hover:scale-105 transition-transform duration-200"
              onClick={() => {
                const highPriorityRequests = leaveRequests.filter(req => req.priority === 'high' && req.status === 'pending');
                highPriorityRequests.forEach(req => handleApprove(req.id));
              }}
            >
              <AlertCircle className="mr-2 h-4 w-4 group-hover:text-orange-600" />
              Approve High Priority
            </Button>
            <Button 
              variant="outline" 
              className="justify-start group hover:scale-105 transition-transform duration-200"
            >
              <Calendar className="mr-2 h-4 w-4 group-hover:text-blue-600" />
              View Team Calendar
            </Button>
            <Button 
              variant="outline" 
              className="justify-start group hover:scale-105 transition-transform duration-200"
            >
              <FileText className="mr-2 h-4 w-4 group-hover:text-purple-600" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalsPage;