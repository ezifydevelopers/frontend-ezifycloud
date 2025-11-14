import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import LeaveRequestDetails from '@/components/leave/LeaveRequestDetails';
import { LeaveRequest as LeaveRequestType } from '@/types/leave';
import { 
  Clock, 
  Search, 
  Filter, 
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Zap,
  Target,
  Award,
  User,
  Building2,
  Clock3,
  CalendarDays,
  FileText,
  Eye,
  RefreshCw,
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
import { toast } from '@/hooks/use-toast';
import { employeeAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface LeaveRequest {
  id: string;
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
  isHalfDay?: boolean;
  halfDayPeriod?: string;
  isPaid?: boolean;
  comments?: string;
  attachments?: string[];
}

const LeaveHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<{ [key: string]: { remaining: number; total: number; used: number } }>({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    year: new Date().getFullYear().toString(),
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [leavePolicies, setLeavePolicies] = useState<Array<{ leaveType: string }>>([]);

  // Helper function to convert database leave type to display name
  const getLeaveTypeDisplayName = (dbValue: string): string => {
    if (!dbValue) return 'Leave';
    
    // Replace underscores with spaces and capitalize each word
    const formatted = dbValue
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    const typeMap: { [key: string]: string } = {
      'annual': 'Annual Leave',
      'sick': 'Sick Leave',
      'casual': 'Casual Leave',
      'maternity': 'Maternity Leave',
      'paternity': 'Paternity Leave',
      'emergency': 'Emergency Leave'
    };
    
    const lowerValue = dbValue.toLowerCase();
    if (typeMap[lowerValue]) {
      return typeMap[lowerValue];
    }
    
    return formatted;
  };

  // Fetch leave policies to get available leave types
  const fetchLeavePolicies = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await employeeAPI.getLeavePolicies({ status: 'active', limit: 50 });
      if (response.success && response.data) {
        const policies = Array.isArray(response.data) ? response.data : response.data.data || [];
        setLeavePolicies(policies);
        console.log('✅ LeaveHistoryPage (history): Fetched leave policies:', policies);
      } else {
        setLeavePolicies([]);
      }
    } catch (error) {
      console.error('Error fetching leave policies:', error);
      setLeavePolicies([]);
    }
  }, [user]);

  const fetchLeaveBalance = useCallback(async () => {
    try {
      if (!user) {
        console.warn('User not authenticated, skipping leave balance fetch');
        return;
      }

      console.log('🔍 LeaveHistory: Fetching leave balance...');
      
      // Add cache-busting timestamp
      const timestamp = Date.now();
      
      const balanceResponse = await employeeAPI.getLeaveBalance({ _t: timestamp } as Record<string, unknown>);
      
      console.log('🔍 LeaveHistory: Leave balance API response:', balanceResponse);

      if (balanceResponse.success && balanceResponse.data) {
        const balance = balanceResponse.data;
        console.log('✅ LeaveHistory: Leave balance data:', balance);
        
        // Process all leave types from the API response
        const dynamicLeaveBalance: { [key: string]: { remaining: number; total: number; used: number } } = {};
        
        Object.keys(balance).forEach(leaveType => {
          if (leaveType !== 'total' && typeof balance[leaveType] === 'object') {
            const leaveData = balance[leaveType];
            const total = leaveData?.total || 0;
            const used = leaveData?.used || 0;
            
            dynamicLeaveBalance[leaveType] = {
              remaining: total - used,
              total: total,
              used: used
            };
          }
        });
        
        console.log('🔍 LeaveHistory: Processed leave balance:', dynamicLeaveBalance);
        setLeaveBalance(dynamicLeaveBalance);
      } else {
        console.warn('❌ LeaveHistory: Leave balance API failed or returned no data');
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  }, [user]);

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('User not authenticated, skipping API calls');
        setLeaveRequests([]);
        return;
      }

      console.log('🔍 LeaveHistory: Fetching leave history with filters:', filters);
      
      // Add cache-busting timestamp
      const timestamp = Date.now();
      
      const params: Record<string, unknown> = {
        _t: timestamp,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'submittedAt',
        sortOrder: 'desc'
      };

      // Add filters
      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters.type !== 'all') {
        params.leaveType = filters.type;
      }
      if (filters.year) {
        params.year = parseInt(filters.year);
      }

      console.log('🔍 LeaveHistory: API params:', params);

      const response = await employeeAPI.getLeaveHistory(params);
      
      console.log('🔍 LeaveHistory: API response:', response);

      if (response.success && response.data) {
        console.log('✅ LeaveHistory: Setting leave requests:', response.data);
        
        // Handle both array and paginated response
        const requests = Array.isArray(response.data) ? response.data : response.data.data || [];
        
        // Debug: Log the leave types to see what we're working with
        const leaveTypes = requests.map(req => req.leaveType);
        console.log('🔍 LeaveHistory: Leave types in data:', leaveTypes);
        
        setLeaveRequests(requests as LeaveRequest[]);
        
        if (response.data && typeof response.data === 'object' && 'pagination' in response.data) {
          const paginationData = (response.data as Record<string, unknown>).pagination as Record<string, unknown>;
          setPagination(prev => ({
            ...prev,
            total: paginationData.total as number,
            totalPages: paginationData.totalPages as number
          }));
        }
      } else {
        console.warn('❌ LeaveHistory: API failed or returned no data');
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('Error fetching leave history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave history',
        variant: 'destructive',
      });
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (user !== undefined) {
      fetchLeavePolicies();
      fetchLeaveRequests();
      fetchLeaveBalance();
    }
  }, [filters, user, fetchLeavePolicies, fetchLeaveRequests, fetchLeaveBalance]);

  const filteredRequests = leaveRequests.filter(request => {
    const displayName = getLeaveTypeDisplayName(request.leaveType);
    const matchesSearch = 
      request.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || request.status === filters.status;
    const matchesType = filters.type === 'all' || request.leaveType === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Annual Leave':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Sick Leave':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Casual Leave':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Emergency Leave':
        return 'bg-orange-100 text-orange-800 border-orange-200';
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

  const getPaidStatusColor = (isPaid: boolean | undefined) => {
    if (isPaid === undefined) return 'bg-gray-100 text-gray-800 border-gray-200';
    return isPaid 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-orange-100 text-orange-800 border-orange-200';
  };

  // Calculate statistics
  const totalRequests = pagination.total || leaveRequests.length;
  const approvedRequests = leaveRequests.filter(req => req.status === 'approved').length;
  const pendingRequests = leaveRequests.filter(req => req.status === 'pending').length;
  const rejectedRequests = leaveRequests.filter(req => req.status === 'rejected').length;
  const totalDaysTaken = leaveRequests
    .filter(req => req.status === 'approved')
    .reduce((sum, req) => sum + req.days, 0);
  const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;

  // Mock statistics
  const stats = [
    {
      title: 'Total Requests',
      value: totalRequests,
      description: 'This year',
      icon: FileText,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: 'Approved',
      value: approvedRequests,
      description: 'Successfully approved',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },
    {
      title: 'Days Taken',
      value: totalDaysTaken,
      description: 'Leave days used',
      icon: Calendar,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    },
    {
      title: 'Approval Rate',
      value: `${approvalRate}%`,
      description: 'Success rate',
      icon: Target,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
      trend: { value: 8.3, isPositive: true },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Leave History
                </h1>
              </div>
              <p className="text-slate-600 text-base lg:text-lg">
                Track your leave requests and view your complete leave history
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">Profile Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
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

      {/* Controls */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 border-slate-200/50 focus:border-blue-300 focus:ring-blue-200 rounded-xl"
                  />
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-32 bg-white/50 border-slate-200/50 rounded-xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="w-40 bg-white/50 border-slate-200/50 rounded-xl">
                      <SelectValue placeholder="Leave Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {leavePolicies.map((policy) => (
                        <SelectItem key={policy.leaveType} value={policy.leaveType}>
                          {getLeaveTypeDisplayName(policy.leaveType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
                    <SelectTrigger className="w-24 bg-white/50 border-slate-200/50 rounded-xl">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchLeaveRequests}
                  className="hover:bg-blue-50 hover:text-blue-700 border-slate-200 rounded-xl"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  className="hover:bg-green-50 hover:text-green-700 border-slate-200 rounded-xl"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <Clock className="h-5 w-5 text-white" />
              </div>
              Leave History ({filteredRequests.length})
            </CardTitle>
            <p className="text-slate-600 text-sm mt-2">Complete history of your leave requests and their status</p>
          </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50">
                    <TableHead className="font-semibold">Leave Type</TableHead>
                    <TableHead className="font-semibold">Dates</TableHead>
                    <TableHead className="font-semibold">Days</TableHead>
                    <TableHead className="font-semibold">Reason</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Priority</TableHead>
                    <TableHead className="font-semibold">Submitted</TableHead>
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
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <CalendarDays className="h-4 w-4 text-slate-600" />
                          </div>
                          <Badge className={getTypeColor(request.leaveType)}>
                            {getLeaveTypeDisplayName(request.leaveType)}
                          </Badge>
                        </div>
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
                          <Clock3 className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{request.days}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-slate-900 truncate" title={request.reason}>
                            {request.reason}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                          {request.status === 'approved' && (
                            <Badge className={getPaidStatusColor(request.isPaid)}>
                              {request.isPaid ? 'Paid' : 'Unpaid'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-slate-900">
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </p>
                          <p className="text-slate-500">
                            {new Date(request.submittedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-white/20">
                            <DropdownMenuItem 
                              className="hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => {
                                // Convert local LeaveRequest to LeaveRequestType format
                                const detailRequest: LeaveRequestType = {
                                  id: request.id,
                                  leaveType: request.leaveType as any,
                                  startDate: request.startDate,
                                  endDate: request.endDate,
                                  totalDays: request.days,
                                  reason: request.reason,
                                  status: request.status,
                                  priority: request.priority || 'medium',
                                  isPaid: request.isPaid ?? true, // Use actual isPaid value from request
                                  isHalfDay: request.isHalfDay || false,
                                  halfDayPeriod: request.halfDayPeriod as any,
                                  submittedAt: request.submittedAt,
                                  employee: {
                                    id: user?.id || '',
                                    name: user?.name || 'Unknown',
                                    email: user?.email || '',
                                    department: user?.department || 'Unassigned',
                                    avatar: user?.profilePicture || undefined
                                  }
                                };
                                setSelectedRequest(detailRequest);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {request.status === 'pending' && (
                              <DropdownMenuItem className="hover:bg-orange-50 hover:text-orange-700">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Cancel Request
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="hover:bg-green-50 hover:text-green-700">
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
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
        </CardContent>
        </Card>
      </div>

        </div>
      </div>
      
      {/* Leave Request Details Modal */}
      {selectedRequest && (
        <LeaveRequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          canApprove={false}
        />
      )}
    </div>
  );
};

export default LeaveHistoryPage;